from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os

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
        """Keep legacy and canonical correctness keys aligned."""
        if self.answer_correctness and not self.semantic_similarity:
            self.semantic_similarity = self.answer_correctness
        elif self.semantic_similarity and not self.answer_correctness:
            self.answer_correctness = self.semantic_similarity
        elif self.answer_correctness and self.semantic_similarity:
            self.semantic_similarity = self.answer_correctness
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
    timestamp: datetime = Field(default_factory=datetime.now)
    status: str = "completed"
    test_cases: List[TestCase]
    bot_metrics: Dict[str, Dict[str, RAGMetrics]]  # bot_id -> {case_id -> metrics}
    summaries: Dict[str, Any]
    leaderboard: List[Dict[str, Any]]
    winner: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)

class EvaluationSummary(BaseModel):
    id: str
    name: str
    timestamp: datetime = Field(default_factory=datetime.now)
    status: str = "completed"
    summaries: Dict[str, Any] # High-level stats per bot
    leaderboard: List[Dict[str, Any]] # Pre-calculated winner/ranks
    winner: Optional[str] = None
    total_test_cases: int = 0

class EvaluationRequest(BaseModel):
    name: str
    dataset: List[TestCase] = Field(min_length=1)
    alpha: float = 0.4
    beta: float = 0.3
    gamma: float = 0.3
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


class RecommendationRequest(BaseModel):
    query: str
    answer: str
    ground_truth: Optional[str] = None
    context: Optional[str] = None
    scores: Dict[str, float] = Field(default_factory=dict)
    thresholds: Dict[str, float] = Field(default_factory=dict)


class RecommendationResponse(BaseModel):
    recommendation: str
