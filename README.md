# RagEval: AI Chatbot Side-by-Side Analysis

A premium evaluation observability platform for RAG-based chatbots. Designed to compare different versions of chatbots and periodically updated vector databases.

## 🚀 Key Features
- **RAG Triad Analysis:** Automated scoring of Faithfulness, Relevancy, Precision, and Recall.
- **RQS (Robust Quality Score):** A weighted master metric to judge system reliability.
- **SxS (Side-by-Side) Comparison:** Visual dashboard for comparing "Benchmark" vs "Candidate" outputs.
- **Diagnostic Insights:** Breakdown of hallucinations and retrieval gaps.

## 🛠 Tech Stack
- **Backend:** FastAPI, Python, Ragas, DeepEval.
- **Frontend:** Next.js 15, Recharts, Lucide-React, Framer Motion.
- **Styling:** Custom Vanilla CSS (Glassmorphism & Cyber-Industrial aesthetic).

## 🏃 How to Run

### 1. Backend
```bash
cd nexus-eval/backend
pip install -r requirements.txt
python main.py
```
Backend runs at `http://localhost:8000`.

### 2. Frontend
```bash
cd nexus-eval/frontend
npm install
npm run dev
```
Dashboard available at `http://localhost:3000`.

## 📊 Evaluation Approach
RagEval uses a weighted formula to calculate the **RQS**:
`RQS = α * Accuracy + β * ContextRecall + γ * ContextPrecision`

Default Weights:
- **α (Accuracy):** 0.4 (Faithfulness + Relevancy)
- **β (Recall):** 0.3
- **γ (Precision):** 0.3
