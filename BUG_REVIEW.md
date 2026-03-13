# RAG Evaluation Framework - Comprehensive Bug Review

## Date: 2026-02-06
## Reviewer: Claude 4.5 Sonnet

---

## 🔴 CRITICAL BUGS

### 1. **Trend Calculation Crashes When No Winner Exists**
**Location:** `frontend/src/app/page.tsx:1326-1350`
**Issue:** The `trends` useMemo depends on `winner` but doesn't handle the case where `leaderboardData` is empty.
```typescript
const trends = useMemo(() => {
  if (!history || history.length < 1 || !winner) return {};
  // ... but winner is undefined when leaderboardData is empty
}, [history, data, winner]);
```
**Impact:** Runtime crash when viewing dashboard before any evaluation runs.
**Fix:** Add early return check for `!winner` or `!leaderboardData.length`.

---

### 2. **Drilldown View Only Shows First 3 Test Cases**
**Location:** `frontend/src/app/page.tsx:1862`
**Issue:** Hard-coded `.slice(0, 3)` limits drilldown to only 3 scenarios.
```typescript
{data.test_cases.slice(0, 3).map((testCase: any, idx: number) => (
```
**Impact:** Users cannot see full evaluation results in drilldown view.
**Fix:** Remove slice or make it configurable with pagination.

---

### 3. **Missing Error Handling for Failed Evaluations**
**Location:** `backend/evaluator.py:102-104`
**Issue:** When a bot evaluation fails, it returns empty metrics but doesn't log which test cases failed.
```python
except Exception as e:
    print(f"Error evaluating {bid}: {e}")
    return {bid: {case.id: RAGMetrics(rqs=0.0) for case in dataset}}
```
**Impact:** Silent failures mask real issues; all metrics show as 0.0 without indication of error.
**Fix:** Add proper error logging and surface errors to frontend.

---

## 🟡 MEDIUM PRIORITY BUGS

### 4. **Inconsistent Metric Naming Between Backend and Frontend**
**Location:** Multiple files
**Issue:** Backend uses `semantic_similarity` but frontend displays as "Answer Correctness". The mapping is implicit and fragile.
**Impact:** Confusion during debugging; potential for mismatched data.
**Fix:** Standardize naming convention across stack.

---

### 5. **Excel Export Missing Bot Response Truncation**
**Location:** `frontend/src/app/page.tsx:1189-1191`
**Issue:** Full bot responses are exported to CSV without truncation, potentially creating massive files.
```typescript
const response = (tc.bot_responses?.[botId] || "").replace(/"/g, '""');
```
**Impact:** CSV files can become unmanageably large with long responses.
**Fix:** Add optional truncation or separate detailed export mode.

---

### 6. **History View Doesn't Refresh After New Evaluation**
**Location:** `frontend/src/app/page.tsx:1084-1091`
**Issue:** History is only fetched when `activeView === 'history'`, not after completing an evaluation.
```typescript
useEffect(() => {
  if (activeView === 'history') {
    fetch("http://localhost:8000/evaluations")
    // ...
  }
}, [activeView]);
```
**Impact:** Users must manually switch views to see new evaluations in history.
**Fix:** Refetch history after successful evaluation completion.

---

### 7. **Potential Division by Zero in Trend Calculation**
**Location:** `frontend/src/app/page.tsx:1336-1339`
**Issue:** `calc` function checks `if (!prev || prev === 0)` but returns `null`, which might not be handled everywhere.
```typescript
const calc = (curr: number, prev: number) => {
  if (!prev || prev === 0) return null;
  const diff = ((curr - prev) / prev) * 100;
  return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
};
```
**Impact:** Trend badges might show "null%" or crash.
**Fix:** Ensure all consumers handle `null` gracefully.

---

## 🟢 LOW PRIORITY / IMPROVEMENTS

