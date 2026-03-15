import os
import logging

# Disable parallel tokenizers to prevent deadlocks/crashes on macOS
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import numpy as np
from typing import List, Dict, Any
import json
import re
import time
from models import RAGMetrics, TestCase

logger = logging.getLogger("rageval.evaluator")
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, context_precision, context_recall
from ragas.llms import LangchainLLMWrapper
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import nest_asyncio
import asyncio

load_dotenv()

# Apply once at module level — safe to call multiple times but avoids
# repeated global event-loop patching on every RagEvaluator instantiation.
nest_asyncio.apply()

# Hard cap on total Ragas timeout regardless of dataset size (10 minutes).
_RAGAS_TIMEOUT_CAP_SECONDS = 600

class RagEvaluator:
    def __init__(
        self,
        alpha: float = 0.35,
        beta: float = 0.25,
        gamma: float = 0.25,
        model_name: str = "gpt-4o",
        temperature: float = 0.0,
        faithfulness_enabled: bool = True,
        answer_relevancy_enabled: bool = True,
        answer_correctness_enabled: bool = True,
        context_recall_enabled: bool = True,
        context_precision_enabled: bool = True,
        toxicity_enabled: bool = True,
    ):
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
        self.eval_schema_version = "v10_ragas_llm_prompt_hybrid"
        self.default_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        self.batch_size = int(os.getenv("EVAL_BATCH_SIZE", "4"))
        self.max_parallel_batches = int(os.getenv("EVAL_MAX_PARALLEL_BATCHES", "2"))
        self.max_context_chars = int(os.getenv("EVAL_MAX_CONTEXT_CHARS", "3500"))
        self.parallel_bots_enabled = os.getenv("EVAL_PARALLEL_BOTS", "false").strip().lower() in {"1", "true", "yes", "on"}
        self.max_parallel_bots = int(os.getenv("EVAL_MAX_PARALLEL_BOTS", "2"))
        # Timeout (seconds) for a single LLM batch call. 0 = disabled.
        self.llm_timeout_seconds = float(os.getenv("EVAL_LLM_TIMEOUT_SECONDS", "120"))
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
        # Wrap LLM for RAGAS — explicit LLM binding ensures RAGAS never falls
        # back to initialising an embedding model (faithfulness, context_precision,
        # context_recall are LLM-only metrics; embeddings=None is passed at call site).
        self.ragas_llm = LangchainLLMWrapper(self.llm)

        prompts_dir = os.path.join(os.path.dirname(__file__), "prompts")
        with open(os.path.join(prompts_dir, "combined_metrics_batch_prompt.txt"), "r", encoding="utf-8") as f:
            self.combined_metrics_prompt = f.read()

    def calculate_rqs(self, metrics: RAGMetrics, extra_disabled: set = None) -> float:
        """
        RQS Score (Production Grade):
        Weighted composite of Core NLP accuracy, RAG Triad, and Intent alignment.

        extra_disabled: optional set of metric keys to exclude from this calculation
        without altering self.metric_enabled (e.g. answer_correctness when no ground_truth).
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
        if extra_disabled:
            for k in extra_disabled:
                if k in enabled:
                    enabled[k] = False
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

    def compute_confusion_matrix(
        self,
        bot_metrics: Dict[str, Dict[str, "RAGMetrics"]],
        thresholds: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Builds a per-bot retrieval × generation confusion matrix.

        Axes:
          - Retrieval quality : context_recall  >= threshold  → positive
          - Generation quality: answer_correctness >= threshold → positive

        Quadrants:
          TP — good retrieval  + correct answer   (pipeline working end-to-end)
          FN — good retrieval  + wrong answer     (generation model issue)
          FP — poor retrieval  + correct answer   (bot using prior knowledge / lucky)
          TN — poor retrieval  + wrong answer     (retrieval layer failing)

        Cases where answer_correctness == 0.0 AND context_recall == 0.0 are
        skipped (no ground_truth, metric not measured).

        Also computes per-metric pass rates for a heatmap view.
        """
        recall_t    = float(thresholds.get("context_recall",    0.75))
        correct_t   = float(thresholds.get("answer_correctness", 0.80))
        faith_t     = float(thresholds.get("faithfulness",       0.80))
        relevancy_t = float(thresholds.get("answer_relevancy",   0.80))
        precision_t = float(thresholds.get("context_precision",  0.75))
        rqs_t       = float(thresholds.get("rqs",                0.75))

        result: Dict[str, Any] = {}
        for bid, case_metrics in bot_metrics.items():
            tp = fp = fn = tn = skipped = 0
            metric_pass: Dict[str, int] = {
                "faithfulness": 0, "answer_relevancy": 0,
                "answer_correctness": 0, "context_recall": 0,
                "context_precision": 0, "rqs": 0,
            }
            total_cases = len(case_metrics)

            for m in case_metrics.values():
                # Skip cases where key RAG metrics were never measured
                if m.answer_correctness == 0.0 and m.context_recall == 0.0:
                    skipped += 1
                else:
                    good_retrieval  = m.context_recall    >= recall_t
                    good_generation = m.answer_correctness >= correct_t
                    if good_retrieval and good_generation:
                        tp += 1
                    elif good_retrieval and not good_generation:
                        fn += 1
                    elif not good_retrieval and good_generation:
                        fp += 1
                    else:
                        tn += 1

                # Per-metric pass counts (all cases, not just GT ones)
                if m.faithfulness      >= faith_t:     metric_pass["faithfulness"]      += 1
                if m.answer_relevancy  >= relevancy_t: metric_pass["answer_relevancy"]  += 1
                if m.answer_correctness >= correct_t:  metric_pass["answer_correctness"] += 1
                if m.context_recall    >= recall_t:    metric_pass["context_recall"]    += 1
                if m.context_precision >= precision_t: metric_pass["context_precision"] += 1
                if m.rqs               >= rqs_t:       metric_pass["rqs"]               += 1

            measured = tp + fp + fn + tn
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1        = (2 * precision * recall / (precision + recall)
                         if (precision + recall) > 0 else 0.0)
            accuracy  = (tp + tn) / measured if measured > 0 else 0.0

            pass_rates = {
                k: round(v / total_cases, 4) if total_cases > 0 else 0.0
                for k, v in metric_pass.items()
            }

            result[bid] = {
                "matrix":       {"TP": tp, "FP": fp, "FN": fn, "TN": tn},
                "precision":    round(precision, 4),
                "recall":       round(recall,    4),
                "f1":           round(f1,        4),
                "accuracy":     round(accuracy,  4),
                "pass_rates":   pass_rates,
                "total_cases":  total_cases,
                "measured_cases": measured,
                "skipped_no_gt": skipped,
                "thresholds":   {
                    "context_recall":     recall_t,
                    "answer_correctness": correct_t,
                },
            }
        return result

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

    def _context_to_text(self, context_value: Any) -> str:
        if isinstance(context_value, list):
            text = "\n".join([str(c) for c in context_value if c is not None])
        else:
            text = str(context_value or "")
        text = text.strip()
        if len(text) <= self.max_context_chars:
            return text
        return text[: self.max_context_chars]

    async def _score_batch_combined_metrics(self, batch_items: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        template = self.combined_metrics_prompt
        if not template:
            return {
                item["case_id"]: {"answer_relevancy": 0.0, "answer_correctness": 0.0, "toxicity": 0.0}
                for item in batch_items
            }

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

        timeout = self.llm_timeout_seconds if self.llm_timeout_seconds > 0 else None
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(self.llm.invoke, prompt),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            raise RuntimeError(
                f"LLM call timed out after {timeout}s. "
                "Increase EVAL_LLM_TIMEOUT_SECONDS or reduce batch size."
            )
        parsed = self._extract_json_payload(getattr(response, "content", ""))
        rows = parsed.get("results", []) if isinstance(parsed, dict) else parsed
        if not isinstance(rows, list):
            rows = []

        by_case: Dict[str, Dict[str, float]] = {}
        for i, row in enumerate(rows):
            if not isinstance(row, dict):
                continue
            case_id = row.get("case_id")
            if not case_id and i < len(batch_items):
                case_id = batch_items[i]["case_id"]
            if not case_id:
                continue
            by_case[str(case_id)] = {
                "answer_relevancy": self._clamp01(row.get("answer_relevancy", 0.0)),
                "answer_correctness": self._clamp01(row.get("answer_correctness", 0.0)),
                "toxicity": self._clamp01(row.get("toxicity", 0.0)),
            }

        for item in batch_items:
            by_case.setdefault(
                item["case_id"],
                {"answer_relevancy": 0.0, "answer_correctness": 0.0, "toxicity": 0.0},
            )
        return by_case

    def _persist_cache_rows(self, db, MetricCache, rows: List[Dict[str, Any]]) -> None:
        if not rows:
            return
        # db.bind was removed in SQLAlchemy 2.x; always attempt the SQLite
        # bulk-upsert path first and fall back to individual merges on failure.
        try:
            from sqlalchemy.dialects.sqlite import insert as sqlite_insert
            from datetime import datetime, timezone

            stmt = sqlite_insert(MetricCache).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=[MetricCache.cache_key],
                set_={
                    "metrics": stmt.excluded.metrics,
                    "timestamp": datetime.now(timezone.utc).replace(tzinfo=None),
                },
            )
            db.execute(stmt)
        except Exception:
            # Fallback for non-SQLite engines or unexpected dialect errors.
            for row in rows:
                db.merge(MetricCache(**row))

    def _chunk(self, items: List[Any], size: int) -> List[List[Any]]:
        size = max(1, size)
        return [items[i:i + size] for i in range(0, len(items), size)]

    async def _evaluate_bot(self, bid: str, dataset: List[TestCase]) -> Dict[str, RAGMetrics]:
        """Worker task for parallel evaluation with DB lookup"""
        from database import SessionLocal, MetricCache
        
        db = SessionLocal()
        try:
            bot_start = time.perf_counter()
            logger.debug("Processing metrics for %s", bid)
            
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

            cache_lookup_start = time.perf_counter()
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
                    logger.debug("[CACHE_HIT] %s | Hash: %s | Scenario: %s", bid, ckey[:12], case.id)
                    m_data = cached.metrics
                    metrics = RAGMetrics(**m_data)
                    metrics = self._apply_metric_toggles(metrics)
                    # Recalculate RQS in case alpha/beta/gamma changed.
                    # Mirror the same no-ground_truth exclusion used for fresh evaluations:
                    # answer_correctness=0.0 means "not measured", not "wrong", so it must
                    # be excluded from RQS when no ground_truth exists.
                    _has_gt = bool((case.ground_truth or "").strip())
                    _rqs_extra_disabled = {"answer_correctness"} if not _has_gt else None
                    metrics.rqs = self.calculate_rqs(metrics, extra_disabled=_rqs_extra_disabled)
                    bot_results[case.id] = metrics
                else:
                    logger.debug("[CACHE_MISS] %s | Hash: %s | Scenario: %s", bid, ckey[:12], case.id)
                    pending_cases.append(case)

            # 2. Second Pass: Evaluate only what's missing.
            #    - RAGAS (LLM-only metrics, no embeddings): faithfulness, context_precision, context_recall
            #    - LLM batch prompt: answer_relevancy, answer_correctness, toxicity
            if pending_cases:
                logger.info("Evaluating %d new cases for %s", len(pending_cases), bid)

                pending_start = time.perf_counter()

                # --- RAGAS: faithfulness, context_precision, context_recall ---
                # These three metrics are LLM-only inside RAGAS (no embeddings).
                # We pass ragas_llm explicitly and embeddings=None to guarantee
                # no embedding model is ever initialised.
                ragas_metric_defs = []
                if self.metric_enabled.get("faithfulness", True):
                    ragas_metric_defs.append(faithfulness)
                if self.metric_enabled.get("context_recall", True):
                    ragas_metric_defs.append(context_recall)
                if self.metric_enabled.get("context_precision", True):
                    ragas_metric_defs.append(context_precision)

                # Build inputs for both scorers upfront.
                pending_items = [
                    {
                        "case_id": case.id,
                        "question": case.query,
                        "answer": case.bot_responses.get(bid, ""),
                        "context": self._context_to_text(case.bot_contexts.get(bid, [])),
                        "ground_truth": case.ground_truth or "",
                    }
                    for case in pending_cases
                ]

                # --- Run RAGAS and LLM batch concurrently (independent scorers) ---
                async def run_ragas() -> Any:
                    if not ragas_metric_defs:
                        return None
                    data = {
                        "question": [case.query for case in pending_cases],
                        "answer": [case.bot_responses.get(bid, "") for case in pending_cases],
                        "contexts": [case.bot_contexts.get(bid, []) for case in pending_cases],
                        "ground_truth": [case.ground_truth or "" for case in pending_cases],
                    }
                    rag_dataset = Dataset.from_dict(data)
                    ragas_timeout = (
                        min(self.llm_timeout_seconds * len(pending_cases), _RAGAS_TIMEOUT_CAP_SECONDS)
                        if self.llm_timeout_seconds > 0 else None
                    )
                    try:
                        result = await asyncio.wait_for(
                            asyncio.to_thread(
                                evaluate,
                                rag_dataset,
                                metrics=ragas_metric_defs,
                                llm=self.ragas_llm,
                                embeddings=None,
                            ),
                            timeout=ragas_timeout,
                        )
                    except asyncio.TimeoutError:
                        raise RuntimeError(
                            f"Ragas evaluation timed out after {ragas_timeout}s for {bid}. "
                            "Reduce dataset size or increase EVAL_LLM_TIMEOUT_SECONDS."
                        )
                    result_df = result.to_pandas()
                    if len(result_df) != len(pending_cases):
                        logger.error(
                            "RAGAS row count mismatch: expected %d rows, got %d for %s — "
                            "zeroing RAGAS metrics to prevent positional misalignment",
                            len(pending_cases), len(result_df), bid,
                        )
                        return None
                    return result_df

                async def run_llm_batch() -> Dict[str, Dict[str, float]]:
                    scores: Dict[str, Dict[str, float]] = {
                        "answer_relevancy": {}, "answer_correctness": {}, "toxicity": {},
                    }
                    if not (
                        self.metric_enabled.get("answer_relevancy", True)
                        or self.metric_enabled.get("answer_correctness", True)
                        or self.metric_enabled.get("toxicity", True)
                    ):
                        return scores
                    chunks = self._chunk(pending_items, self.batch_size)
                    semaphore = asyncio.Semaphore(max(1, self.max_parallel_batches))

                    async def run_chunk(chunk_items):
                        async with semaphore:
                            return await self._score_batch_combined_metrics(chunk_items)

                    llm_start = time.perf_counter()
                    chunk_results = await asyncio.gather(*[run_chunk(c) for c in chunks])
                    merged: Dict[str, Dict[str, float]] = {}
                    for part in chunk_results:
                        merged.update(part)
                    for case_id, s in merged.items():
                        scores["answer_relevancy"][case_id] = s.get("answer_relevancy", 0.0)
                        scores["answer_correctness"][case_id] = s.get("answer_correctness", 0.0)
                        scores["toxicity"][case_id] = s.get("toxicity", 0.0)
                    logger.info("LLM combined scoring for %s took %.2fs across %d chunk(s)", bid, time.perf_counter() - llm_start, len(chunks))
                    return scores

                df, llm_scores = await asyncio.gather(run_ragas(), run_llm_batch())

                eval_latency = (time.perf_counter() - pending_start) / len(pending_cases) * 1000

                cache_rows_to_upsert: List[Dict[str, Any]] = []
                for i, case in enumerate(pending_cases):
                    ragas_m = df.iloc[i] if df is not None else {}
                    # answer_correctness requires ground_truth; score is meaningless without it.
                    has_gt = bool((case.ground_truth or "").strip())
                    ac_score = (
                        self._safe_float(llm_scores["answer_correctness"].get(case.id, 0.0))
                        if (self.metric_enabled.get("answer_correctness", True) and has_gt)
                        else 0.0
                    )
                    metrics = RAGMetrics(
                        faithfulness=self._safe_float(ragas_m.get("faithfulness", 0.0)) if self.metric_enabled.get("faithfulness", True) else 0.0,
                        answer_relevancy=self._safe_float(llm_scores["answer_relevancy"].get(case.id, 0.0)) if self.metric_enabled.get("answer_relevancy", True) else 0.0,
                        context_recall=self._safe_float(ragas_m.get("context_recall", 0.0)) if self.metric_enabled.get("context_recall", True) else 0.0,
                        context_precision=self._safe_float(ragas_m.get("context_precision", 0.0)) if self.metric_enabled.get("context_precision", True) else 0.0,
                        semantic_similarity=ac_score,
                        answer_correctness=ac_score,
                        toxicity=self._safe_float(llm_scores["toxicity"].get(case.id, 0.0)) if self.metric_enabled.get("toxicity", True) else 0.0,
                        latency_ms=self._safe_float(eval_latency),
                    )
                    response_text = case.bot_responses.get(bid, "")
                    token_est = int(len(response_text.split()) * 1.35) if response_text.strip() else 0
                    metrics.total_tokens = token_est
                    # Exclude answer_correctness from RQS when no ground_truth is present —
                    # a 0.0 score there means "not measured", not "bot answered incorrectly".
                    rqs_extra_disabled = {"answer_correctness"} if not has_gt else None
                    metrics.rqs = self.calculate_rqs(metrics, extra_disabled=rqs_extra_disabled)
                    
                    bot_results[case.id] = metrics
                    
                    # Store in DB for future lookup
                    q = case.query
                    a = case.bot_responses.get(bid, "")
                    c = case.bot_contexts.get(bid, [])
                    gt = case.ground_truth or ""
                    ckey = self._generate_cache_key(q, a, c, gt)
                    
                    cache_rows_to_upsert.append(
                        {
                            "cache_key": ckey,
                            "metrics": metrics.model_dump(),
                        }
                    )
                
                self._persist_cache_rows(db, MetricCache, cache_rows_to_upsert)
                db.commit()
                logger.debug("Cache write for %s completed in %.2fs", bid, time.perf_counter() - cache_lookup_start)

            hit_count = len(dataset) - len(pending_cases)
            logger.info("Finalized %s | Hits: %d/%d | New: %d | Total time: %.2fs", bid, hit_count, len(dataset), len(pending_cases), time.perf_counter() - bot_start)
            return {bid: bot_results}
        except Exception as e:
            logger.exception("CRITICAL ERROR evaluating %s: %s | Failed case IDs: %s", bid, e, [case.id for case in dataset])
            
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
        
        # Default remains sequential for safety on macOS.
        worker_results = []
        if self.parallel_bots_enabled and len(bot_ids) > 1:
            max_workers = max(1, min(self.max_parallel_bots, len(bot_ids)))
            semaphore = asyncio.Semaphore(max_workers)

            async def run_bot(bid: str):
                async with semaphore:
                    return await self._evaluate_bot(bid, dataset)

            worker_results = await asyncio.gather(*[run_bot(bid) for bid in bot_ids])
        else:
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
