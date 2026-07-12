import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { AiAnalysisError, AiQuotaExceededError } from './errors.js';
import { sanitizeSymbol, sanitizeQuery } from '../middleware/validateParams.js';

/**
 * Strips markdown code blocks from model response string before parsing as JSON.
 *
 * @param {string} text - Raw string output from LLM
 * @returns {any} Parsed JSON object
 */
const cleanGeminiJson = (text) => {
  if (!text) return {};
  const cleaned = text
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(cleaned);
};

/**
 * Formats financial metrics into clear strings for prompt context.
 *
 * @param {any} metrics - Metrics object
 * @returns {string} String description of metrics
 */
const formatMetricsForPrompt = (metrics) => {
  const cap = metrics.marketCap ? `$${(metrics.marketCap / 1e9).toFixed(2)}B` : 'N/A';
  const rev = metrics.revenue ? `$${(metrics.revenue / 1e9).toFixed(2)}B` : 'N/A';
  const profit = metrics.netProfit ? `$${(metrics.netProfit / 1e9).toFixed(2)}B` : 'N/A';
  const pe = metrics.peRatio ? `${metrics.peRatio}x` : 'N/A';
  const eps = metrics.eps !== null ? `${metrics.eps}` : 'N/A';
  const beta = metrics.beta !== null ? `${metrics.beta}` : 'N/A';
  const div = metrics.dividend !== null ? `${metrics.dividend}` : 'N/A';
  const margin = metrics.profitMargin ? `${(metrics.profitMargin * 100).toFixed(2)}%` : 'N/A';
  const de = metrics.debtToEquity !== null ? `${metrics.debtToEquity.toFixed(2)}%` : 'N/A';
  const currentRatio = metrics.currentRatio || 'N/A';

  return `
  - Market Capitalization: ${cap}
  - Price-to-Earnings (P/E) Ratio: ${pe}
  - Earnings Per Share (EPS): ${eps}
  - Beta (Volatility): ${beta}
  - Last Dividend Value: ${div}
  - Debt-to-Equity Ratio: ${de}
  - Current Liquidity Ratio: ${currentRatio}
  - Net Profit Margin: ${margin}
  - Net Annual Profit: ${profit}
  - Total Revenue: ${rev}
  `;
};

/**
 * Calls Google Gemini model to perform analysis based on provided profile, metrics, and news.
 * Establishes strict prompts to prevent hallucinated financial figures.
 *
 * @param {any} profile - FMP Company Profile
 * @param {any} metrics - FMP Company Financial Metrics
 * @param {Array<any>} news - Tavily News articles list
 * @returns {Promise<{
 *   recommendation: string,
 *   confidence: number,
 *   summary: string,
 *   strengths: string[],
 *   weaknesses: string[],
 *   opportunities: string[],
 *   threats: string[],
 *   risks: string[],
 *   news: Array<{title: string, source: string, sentiment: string}>
 * }>}
 * @throws {AiAnalysisError}
 */
