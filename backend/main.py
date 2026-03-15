import logging
import logging.config
import os

# Load .env before any os.getenv() calls so CORS_ALLOW_ORIGINS, LOG_LEVEL, etc. are available.
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.responses import JSONResponse
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
from datetime import datetime, timezone
import pandas as pd
import io
import math
import asyncio
import re
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

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {"level": os.getenv("LOG_LEVEL", "INFO"), "handlers": ["console"]},
})

logger = logging.getLogger("rageval.api")

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
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Request-ID"],
)

# ── Request ID middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    # Attach to request state so handlers can log it
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

from database import SessionLocal, EvaluationRecord
from sqlalchemy import text
import json

recommendation_llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
    openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    temperature=0.0,
)

_prompts_dir = os.path.join(os.path.dirname(__file__), "prompts")
with open(os.path.join(_prompts_dir, "recommendation_prompt.txt"), "r", encoding="utf-8") as _f:
    _RECOMMENDATION_PROMPT_TEMPLATE = _f.read()


@app.get("/health", tags=["ops"])
async def health_check():
    """Liveness probe — verifies DB connectivity and returns service metadata."""
    db = SessionLocal()
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        logger.warning("Health check DB probe failed: %s", exc)
    finally:
        db.close()

    status = "ok" if db_ok else "degraded"
    return JSONResponse(
        content={
            "status": status,
            "db": "ok" if db_ok else "error",
            "version": os.getenv("APP_VERSION", "dev"),
        },
        status_code=200 if db_ok else 503,
    )


def _sanitize_name(raw: str, max_len: int = 64) -> str:
    """Strip control characters and limit length to prevent JSON/log injection."""
    sanitized = re.sub(r"[\x00-\x1f\x7f]", "", raw)
    return sanitized[:max_len]


def _validate_weights(alpha: float, beta: float, gamma: float):
    for name, value in [("alpha", alpha), ("beta", beta), ("gamma", gamma)]:
        if not 0.0 <= value <= 1.0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {name}={value}. Weights must be between 0.0 and 1.0.",
            )
    total = alpha + beta + gamma
    if total > 1.0:
        raise HTTPException(
            status_code=400,
            detail=f"alpha + beta + gamma must not exceed 1.0 (got {total:.3f}).",
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
            config=res_data.get("config", {}),
            confusion_matrix=res_data.get("confusion_matrix", {})
        )
        db.add(record)
        db.commit()
        logger.info("Saved evaluation %s to database", res_data["id"])
    except Exception:
        logger.exception("Failed to save evaluation %s to database", result.id)
        db.rollback()
        raise
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
            config=record.config or {},
            confusion_matrix=record.confusion_matrix or {}
        )
    finally:
        db.close()