### 8. **No Loading State for Historical Data Fetch**
**Location:** `frontend/src/app/page.tsx:1797-1848`
**Issue:** History table shows "No historical evaluations found" immediately, even while loading.
**Impact:** Poor UX; users might think there's no data when it's still loading.
**Fix:** Add loading skeleton or spinner.

---

### 9. **Hardcoded Avatar Path in PDF Report**
**Location:** `frontend/src/app/page.tsx:2240`
**Issue:** Avatar uses `/Aniket.jpeg` which is user-specific.
```typescript
<Avatar src="/Aniket.jpeg" sx={{ width: 64, height: 64, ... }} />
```
**Impact:** Won't work for other users; breaks portability.
**Fix:** Make avatar configurable or use placeholder.

---

### 10. **Missing Validation for RQS Weight Sum**
**Location:** `frontend/src/app/page.tsx:2010-2029`
**Issue:** Users can set alpha + beta + gamma to exceed 1.0 without warning.
**Impact:** RQS calculation becomes invalid.
**Fix:** Add validation or auto-normalize weights.

---

### 11. **Context Fallback Logic May Miss Data**
**Location:** `backend/main.py:122-135`
**Issue:** Context detection tries multiple column names but doesn't warn if none found.
```python
if context_col in df.columns:
    ctx_val = row.get(context_col)
elif "Context" in df.columns:
    ctx_val = row.get("Context")
# ... no warning if all fail
```
**Impact:** Silent context loss leads to inaccurate evaluations.
**Fix:** Log warning when context columns are missing.

---

### 12. **Potential Memory Leak with Large Datasets**
**Location:** `frontend/src/app/page.tsx:1123-1128`
**Issue:** Status logs accumulate indefinitely during evaluation.
```typescript
setStatusLogs(prev => [...prev, `Collating metrics for ${leaderboardData.length} agents...`]);
```
**Impact:** Memory grows unbounded with very long evaluations.
**Fix:** Limit status log array size or clear on completion.

---

### 13. **No Retry Logic for Failed API Calls**
**Location:** `frontend/src/app/page.tsx:1256-1280`
**Issue:** If backend evaluation fails, there's no retry mechanism.
**Impact:** Transient network issues cause complete evaluation failure.
**Fix:** Add exponential backoff retry for API calls.

---

### 14. **Inconsistent Date Formatting**
**Location:** Multiple locations
**Issue:** Some places use `toLocaleString()`, others use `toLocaleDateString()`.
**Impact:** Inconsistent date display across UI.
**Fix:** Create centralized date formatting utility.

---

### 15. **Missing TypeScript Types for Data Structures**
**Location:** Throughout frontend
**Issue:** Heavy use of `any` type reduces type safety.
```typescript
{data.test_cases.map((testCase: any, idx: number) => (
```
**Impact:** Runtime errors that TypeScript could catch.
**Fix:** Define proper interfaces for all data structures.

---

## 🔵 EDGE CASES TO TEST

1. **Empty Dataset Upload**: What happens when Excel has 0 rows?
2. **Single Bot Evaluation**: Does comparison logic work with only 1 bot?
3. **Missing Ground Truth**: All test cases have null ground_truth.
4. **Extremely Long Responses**: 10,000+ character bot responses.
5. **Special Characters in Bot Names**: Unicode, emojis, SQL injection attempts.
6. **Concurrent Evaluations**: Two users uploading simultaneously.
7. **Browser Print Dialog Cancellation**: PDF export interrupted.
8. **Offline Mode**: What happens when backend is unreachable?

---

## 📊 SUMMARY

- **Critical Bugs**: 3
- **Medium Priority**: 4
- **Low Priority**: 8
- **Total Issues Identified**: 15

## 🎯 RECOMMENDED IMMEDIATE ACTIONS

1. Fix trend calculation crash (Critical #1)
2. Remove drilldown slice limit (Critical #2)
3. Add proper error surfacing (Critical #3)
4. Implement history auto-refresh (Medium #6)
5. Add loading states for better UX (Low #8)