export async function generateAnalysis(profile, metrics, news) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new AiAnalysisError('GEMINI_API_KEY is not configured.');
  }

  const safeSymbol = sanitizeSymbol(profile.symbol || '').toUpperCase();
  const safeName = sanitizeQuery(profile.name || safeSymbol);

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: apiKey,
    temperature: 0.15,
    responseMimeType: 'application/json',
    maxRetries: 1
  });

  const formattedMetrics = formatMetricsForPrompt(metrics);

  const promptTemplate = new PromptTemplate({
    template: `You are an elite financial analysis system. Conduct an investment audit for {companyName} ({symbol}).
You are ONLY allowed to generate text analysis (SWOT, Thesis, Risks, Opportunities, Sentiment, and Recommendation).
You must NEVER generate, compute, or estimate any financial figures, numbers, P/E multiples, or ratios. Use the exact data provided below.

Company Profile:
{companyProfile}

Key Financial Metrics & Ratios (Grounded Truth):
{financialMetrics}

Latest News and Search Context:
{latestNews}

Instructions:
1. Conduct a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) with 3-5 items per category.
2. Formulate a 3-4 sentence professional Investment Thesis (summary).
3. Detail specific Business Risks (minimum 3).
4. Outline future Growth Opportunities.
5. Provide a Recommendation which must be exactly one of: "BUY", "HOLD", "SELL", or "PASS".
6. Provide a Confidence Score (0 to 100) representing your conviction.
7. For each news article provided, perform a sentiment analysis ("Positive", "Negative", or "Neutral").

JSON Output Schema:
{{
  "recommendation": "BUY | HOLD | SELL | PASS",
  "confidence": 85,
  "summary": "Investment thesis summary...",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "threats": ["threat 1", "threat 2"],
  "risks": ["risk 1", "risk 2"],
  "news": [
    {{
      "title": "Exact title of news article",
      "source": "Publisher source",
      "sentiment": "Positive | Negative | Neutral"
    }}
  ]
}}

DO NOT enclose response in markdown blocks. Output only raw JSON.`,
    inputVariables: ['companyName', 'symbol', 'companyProfile', 'financialMetrics', 'latestNews']
  });

  const prompt = await promptTemplate.format({
    companyName: safeName,
    symbol: safeSymbol,
    companyProfile: JSON.stringify(profile, null, 2),
    financialMetrics: formattedMetrics,
    latestNews: JSON.stringify(news, null, 2)
  });

  try {
    console.log(`[AI Service] Invoking Gemini model for symbol ${safeSymbol}...`);
    const response = await model.invoke(prompt);
    const content = typeof response.content === 'string' ? response.content : response.text;
    const parsed = cleanGeminiJson(content);

    // Enforce required keys and recommendations matching the allowed set
    const validRecs = new Set(['BUY', 'HOLD', 'SELL', 'PASS']);
    const finalRec = parsed.recommendation && validRecs.has(parsed.recommendation.toUpperCase())
      ? parsed.recommendation.toUpperCase()
      : 'PASS';

    return {
      provider: 'Gemini',
      recommendation: finalRec,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
      summary: parsed.summary || 'No summary generated.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      threats: Array.isArray(parsed.threats) ? parsed.threats : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      news: Array.isArray(parsed.news) ? parsed.news : []
    };
  } catch (error) {
    console.error(`[AI Service] Gemini execution failed for ${safeSymbol}:`, error.message);
    const msg = error.message || '';
    const isQuotaError = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit');
    
    if (isQuotaError && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
      console.warn(`[AI Service] Gemini quota exceeded. Attempting fallback to Groq model...`);
      try {
        const groqResult = await generateAnalysisWithGroq(prompt);
        console.log(`[AI Service] Groq fallback completed successfully for ${safeSymbol}.`);
        return {
          provider: 'Groq',
          ...groqResult
        };
      } catch (groqError) {
        console.error(`[AI Service] Groq fallback also failed:`, groqError.message);
        throw new AiQuotaExceededError(`AI services are temporarily unavailable. Both Gemini and Groq fallback limits were reached.`);
      }
    }

    if (isQuotaError) {
      throw new AiQuotaExceededError();
    }
    throw new AiAnalysisError(`Gemini model failed to analyze ${safeSymbol}: ${error.message}`);
  }
}

/**
 * Fallback generator using Groq's Llama-3.3-70b model.
 *
 * @param {string} prompt - Ready formatted prompt string
 * @returns {Promise<any>} Mapped analysis object
 */
async function generateAnalysisWithGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const model = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    apiKey: apiKey,
    temperature: 0.15,
    maxRetries: 1
  });

  console.log(`[AI Service] Invoking Groq (llama-3.3-70b-versatile) fallback...`);
  const response = await model.invoke(prompt);
  const content = typeof response.content === 'string' ? response.content : response.text;
  const parsed = cleanGeminiJson(content);

  const validRecs = new Set(['BUY', 'HOLD', 'SELL', 'PASS']);
  const finalRec = parsed.recommendation && validRecs.has(parsed.recommendation.toUpperCase())
    ? parsed.recommendation.toUpperCase()
    : 'PASS';

  return {
    recommendation: finalRec,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
    summary: parsed.summary || 'No summary generated.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    threats: Array.isArray(parsed.threats) ? parsed.threats : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    news: Array.isArray(parsed.news) ? parsed.news : []
  };
}
