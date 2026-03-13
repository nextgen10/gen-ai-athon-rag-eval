from sqlalchemy import create_engine, Column, String, JSON, DateTime, Float, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

DEFAULT_SQLITE_PATH = os.path.join(os.path.dirname(__file__), "evaluations.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class EvaluationRecord(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    test_cases = Column(JSON)
    bot_metrics = Column(JSON)
    summaries = Column(JSON)
    leaderboard = Column(JSON)
    winner = Column(String)
    config = Column(JSON)

class MetricCache(Base):
    __tablename__ = "metric_cache"
    # hash of (query, response, contexts, ground_truth)
    cache_key = Column(String, primary_key=True, index=True)
    metrics = Column(JSON) # stored RAGMetrics data
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)


def ensure_schema_columns():
    """Best-effort lightweight migration for existing local SQLite DBs."""
    with engine.connect() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(evaluations)")).fetchall()]
        if "config" not in columns:
            conn.execute(text("ALTER TABLE evaluations ADD COLUMN config JSON"))
            conn.commit()


ensure_schema_columns()