@app.post("/evaluate-excel", response_model=EvaluationResult)
async def evaluate_excel(
    file: UploadFile = File(...),
    alpha: float = Form(0.35),
    beta: float = Form(0.25),
    gamma: float = Form(0.25),
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
    background_tasks: BackgroundTasks = None,
):
    background_tasks.add_task(cleanup_cache)

    # --- File-level validation (before any parsing) ---
    MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))  # default 10 MB
    ALLOWED_CONTENT_TYPES = {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/octet-stream",  # some browsers send this for .xlsx
    }
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Please upload an Excel (.xlsx/.xls) file.",
        )

    try:
        if max_rows <= 0:
            raise HTTPException(status_code=400, detail="max_rows must be greater than 0.")
        _validate_weights(alpha, beta, gamma)
        _validate_thresholds({
            "faithfulness_threshold": faithfulness_threshold,
            "answer_relevancy_threshold": answer_relevancy_threshold,
            "answer_correctness_threshold": answer_correctness_threshold,
            "context_recall_threshold": context_recall_threshold,
            "context_precision_threshold": context_precision_threshold,
            "rqs_threshold": rqs_threshold,
        })

        contents = await file.read()
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({len(contents) // 1024} KB). Maximum allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
            )
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
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
            bot_mapping[col] = _sanitize_name(f"Bot {suffix}")

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
        logger.info("Starting evaluation for %d model(s), %d test case(s)", len(bot_columns), len(test_cases))
        results = await evaluator.run_multi_bot_evaluation(test_cases)
        logger.info("Evaluation completed successfully")

        confusion = evaluator.compute_confusion_matrix(
            results["bot_metrics"],
            {
                "context_recall":     context_recall_threshold,
                "answer_correctness": answer_correctness_threshold,
                "faithfulness":       faithfulness_threshold,
                "answer_relevancy":   answer_relevancy_threshold,
                "context_precision":  context_precision_threshold,
                "rqs":                rqs_threshold,
            },
        )

        eval_id = str(uuid.uuid4())
        result = EvaluationResult(
            id=eval_id,
            name=_sanitize_name(f"Excel Upload - {file.filename or 'unknown'}"),
            timestamp=datetime.now(timezone.utc),
            test_cases=test_cases,
            bot_metrics=results["bot_metrics"],
            summaries=results["summaries"],
            leaderboard=results["leaderboard"],
            winner=results["winner"],
            confusion_matrix=confusion,
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
        logger.exception("Excel processing failed")
        raise HTTPException(status_code=500, detail=f"Excel processing failed: {str(e)}")

@app.post("/evaluate", response_model=EvaluationResult)
async def run_evaluation(request: EvaluationRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(cleanup_cache)
    _validate_weights(request.alpha, request.beta, request.gamma)
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
    except RuntimeError as exc:
        logger.exception("Evaluation pipeline failed")
        raise HTTPException(status_code=500, detail=str(exc))

    confusion = evaluator.compute_confusion_matrix(
        results["bot_metrics"],
        {
            "context_recall":     request.context_recall_threshold,
            "answer_correctness": request.answer_correctness_threshold,
            "faithfulness":       request.faithfulness_threshold,
            "answer_relevancy":   request.answer_relevancy_threshold,
            "context_precision":  request.context_precision_threshold,
            "rqs":                request.rqs_threshold,
        },
    )

    eval_id = str(uuid.uuid4())
    result = EvaluationResult(
        id=eval_id,
        name=request.name,
        timestamp=datetime.now(timezone.utc),
        test_cases=request.dataset,
        bot_metrics=results["bot_metrics"],
        summaries=results["summaries"],
        leaderboard=results["leaderboard"],
        winner=results["winner"],
        confusion_matrix=confusion,
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
            "toxicity": score_gap("toxicity"),
            "rqs": score_gap("rqs"),
        }
        # Most metrics fail when score is BELOW threshold (negative gap).
        # Toxicity is inverted: it fails when score EXCEEDS threshold (positive gap = more toxic than allowed).
        failing = [
            k for k, v in gaps.items()
            if (v > 0 if k == "toxicity" else v < 0)
        ]
        if not failing:
            return RecommendationResponse(recommendation="No recommendation needed: all scored metrics meet configured thresholds.")

        # Truncate user-controlled fields to prevent prompt injection / runaway token use.
        _MAX_FIELD = 1000
        safe_query = str(request.query)[:_MAX_FIELD]
        safe_answer = str(request.answer)[:_MAX_FIELD]
        safe_gt = str(request.ground_truth or "N/A")[:_MAX_FIELD]
        safe_ctx = str(request.context or "N/A")[:_MAX_FIELD]

        prompt = (
            _RECOMMENDATION_PROMPT_TEMPLATE
            .replace("{{QUESTION}}", safe_query)
            .replace("{{ANSWER}}", safe_answer)
            .replace("{{GROUND_TRUTH}}", safe_gt)
            .replace("{{CONTEXT}}", safe_ctx)
            .replace("{{SCORES}}", json.dumps(request.scores, indent=2))
            .replace("{{THRESHOLDS}}", json.dumps(request.thresholds, indent=2))
            .replace("{{GAPS}}", json.dumps(gaps, indent=2))
            .replace("{{FAILING}}", json.dumps(failing))
        )
        try:
            rec_timeout = float(os.getenv("EVAL_LLM_TIMEOUT_SECONDS", "120")) or None
        except (TypeError, ValueError):
            rec_timeout = 120.0
        try:
            llm_response = await asyncio.wait_for(
                asyncio.to_thread(recommendation_llm.invoke, prompt),
                timeout=rec_timeout,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="Recommendation LLM call timed out. Please retry.")
        recommendation = (llm_response.content or "").strip()
        if not recommendation:
            recommendation = "Review retrieval evidence and improve grounding for unsupported claims before answer generation."
        return RecommendationResponse(recommendation=recommendation)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Recommendation generation failed")
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

@app.get("/evaluations", response_model=List[EvaluationSummary])
async def get_all_evaluations(limit: int = 200, offset: int = 0):
    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000.")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0.")
    db = SessionLocal()
    try:
        records = (
            db.query(EvaluationRecord)
            .order_by(EvaluationRecord.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
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

async def cleanup_cache():
    """Internal background task: removes metric cache entries older than 30 days."""
    from database import MetricCache
    from datetime import timedelta
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
        deleted = db.query(MetricCache).filter(MetricCache.timestamp < cutoff).delete()
        db.commit()
        logger.info("Cache cleanup: removed %d stale entries", deleted)
    except Exception:
        logger.exception("Cache cleanup failed")
        db.rollback()
    finally:
        db.close()

@app.get("/evaluations/{eval_id}", response_model=EvaluationResult)
async def get_evaluation(eval_id: str):
    db = SessionLocal()
    try:
        record = db.query(EvaluationRecord).filter(EvaluationRecord.id == eval_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        return EvaluationResult(
            id=record.id,
            name=record.name,
            timestamp=record.timestamp,
            test_cases=record.test_cases or [],
            bot_metrics=sanitize_floats(record.bot_metrics or {}),
            summaries=sanitize_floats(record.summaries or {}),
            leaderboard=sanitize_floats(record.leaderboard or []),
            winner=record.winner,
            config=record.config or {},
            confusion_matrix=sanitize_floats(record.confusion_matrix or {}),
        )
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    import asyncio
    # nest_asyncio (applied in evaluator.py) patches asyncio.run and drops support
    # for the loop_factory kwarg that newer uvicorn passes via server.run().
    # Bypass server.run() entirely and drive server.serve() directly so the
    # patched asyncio.run() is called without loop_factory.
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
