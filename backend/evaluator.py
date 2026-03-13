import os

# Disable parallel tokenizers to prevent deadlocks/crashes on macOS
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import numpy as np
from typing import List, Dict, Any
import json
import re
from models import RAGMetrics, TestCase
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, context_precision, context_recall
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import nest_asyncio
import asyncio

load_dotenv()

class RagEvaluator:
    def __init__(
        self,
        alpha: float = 0.4,
        beta: float = 0.3,
        gamma: float = 0.3,
        model_name: str = "gpt-4o",
        temperature: float = 0.0,
        faithfulness_enabled: bool = True,
        answer_relevancy_enabled: bool = True,
        answer_correctness_enabled: bool = True,
        context_recall_enabled: bool = True,
        context_precision_enabled: bool = True,
        toxicity_enabled: bool = True,
    ):
        nest_asyncio.apply()
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.metric_enabled = {
            "faithfulness": bool(faithfulness_enabled),
            "answer_relevancy": bool(answer_relevancy_enabled),
            "answer_correctness": bool(answer_correctness_enabled),
            "context_recall": bool(context_recall_enabled),
            "context_precision": bool(context_precision_enabled),
            "toxicity": bool(toxicity_enabled),
        }
        # Keep deterministic by default, but honor API when explicitly set.
        self.temperature = max(0.0, min(1.0, self._safe_float(temperature)))
        self.model_name = model_name
        self.eval_schema_version = "v7_metric_toggles"
        self.default_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        self.batch_size = int(os.getenv("EVAL_BATCH_SIZE", "4"))
        self.max_parallel_batches = int(os.getenv("EVAL_MAX_PARALLEL_BATCHES", "2"))
        if not self.model_name:
            self.model_name = self.default_deployment
        
        # Initialize Azure OpenAI (GPT-4o)
        self.llm = AzureChatOpenAI(
            azure_deployment=self.model_name,
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            temperature=self.temperature
        )
        
        prompts_dir = os.path.join(os.path.dirname(__file__), "prompts")
        self.metric_prompt_templates = {}
        for metric, filename in {
            "answer_relevancy": "answer_relevancy_batch_prompt.txt",
            "answer_correctness": "answer_correctness_batch_prompt.txt",
            "toxicity": "toxicity_batch_prompt.txt",
        }.items():
            with open(os.path.join(prompts_dir, filename), "r", encoding="utf-8") as f:
                self.metric_prompt_templates[metric] = f.read()

    def calculate_rqs(self, metrics: RAGMetrics) -> float:
        """
        RQS Score (Production Grade):
        Weighted composite of Core NLP accuracy, RAG Triad, and Intent alignment.
        """
        # Base configured weights (before enable/disable adjustments).
        remaining = max(0.0, 1.0 - (self.alpha + self.beta + self.gamma))
        raw_weights = {
            "answer_correctness": max(0.0, self.alpha),
            "faithfulness": max(0.0, self.beta),
            "answer_relevancy": max(0.0, self.gamma),
            "context_precision": remaining / 2.0,
            "context_recall": remaining / 2.0,
        }
        values = {
            "answer_correctness": self._clamp01(metrics.answer_correctness),
            "faithfulness": self._clamp01(metrics.faithfulness),
            "answer_relevancy": self._clamp01(metrics.answer_relevancy),
            "context_precision": self._clamp01(metrics.context_precision),
            "context_recall": self._clamp01(metrics.context_recall),
        }
        enabled = {
            "answer_correctness": self.metric_enabled.get("answer_correctness", True),
            "faithfulness": self.metric_enabled.get("faithfulness", True),
            "answer_relevancy": self.metric_enabled.get("answer_relevancy", True),
            "context_precision": self.metric_enabled.get("context_precision", True),
            "context_recall": self.metric_enabled.get("context_recall", True),
        }
        active_keys = [k for k, is_on in enabled.items() if is_on]
        if not active_keys:
            return 0.0

        active_weight_sum = sum(raw_weights[k] for k in active_keys)
        if active_weight_sum <= 0:
            # Fallback if configured weights collapse to zero for active metrics.
            normalized_weights = {k: 1.0 / len(active_keys) for k in active_keys}
        else:
            normalized_weights = {k: raw_weights[k] / active_weight_sum for k in active_keys}

        rqs = sum(normalized_weights[k] * values[k] for k in active_keys)
        return round(self._clamp01(rqs), 4)

    def _safe_float(self, value) -> float:
        """Sanitizes float values to be JSON compliant (no NaN/Inf)"""
        try:
            val = float(value)
            return val if np.isfinite(val) else 0.0
        except (TypeError, ValueError):
            return 0.0

    def _generate_cache_key(self, query: str, answer: str, contexts: List[str], ground_truth: str) -> str:
        import hashlib
        import json
        # Robust hashing: include model name and temperature to ensure score consistency if params change
        payload = {
            "q": str(query).strip(),
            "a": str(answer).strip(),
            "c": sorted([str(ctx).strip() for ctx in contexts]),
            "gt": str(ground_truth or "").strip(),
            "m": str(self.model_name).lower().strip(),
            "t": f"{self.temperature:.3f}",
            "enabled": self.metric_enabled,
            "schema": self.eval_schema_version
        }
        dump = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(dump.encode()).hexdigest()

    def _clamp01(self, value: float) -> float:
        return min(1.0, max(0.0, self._safe_float(value)))

    def _apply_metric_toggles(self, metrics: RAGMetrics) -> RAGMetrics:
        if not self.metric_enabled.get("faithfulness", True):
            metrics.faithfulness = 0.0
        if not self.metric_enabled.get("answer_relevancy", True):
            metrics.answer_relevancy = 0.0
        if not self.metric_enabled.get("answer_correctness", True):
            metrics.answer_correctness = 0.0
            metrics.semantic_similarity = 0.0
        if not self.metric_enabled.get("context_recall", True):
            metrics.context_recall = 0.0
        if not self.metric_enabled.get("context_precision", True):
            metrics.context_precision = 0.0
        if not self.metric_enabled.get("toxicity", True):
            metrics.toxicity = 0.0
        return metrics

    def _extract_json_payload(self, text: str) -> Any:
        text = (text or "").strip()
        if not text:
            return None
        try:
            return json.loads(text)
        except Exception:
            pass

        code_match = re.search(r"```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```", text, re.IGNORECASE)
        if code_match:
            try:
                return json.loads(code_match.group(1))
            except Exception:
                pass

        obj_start = text.find("{")
        obj_end = text.rfind("}")
        if obj_start != -1 and obj_end > obj_start:
            try:
                return json.loads(text[obj_start:obj_end + 1])
            except Exception:
                pass
        return None

    def _normalize_metrics(self, raw: Dict[str, Any]) -> Dict[str, float]:
        return {
            "faithfulness": self._clamp01(raw.get("faithfulness", 0.0)),
            "answer_relevancy": self._clamp01(raw.get("answer_relevancy", 0.0)),
            "context_recall": self._clamp01(raw.get("context_recall", 0.0)),
            "context_precision": self._clamp01(raw.get("context_precision", 0.0)),
            "answer_correctness": self._clamp01(raw.get("answer_correctness", 0.0)),
            "toxicity": self._clamp01(raw.get("toxicity", 0.0)),
        }

    async def _score_batch_for_metric(self, metric_name: str, batch_items: List[Dict[str, Any]]) -> Dict[str, float]:
        template = self.metric_prompt_templates.get(metric_name)
        if not template:
            return {item["case_id"]: 0.0 for item in batch_items}

        payload = [
            {
                "case_id": item["case_id"],
                "question": item["question"],
                "answer": item["answer"],
                "context": item["context"],
                "ground_truth": item["ground_truth"],
            }
            for item in batch_items
        ]
        prompt = template.replace(
            "{{BATCH_INPUT_JSON}}",
            json.dumps(payload, ensure_ascii=False, indent=2),
        )

        response = await asyncio.to_thread(self.llm.invoke, prompt)
        parsed = self._extract_json_payload(getattr(response, "content", ""))
        if not parsed:
            return {item["case_id"]: 0.0 for item in batch_items}

        rows = parsed.get("results", []) if isinstance(parsed, dict) else parsed
        if not isinstance(rows, list):
            return {item["case_id"]: 0.0 for item in batch_items}

        by_case: Dict[str, float] = {}
        for i, row in enumerate(rows):
            if not isinstance(row, dict):
                continue
            case_id = row.get("case_id")
            if not case_id and i < len(batch_items):
                case_id = batch_items[i]["case_id"]
            if case_id:
                by_case[str(case_id)] = self._clamp01(row.get("score", 0.0))

        for item in batch_items:
            by_case.setdefault(item["case_id"], 0.0)
        return by_case

    def _chunk(self, items: List[Any], size: int) -> List[List[Any]]:
        size = max(1, size)
        return [items[i:i + size] for i in range(0, len(items), size)]

    async def _evaluate_bot(self, bid: str, dataset: List[TestCase]) -> Dict[str, RAGMetrics]:
        """Worker task for parallel evaluation with DB lookup"""
        from database import SessionLocal, MetricCache
        
        db = SessionLocal()
        try:
            print(f"DEBUG: Processing metrics for {bid}...")
            
            bot_results = {}
            pending_cases = []
            
            # 1. First Pass: Batch cache lookup to avoid N+1 DB queries.
            case_rows = []
            for case in dataset:
                q = case.query
                a = case.bot_responses.get(bid, "")
                c = case.bot_contexts.get(bid, [])
                gt = case.ground_truth or ""
                ckey = self._generate_cache_key(q, a, c, gt)
                case_rows.append((case, ckey))

            cache_keys = [ckey for _, ckey in case_rows]
            cached_rows = (
                db.query(MetricCache)
                .filter(MetricCache.cache_key.in_(cache_keys))
                .all()
                if cache_keys
                else []
            )
            cached_by_key = {row.cache_key: row for row in cached_rows}

            for case, ckey in case_rows:
                cached = cached_by_key.get(ckey)
                if cached:
                    # Reuse cached metrics
                    print(f"DEBUG: [CACHE_HIT] {bid} | Hash: {ckey[:12]} | Scenario: {case.id}")
                    m_data = cached.metrics
                    metrics = RAGMetrics(**m_data)
                    metrics = self._apply_metric_toggles(metrics)
                    # Recalculate RQS in case alpha/beta/gamma changed
                    metrics.rqs = self.calculate_rqs(metrics)
                    bot_results[case.id] = metrics
                else:
                    print(f"DEBUG: [CACHE_MISS] {bid} | Hash: {ckey[:12]} | Scenario: {case.id}")
                    pending_cases.append(case)

            # 2. Second Pass: Evaluate only what's missing (RAGAS + LLM toxicity).
            if pending_cases:
                print(f"DEBUG: Evaluating {len(pending_cases)} new cases for {bid}...")
                data = {
                    "question": [case.query for case in pending_cases],
                    "answer": [case.bot_responses.get(bid, "") for case in pending_cases],
                    "contexts": [case.bot_contexts.get(bid, []) for case in pending_cases],
                    "ground_truth": [case.ground_truth if case.ground_truth else "" for case in pending_cases]
                }
                rag_dataset = Dataset.from_dict(data)
                
                import time
                start_time = time.time()

                ragas_metric_defs = []
                if self.metric_enabled.get("faithfulness", True):
                    ragas_metric_defs.append(faithfulness)
                if self.metric_enabled.get("context_recall", True):
                    ragas_metric_defs.append(context_recall)
                if self.metric_enabled.get("context_precision", True):
                    ragas_metric_defs.append(context_precision)

                eval_latency = 0.0
                if ragas_metric_defs:
                    result = await asyncio.to_thread(
                        evaluate,
                        rag_dataset,
                        metrics=ragas_metric_defs,
                        llm=self.llm,
                    )
                    eval_latency = (time.time() - start_time) / len(pending_cases) * 1000
                    df = result.to_pandas()
                else:
                    df = None
                pending_items = [
                    {
                        "case_id": case.id,
                        "question": case.query,
                        "answer": case.bot_responses.get(bid, ""),
                        "context": case.bot_contexts.get(bid, []),
                        "ground_truth": case.ground_truth or "",
                    }
                    for case in pending_cases
                ]
                chunks = self._chunk(pending_items, self.batch_size)
                semaphore = asyncio.Semaphore(max(1, self.max_parallel_batches))

                async def run_metric_chunk(metric_name: str, chunk_items: List[Dict[str, Any]]) -> Dict[str, float]:
                    async with semaphore:
                        return await self._score_batch_for_metric(metric_name, chunk_items)

                llm_scores: Dict[str, Dict[str, float]] = {
                    "answer_relevancy": {},
                    "answer_correctness": {},
                    "toxicity": {},
                }
                llm_metric_names = []
                if self.metric_enabled.get("answer_relevancy", True):
                    llm_metric_names.append("answer_relevancy")
                if self.metric_enabled.get("answer_correctness", True):
                    llm_metric_names.append("answer_correctness")
                if self.metric_enabled.get("toxicity", True):
                    llm_metric_names.append("toxicity")
                for metric_name in llm_metric_names:
                    chunk_results = await asyncio.gather(
                        *[run_metric_chunk(metric_name, chunk) for chunk in chunks]
                    )
                    merged: Dict[str, float] = {}
                    for part in chunk_results:
                        merged.update(part)
                    llm_scores[metric_name] = merged

                for i, case in enumerate(pending_cases):
                    ragas_m = df.iloc[i] if df is not None else {}
                    metrics = RAGMetrics(
                        faithfulness=self._safe_float(ragas_m.get('faithfulness', 0.0)) if self.metric_enabled.get("faithfulness", True) else 0.0,
                        answer_relevancy=self._safe_float(llm_scores["answer_relevancy"].get(case.id, 0.0)) if self.metric_enabled.get("answer_relevancy", True) else 0.0,
                        context_recall=self._safe_float(ragas_m.get('context_recall', 0.0)) if self.metric_enabled.get("context_recall", True) else 0.0,
                        context_precision=self._safe_float(ragas_m.get('context_precision', 0.0)) if self.metric_enabled.get("context_precision", True) else 0.0,
                        semantic_similarity=self._safe_float(llm_scores["answer_correctness"].get(case.id, 0.0)) if self.metric_enabled.get("answer_correctness", True) else 0.0,
                        answer_correctness=self._safe_float(llm_scores["answer_correctness"].get(case.id, 0.0)) if self.metric_enabled.get("answer_correctness", True) else 0.0,
                        toxicity=self._safe_float(llm_scores["toxicity"].get(case.id, 0.0)) if self.metric_enabled.get("toxicity", True) else 0.0,
                        latency_ms=self._safe_float(eval_latency)
                    )
                    metrics = self._apply_metric_toggles(metrics)
                    response_text = case.bot_responses.get(bid, "")
                    token_est = int(len(response_text.split()) * 1.35) + 45
                    metrics.total_tokens = token_est
                    metrics.rqs = self.calculate_rqs(metrics)
                    
                    bot_results[case.id] = metrics
                    
                    # Store in DB for future lookup
                    q = case.query
                    a = case.bot_responses.get(bid, "")
                    c = case.bot_contexts.get(bid, [])
                    gt = case.ground_truth or ""
                    ckey = self._generate_cache_key(q, a, c, gt)
                    
                    new_cache = MetricCache(
                        cache_key=ckey,
                        metrics=metrics.model_dump()
                    )
                    db.merge(new_cache) # use merge to avoid primary key conflicts
                
                db.commit()

            hit_count = len(dataset) - len(pending_cases)
            print(f"DEBUG: Finalized {bid} | Hits: {hit_count}/{len(dataset)} | New: {len(pending_cases)}")
            return {bid: bot_results}
        except Exception as e:
            import traceback
            error_msg = f"CRITICAL ERROR evaluating {bid}: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            
            # Log which specific test cases failed
            print(f"Failed test case IDs for {bid}: {[case.id for case in dataset]}")
            
            # Re-raise to propagate to main handler
            raise RuntimeError(f"Bot {bid} evaluation failed: {str(e)}") from e
        finally:
            db.close()

    async def run_multi_bot_evaluation(self, dataset: List[TestCase]) -> Dict[str, Any]:
        if not dataset:
            raise ValueError("Dataset must contain at least one test case.")

        bot_ids = list(dataset[0].bot_responses.keys())
        if not bot_ids:
            raise ValueError("Each test case must include at least one bot response.")
        
        # Sequential Execution to prevent memory corruption/double free on macOS
        worker_results = []
        for bid in bot_ids:
            res = await self._evaluate_bot(bid, dataset)
            worker_results.append(res)
        
        # Merge results
        bot_metrics_result = {}
        for res in worker_results:
            bot_metrics_result.update(res)

        # Summaries & Leaderboard
        summaries = {}
        leaderboard = []
        for bid in bot_ids:
            # FIX: Do not filter out 0 values, as it inflates the averages incorrectly.
            m_values = list(bot_metrics_result[bid].values())
            avg_rqs = self._safe_float(np.mean([m.rqs for m in m_values])) if m_values else 0.0
            avg_correctness = self._safe_float(np.mean([m.semantic_similarity for m in m_values])) if m_values else 0.0
            avg_recall = self._safe_float(np.mean([m.context_recall for m in m_values])) if m_values else 0.0
            avg_faith = self._safe_float(np.mean([m.faithfulness for m in m_values])) if m_values else 0.0
            avg_relevancy = self._safe_float(np.mean([m.answer_relevancy for m in m_values])) if m_values else 0.0
            avg_precision = self._safe_float(np.mean([m.context_precision for m in m_values])) if m_values else 0.0
            avg_toxicity = self._safe_float(np.mean([m.toxicity for m in m_values])) if m_values else 0.0
            avg_latency = self._safe_float(np.mean([m.latency_ms for m in m_values])) if m_values else 0.0
            
            summaries[bid] = {
                "avg_rqs": float(round(avg_rqs, 4)),
                "gt_alignment": float(round(avg_correctness, 4)),
                "retrieval_success": float(round(avg_recall, 4)),
                "avg_faithfulness": float(round(avg_faith, 4)),
                "avg_relevancy": float(round(avg_relevancy, 4)),
                "avg_context_precision": float(round(avg_precision, 4)),
                "avg_toxicity": float(round(avg_toxicity, 4)),
                "avg_latency": float(round(avg_latency, 2)),
                "avg_tokens": int(np.mean([m.total_tokens for m in m_values])) if m_values else 0,
                "total_queries": len(dataset)
            }
            leaderboard.append({
                "bot_id": bid,
                "avg_rqs": float(round(avg_rqs, 4)),
                "gt_alignment": float(round(avg_correctness, 4)),
                "retrieval_success": float(round(avg_recall, 4)),
                "avg_faithfulness": float(round(avg_faith, 4)),
                "avg_relevancy": float(round(avg_relevancy, 4)),
                "avg_context_precision": float(round(avg_precision, 4)),
                "avg_toxicity": float(round(avg_toxicity, 4)),
                "avg_latency": float(round(avg_latency, 2)),
                "avg_tokens": int(np.mean([m.total_tokens for m in m_values])) if m_values else 0
            })
            
        leaderboard.sort(key=lambda x: x["avg_rqs"], reverse=True)
        return {
            "bot_metrics": bot_metrics_result,
            "summaries": summaries,
            "leaderboard": leaderboard,
            "winner": leaderboard[0]["bot_id"] if leaderboard else None
        }
