from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from models import (
    EvaluationRequest,
    EvaluationResult,
    TestCase,
    EvaluationSummary,
    RecommendationRequest,
    RecommendationResponse,
)
from evaluator import RagEvaluator
import uuid
from datetime import datetime
import pandas as pd
import io
import math
import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI

def sanitize_floats(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats(v) for v in obj]
    return obj

app = FastAPI(title="RagEval Backend")


def _parse_cors_origins() -> List[str]:
    origins = os.getenv(
        "CORS_ALLOW_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import SessionLocal, EvaluationRecord
import json

load_dotenv()

recommendation_llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
    openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    temperature=0.0,
)


def _validate_thresholds(thresholds: dict):
    for name, value in thresholds.items():
        if not 0.0 <= float(value) <= 1.0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {name}. Thresholds must be between 0 and 1.",
            )

# DB Helper
def save_to_db(result: EvaluationResult):
    db = SessionLocal()
    try:
        # Convert Pydantic model to dict for JSON storage
        res_data = result.model_dump()
        record = EvaluationRecord(
            id=res_data["id"],
            name=res_data["name"],
            timestamp=res_data["timestamp"],
            test_cases=res_data["test_cases"],
            bot_metrics=res_data["bot_metrics"],
            summaries=res_data["summaries"],
            leaderboard=res_data["leaderboard"],
            winner=res_data["winner"],
            config=res_data.get("config", {})
        )
        db.add(record)
        db.commit()
    finally:
        db.close()

@app.get("/latest", response_model=EvaluationResult)
async def get_latest_evaluation():
    db = SessionLocal()
    try:
        record = db.query(EvaluationRecord).order_by(EvaluationRecord.timestamp.desc()).first()
        if not record:
            raise HTTPException(status_code=404, detail="No evaluations found")
        
        return EvaluationResult(
            id=record.id,
            name=record.name,
            timestamp=record.timestamp,
            test_cases=record.test_cases,
            bot_metrics=record.bot_metrics,
            summaries=record.summaries,
            leaderboard=record.leaderboard,
            winner=record.winner,
            config=record.config or {}
        )
    finally:
        db.close()

