from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import os


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

class RAGMetrics(BaseModel):
    # RAG Triad
    faithfulness: float = 0.0
    answer_relevancy: float = 0.0
    context_precision: float = 0.0
    context_recall: float = 0.0

    # NLP Core
    semantic_similarity: float = 0.0
    answer_correctness: float = 0.0
    bert_f1: float = 0.0
    rouge_l: float = 0.0
    bleu: float = 0.0

    # Ethics & Safety
    toxicity: float = 0.0

    # Efficiency
    rqs: float = 0.0
    latency_ms: float = 0.0
    total_tokens: int = 0

    @model_validator(mode="after")
    def sync_correctness_fields(self):
        """Keep legacy and canonical correctness keys aligned.

        Uses explicit None-sentinel comparison instead of truthiness to handle
        real zero scores (0.0 is a valid metric value, not 'unset').
        """
        ac = self.answer_correctness
        ss = self.semantic_similarity
        # If one is populated (non-zero) and the other is at default, sync them.
        if ac != 0.0 and ss == 0.0:
            self.semantic_similarity = ac
        elif ss != 0.0 and ac == 0.0:
            self.answer_correctness = ss
        elif ac != 0.0 and ss != 0.0:
            # Both set — canonical field wins.
            self.semantic_similarity = ac
        return self


class TestCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    bot_responses: Dict[str, str]
    bot_contexts: Dict[str, List[str]]
    ground_truth: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvaluationResult(BaseModel):
    id: str
    name: str
    timestamp: datetime = Field(default_factory=_utcnow)
    status: str = "completed"
    test_cases: List[TestCase]
    bot_metrics: Dict[str, Dict[str, RAGMetrics]]  # bot_id -> {case_id -> metrics}
    summaries: Dict[str, Any]
    leaderboard: List[Dict[str, Any]]
    winner: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    confusion_matrix: Dict[str, Any] = Field(default_factory=dict)


class EvaluationSummary(BaseModel):
    id: str
    name: str
    timestamp: datetime = Field(default_factory=_utcnow)
    status: str = "completed"
    summaries: Dict[str, Any]
    leaderboard: List[Dict[str, Any]]
    winner: Optional[str] = None
    total_test_cases: int = 0


class EvaluationRequest(BaseModel):
    name: str
    dataset: List[TestCase] = Field(min_length=1)
    # Weights: each must be [0, 1] and their sum must not exceed 1.0.
    alpha: float = Field(default=0.35, ge=0.0, le=1.0)
    beta: float = Field(default=0.25, ge=0.0, le=1.0)
    gamma: float = Field(default=0.25, ge=0.0, le=1.0)
    temperature: float = 0.0
    model: str = Field(default_factory=lambda: os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"))
    faithfulness_enabled: bool = True
    answer_relevancy_enabled: bool = True
    answer_correctness_enabled: bool = True
    context_recall_enabled: bool = True
    context_precision_enabled: bool = True
    toxicity_enabled: bool = True
    faithfulness_threshold: float = 0.8
    answer_relevancy_threshold: float = 0.8
    answer_correctness_threshold: float = 0.8
    context_recall_threshold: float = 0.75
    context_precision_threshold: float = 0.75
    rqs_threshold: float = 0.75

    @model_validator(mode="after")
    def validate_weight_sum(self):
        total = self.alpha + self.beta + self.gamma
        if total > 1.0:
            raise ValueError(f"alpha + beta + gamma must not exceed 1.0 (got {total:.3f})")
        return self


class RecommendationRequest(BaseModel):
    query: str
    answer: str
    ground_truth: Optional[str] = None
    context: Optional[str] = None
    scores: Dict[str, float] = Field(default_factory=dict)
    thresholds: Dict[str, float] = Field(default_factory=dict)


class RecommendationResponse(BaseModel):
    recommendation: str
