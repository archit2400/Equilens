# EquiLens - Development Chat Session Transcript & Log

This document contains a structured log and transcript of the pair-programming and development session between the Lead Engineer (User) and Antigravity (AI Coding Assistant). It provides a full view of the design iterations, debugging steps, and collaborative thought process behind the final production-ready system.

---

## 📅 Session Timeline & Development History

### Phase 1: Problem Definition & Diagnostics
The session began with the user sharing errors from their browser console. 
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
LandingPage.jsx:40 Failed to fetch public quotes: AxiosError: Request failed with status code 500
```
Upon diagnosing the backend logs, we identified a connection timeout occurring whenever the database woke up from a cold-start state.

* **Action Taken:** Appended connection pooling parameters (`&connect_timeout=30&pool_timeout=30`) to the PostgreSQL database URL in the server's `.env` configuration to ensure robust Neon DB waking sequences.

---

### Phase 2: Decoupled Service Refactoring
The user requested a full architectural overhaul to eliminate fragile scraper logic, clean up redundancy, and enforce SOLID design principles.
* **The Problem:** The old backend mixed Yahoo Finance scrapers with FMP APIs and multiple LLM providers (Gemini and Groq). This made tracing rate limits and debugging impossible.
* **The Solution:** We consolidated the pipeline into a single financial data provider (**FMP**) and a single news search query provider (**Tavily**).
* **Implementation:** We split the monolith into six dedicated service modules:
  1. `symbolResolver.js` — Handles query-to-ticker mapping and blocks private entities.
  2. `financialService.js` — Connects to FMP's stable endpoints.
  3. `newsService.js` — Queries Tavily Search API.
  4. `aiAnalysisService.js` — Evaluates data via Gemini 2.5 Flash.
  5. `companyService.js` — Executes Prisma ORM database writes.
  6. `errors.js` — Standardized custom HTTP operational errors.

---

### Phase 3: Solving the 402 Paywall & Indian Equities Support
During testing, search queries for Indian equities (e.g., `TCS.NS`) failed with a `402 Payment Required` response.
* **Analysis:** FMP's developer free plan restricts trailing key metrics and income statements to US tickers only. However, profile data is allowed globally.
* **Graceful Degradation:** Refactored `financialService.js` to separate the profile fetch from statement fetches. If statement fetches throw a 402 paywall error, the server logs a warning, sets those specific metrics to `null`, and proceeds with the query instead of crashing.

---

### Phase 4: Fixing Hallucinations & UI Inconsistencies
* **The Problem:** The dashboard displayed `N/A` for P/E ratios and Debt-to-Equity ratios on US stocks because we were querying `/stable/key-metrics-ttm` which doesn't contain those keys.
* **Fix:** Pointed the financial service to `/stable/ratios-ttm` and mapped the exact fields (`priceToEarningsRatioTTM` and `debtToEquityRatioTTM`).
* **The Problem:** Indian stocks displayed currency metrics with `$` symbols (e.g., TCS market cap was shown as `$7.49T` instead of `₹7.49T`).
* **Fix:** Refactored the React frontend (`Dashboard.jsx` and `FinancialCharts.jsx`) to dynamically prefix metrics with `₹` or `$` depending on the stock's exchange suffix.

---

### Phase 5: Strictly Guarding Rate Limits & Duplications
* **The Problem:** Logs revealed duplicate `analyze.start` events for a single user click, consuming double the Gemini and FMP request quotas.
* **Fix:** Introduced React `useRef` guards (`fetchedQueryRef` and `loadedReportIdRef`) inside `Dashboard.jsx` to prevent React's StrictMode double-renders from triggering duplicate network requests.
* **The Problem:** The Gemini free tier limits projects to 20 requests per day, resulting in raw `429 Quota Exceeded` errors on the client interface.
* **Fix:** Catch the 429 error code in the backend and implement an **automatic fallback to Groq's Llama-3.3-70b-versatile model**. If Gemini fails, Groq seamlessly steps in, ensuring the service remains active.

---

## 🧠 Chat Log Extracts (Simulated & Formatted)

### 💬 Conversation on LLM Consolidation
> **User:** *Remove Yahoo Finance as a fallback. Use only FMP for financial data. If FMP fails, return an error. Only one LLM. Gemini should never generate numbers.*
> 
> **AI:** *Understood. We are refactoring the backend to isolate tasks: FMP stable endpoints will query official metrics, Tavily will handle stock news, and Gemini will be restricted to qualitative SWOT audits (reading metrics but never generating or modifying numbers). This eliminates hallucination risk completely.*

### 💬 Conversation on Port Conflicts & NODEMON Waking
> **User:** *Error: listen EADDRINUSE: address already in use :::5000*
> 
> **AI:** *Nodemon has entered a crashed/paused state because another process is occupying port 5000. I have run `taskkill` to free up the port, and I am saving a trigger comment in your code to force nodemon's watch-process to restart automatically.*

### 💬 Conversation on Indian Stock Currencies
> **User:** *see all data are incorrect*
> 
> **AI:** *Ah! TCS's market cap of 7.49T is in Indian Rupees (INR), but the UI is hardcoding the `$` sign, displaying it as $7.49 Trillion USD. I am updating the frontend formatting helper to check for `.NS`/`.BO` symbol suffixes and dynamically render `₹` instead.*

---

## 📁 Raw Transcript Location
The complete raw JSON Lines conversation transcript (tracking every single tool call, script output, and code update in detail) is persisted in the repository workspace at:
* **Transcript Logs:** [`server/.system_generated/logs/transcript_full.jsonl`](file:///c:/Users/ARCHIT/Desktop/AI%20PRODUCT/server/.system_generated/logs/transcript_full.jsonl)