@app.post("/evaluate-excel", response_model=EvaluationResult)
async def evaluate_excel(
    file: UploadFile = File(...),
    alpha: float = Form(0.4),
    beta: float = Form(0.3),
    gamma: float = Form(0.3),
    model: str = Form(os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")),
    max_rows: int = Form(200),
    temperature: float = Form(0.0),
    faithfulness_enabled: bool = Form(True),
    answer_relevancy_enabled: bool = Form(True),
    answer_correctness_enabled: bool = Form(True),
    context_recall_enabled: bool = Form(True),
    context_precision_enabled: bool = Form(True),
    toxicity_enabled: bool = Form(True),
    faithfulness_threshold: float = Form(0.8),
    answer_relevancy_threshold: float = Form(0.8),
    answer_correctness_threshold: float = Form(0.8),
    context_recall_threshold: float = Form(0.75),
    context_precision_threshold: float = Form(0.75),
    rqs_threshold: float = Form(0.75),
    background_tasks: BackgroundTasks = None
):
    if background_tasks:
        background_tasks.add_task(cleanup_cache)
    try:
        if max_rows <= 0:
            raise HTTPException(status_code=400, detail="max_rows must be greater than 0.")
        _validate_thresholds({
            "faithfulness_threshold": faithfulness_threshold,
            "answer_relevancy_threshold": answer_relevancy_threshold,
            "answer_correctness_threshold": answer_correctness_threshold,
            "context_recall_threshold": context_recall_threshold,
            "context_precision_threshold": context_precision_threshold,
            "rqs_threshold": rqs_threshold,
        })

        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # --- Strict Validation ---
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or contains no data.")
            
        if len(df) > max_rows:
            raise HTTPException(status_code=400, detail=f"Dataset exceeds the safety limit of {max_rows} rows. Received: {len(df)} rows.")
        
        # Dynamically detect bots based on column prefixes
        bot_columns = [col for col in df.columns if col.startswith("Bot_")]
        if not bot_columns:
            raise HTTPException(
                status_code=400,
                detail="At least one bot column is required (expected format: Bot_*).",
            )
        
        # Create a mapping from column name to standardized Bot Name (Bot A, Bot B, ...)
        bot_mapping = {}
        for idx, col in enumerate(bot_columns):
            # Generate "Bot A", "Bot B", ...
            suffix = chr(65 + idx) if idx < 26 else f"{chr(65 + (idx // 26) - 1)}{chr(65 + (idx % 26))}"
            bot_mapping[col] = f"Bot {suffix}"

        # Flexible column detection
        def find_col(possible_names):
            for col in df.columns:
                if any(p.lower() in col.lower().replace(" ", "_") for p in possible_names):
                    return col
            return None

        gt_col = find_col(["ground_truth", "reference", "target", "gt", "expected"])
        query_col = find_col(["query", "question", "input", "prompt"])

        if not query_col:
            raise HTTPException(status_code=400, detail="Critical Error: Missing required 'Query' column in dataset.")

        test_cases = []
        for _, row in df.iterrows():
            bot_responses = {}
            bot_contexts = {}
            
            for bot_col in bot_columns:
                bot_id = bot_mapping[bot_col]
                resp_val = row.get(bot_col)
                bot_responses[bot_id] = str(resp_val) if not pd.isna(resp_val) else ""
                
                # Context detection: specific Context_BotName > BotName_Context > specific Context_A > general Context
                # bot_col is like "Bot_A"
                specific_ctx_1 = bot_col.replace("Bot_", "Context_")
                specific_ctx_2 = bot_col.replace("Bot_", "") + "_Context"
                
                ctx_val = None
                if specific_ctx_1 in df.columns:
                    ctx_val = row.get(specific_ctx_1)
                elif specific_ctx_2 in df.columns:
                    ctx_val = row.get(specific_ctx_2)
                elif "Context" in df.columns:
                    ctx_val = row.get("Context")
                elif "context" in df.columns:
                    ctx_val = row.get("context")
                
                # Sanitize context (handle NaN/None)
                if pd.isna(ctx_val) or ctx_val is None:
                    bot_contexts[bot_id] = []
                else:
                    bot_contexts[bot_id] = [str(ctx_val)]
            
            query_val = row.get(query_col if query_col else "Query")
            gt_val = row.get(gt_col if gt_col else "Ground_Truth")

            test_cases.append(TestCase(
                query=str(query_val) if not pd.isna(query_val) else "N/A",
                bot_responses=bot_responses,
                bot_contexts=bot_contexts,
                ground_truth=str(gt_val) if not pd.isna(gt_val) else None
            ))

        evaluator = RagEvaluator(
            alpha=alpha,
            beta=beta,
            gamma=gamma,
            model_name=model,
            temperature=temperature,
            faithfulness_enabled=faithfulness_enabled,
            answer_relevancy_enabled=answer_relevancy_enabled,
            answer_correctness_enabled=answer_correctness_enabled,
            context_recall_enabled=context_recall_enabled,
            context_precision_enabled=context_precision_enabled,
            toxicity_enabled=toxicity_enabled,
        )
        print(f"DEBUG: Starting evaluation for {len(bot_columns)} models...")
        results = await evaluator.run_multi_bot_evaluation(test_cases)
        print("DEBUG: Evaluation successful!")
        
        eval_id = str(uuid.uuid4())
        result = EvaluationResult(
            id=eval_id,
            name=f"Excel Upload - {file.filename}",
            timestamp=datetime.now(),
            test_cases=test_cases,
            bot_metrics=results["bot_metrics"],
            summaries=results["summaries"],
            leaderboard=results["leaderboard"],
            winner=results["winner"],
            config={
                "model": model,
                "alpha": alpha,
                "beta": beta,
                "gamma": gamma,
                "temperature": temperature,
                "maxRows": max_rows,
                "faithfulnessEnabled": faithfulness_enabled,
                "answerRelevancyEnabled": answer_relevancy_enabled,
                "answerCorrectnessEnabled": answer_correctness_enabled,
                "contextRecallEnabled": context_recall_enabled,
                "contextPrecisionEnabled": context_precision_enabled,
                "toxicityEnabled": toxicity_enabled,
                "faithfulnessThreshold": faithfulness_threshold,
                "answerRelevancyThreshold": answer_relevancy_threshold,
                "answerCorrectnessThreshold": answer_correctness_threshold,
                "contextRecallThreshold": context_recall_threshold,
                "contextPrecisionThreshold": context_precision_threshold,
                "rqsThreshold": rqs_threshold
            }
        )
        
        # Sanitize for JSON compliance
        sanitized_result_data = sanitize_floats(result.model_dump())
        sanitized_result = EvaluationResult(**sanitized_result_data)
        
        save_to_db(sanitized_result)
        return sanitized_result

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Excel processing failed: {str(e)}")

@app.post("/evaluate", response_model=EvaluationResult)
async def run_evaluation(request: EvaluationRequest, background_tasks: BackgroundTasks):
    if background_tasks:
        background_tasks.add_task(cleanup_cache)
    _validate_thresholds({
        "faithfulness_threshold": request.faithfulness_threshold,
        "answer_relevancy_threshold": request.answer_relevancy_threshold,
        "answer_correctness_threshold": request.answer_correctness_threshold,
        "context_recall_threshold": request.context_recall_threshold,
        "context_precision_threshold": request.context_precision_threshold,
        "rqs_threshold": request.rqs_threshold,
    })

    first_case = request.dataset[0]
    bot_ids = list(first_case.bot_responses.keys())
    if not bot_ids:
        raise HTTPException(status_code=400, detail="Each test case must include at least one bot response.")
    for case in request.dataset:
        if set(case.bot_responses.keys()) != set(bot_ids):
            raise HTTPException(
                status_code=400,
                detail="All test cases must include the same bot ids for consistent comparison.",
            )

    try:
        evaluator = RagEvaluator(
            alpha=request.alpha,
            beta=request.beta,
            gamma=request.gamma,
            model_name=request.model,
            temperature=request.temperature,
            faithfulness_enabled=request.faithfulness_enabled,
            answer_relevancy_enabled=request.answer_relevancy_enabled,
            answer_correctness_enabled=request.answer_correctness_enabled,
            context_recall_enabled=request.context_recall_enabled,
            context_precision_enabled=request.context_precision_enabled,
            toxicity_enabled=request.toxicity_enabled,
        )
        results = await evaluator.run_multi_bot_evaluation(request.dataset)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    eval_id = str(uuid.uuid4())
    result = EvaluationResult(
        id=eval_id,
        name=request.name,
        timestamp=datetime.now(),
        test_cases=request.dataset,
        bot_metrics=results["bot_metrics"],
        summaries=results["summaries"],
        leaderboard=results["leaderboard"],
        winner=results["winner"],
        config={
            "model": request.model,
            "alpha": request.alpha,
            "beta": request.beta,
            "gamma": request.gamma,
            "temperature": request.temperature,
            "faithfulnessEnabled": request.faithfulness_enabled,
            "answerRelevancyEnabled": request.answer_relevancy_enabled,
            "answerCorrectnessEnabled": request.answer_correctness_enabled,
            "contextRecallEnabled": request.context_recall_enabled,
            "contextPrecisionEnabled": request.context_precision_enabled,
            "toxicityEnabled": request.toxicity_enabled,
            "faithfulnessThreshold": request.faithfulness_threshold,
            "answerRelevancyThreshold": request.answer_relevancy_threshold,
            "answerCorrectnessThreshold": request.answer_correctness_threshold,
            "contextRecallThreshold": request.context_recall_threshold,
            "contextPrecisionThreshold": request.context_precision_threshold,
            "rqsThreshold": request.rqs_threshold
        }
    )
    
    # Sanitize for JSON compliance
    sanitized_result_data = sanitize_floats(result.model_dump())
    sanitized_result = EvaluationResult(**sanitized_result_data)
    
    save_to_db(sanitized_result)
    return sanitized_result


@app.post("/recommendation", response_model=RecommendationResponse)
async def generate_recommendation(request: RecommendationRequest):
    try:
        def score_gap(metric_key: str):
            score = float(request.scores.get(metric_key, 0.0))
            threshold = float(request.thresholds.get(metric_key, 0.0))
            return round(score - threshold, 4)

        gaps = {
            "faithfulness": score_gap("faithfulness"),
            "answer_relevancy": score_gap("answer_relevancy"),
            "answer_correctness": score_gap("answer_correctness"),
            "context_recall": score_gap("context_recall"),
            "context_precision": score_gap("context_precision"),
            "rqs": score_gap("rqs"),
        }
        failing = [k for k, v in gaps.items() if v < 0]
        if not failing:
            return RecommendationResponse(recommendation="No recommendation needed: all scored metrics meet configured thresholds.")

        prompt = (
            "You are a strict RAG evaluator. "
            "Return ONE concise recommendation sentence tailored to this sample. "
            "If RQS is below threshold, pinpoint root cause using the metric scores. "
            "Prioritize concrete remediation, such as retrieval tuning, grounding, or response formatting.\n\n"
            f"Question: {request.query}\n"
            f"Answer: {request.answer}\n"
            f"Ground Truth: {request.ground_truth or 'N/A'}\n"
            f"Retrieved Context: {request.context or 'N/A'}\n"
            f"Scores: {json.dumps(request.scores)}\n"
            f"Thresholds: {json.dumps(request.thresholds)}\n"
            f"Score Gaps (score-threshold): {json.dumps(gaps)}\n"
            f"Failing Metrics: {json.dumps(failing)}\n"
            "Constraints: 14-24 words, no bullet points, no markdown."
        )
        llm_response = await asyncio.to_thread(recommendation_llm.invoke, prompt)
        recommendation = (llm_response.content or "").strip()
        if not recommendation:
            recommendation = "Review retrieval evidence and improve grounding for unsupported claims before answer generation."
        return RecommendationResponse(recommendation=recommendation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@app.get("/evaluations", response_model=List[EvaluationSummary])
async def get_all_evaluations():
    db = SessionLocal()
    try:
        records = db.query(EvaluationRecord).order_by(EvaluationRecord.timestamp.desc()).all()
        return [
            EvaluationSummary(
                id=record.id,
                name=record.name,
                timestamp=record.timestamp,
                status="completed",
                summaries=sanitize_floats(record.summaries),
                leaderboard=sanitize_floats(record.leaderboard),
                winner=record.winner,
                total_test_cases=len(record.test_cases) if record.test_cases else 0
            ) for record in records
        ]
    finally:
        db.close()

@app.delete("/cache/cleanup")
async def cleanup_cache():
    """Removes triplets older than 30 days to maintain DB performance"""
    db = SessionLocal()
    from database import MetricCache
    from datetime import timedelta
    try:
        limit = datetime.now() - timedelta(days=30)
        deleted = db.query(MetricCache).filter(MetricCache.timestamp < limit).delete()
        db.commit()
        return {"status": "success", "deleted_records": deleted}
    finally:
        db.close()

@app.get("/evaluations/{eval_id}")
async def get_evaluation(eval_id: str):
    db = SessionLocal()
    try:
        record = db.query(EvaluationRecord).filter(EvaluationRecord.id == eval_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        return record
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, loop="asyncio")
