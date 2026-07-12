import { resolveSymbol } from '../services/symbolResolver.js';
import { fetchFinancialData } from '../services/financialService.js';
import { fetchNews } from '../services/newsService.js';
import { generateAnalysis } from '../services/aiAnalysisService.js';
import { upsertCompany, saveReport } from '../services/companyService.js';
import { PrivateCompanyError, SymbolResolutionError, FmpApiError, AiAnalysisError, AiQuotaExceededError } from '../services/errors.js';
import { sanitizeQuery } from '../middleware/validateParams.js';
import logger from '../config/logger.js';

/**
 * Main controller coordinating the end-to-end investment research pipeline.
 * Coordinates symbol resolution, public checks, FMP fetching, news fetching, AI generation, and database upserts.
 * Ensures detailed response logging and structured error handling.
 *
 * @param {any} req - Express request
 * @param {any} res - Express response
 */
export const analyzeCompany = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { query } = req.body;

  // 1. Input presence validation
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ message: 'A search query (company name or stock symbol) is required.' });
  }

  const trimmedQuery = query.trim();

  // 2. Query characters allowlist to prevent injection attacks
  const SAFE_QUERY_REGEX = /^[\p{L}\p{N} .&',\-()\.]+$/u;
  if (!SAFE_QUERY_REGEX.test(trimmedQuery)) {
    logger.warn('analyze.invalid_query_chars', {
      ip: req.ip,
      userId,
      queryLength: trimmedQuery.length
    });
    return res.status(400).json({
      message: 'Query contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.'
    });
  }

  if (trimmedQuery.length > 100) {
    return res.status(400).json({ message: 'Query is too long. Maximum 100 characters allowed.' });
  }

  const safeQuery = sanitizeQuery(trimmedQuery);
  if (!safeQuery) {
    return res.status(400).json({ message: 'Query is empty after sanitization.' });
  }

  try {
    logger.info('analyze.start', { userId, query: safeQuery });

    // Step 1: Resolve Company Stock Symbol
    const resolved = await resolveSymbol(safeQuery);
    console.log(`[Analyze] Query "${safeQuery}" resolved to ticker symbol: ${resolved.symbol} (${resolved.name})`);

    // Step 2: Fetch Public Company Financial Data via FMP stable endpoints
    const financialData = await fetchFinancialData(resolved.symbol);

    // Step 3: Fetch News articles from Tavily Search (unified provider)
    const newsFeed = await fetchNews(resolved.name, resolved.symbol);

    // Step 4: Generate investment audit report using Google Gemini 2.5 Flash
    const { provider, ...analysisData } = await generateAnalysis(financialData.profile, financialData.metrics, newsFeed);

    // Step 5: Save upserted company and generated report to database (Prisma Transaction)
    const dbCompany = await upsertCompany(financialData.profile, financialData.metrics);
    const dbReport = await saveReport(userId, dbCompany, newsFeed, analysisData);

    const duration = Date.now() - startTime;
    logger.info('analyze.success', {
      symbol: resolved.symbol,
      userId,
      durationMs: duration,
      provider: `FMP + Tavily + ${provider}`
    });

    // Step 6: Return complete report response including chart data
    return res.status(201).json({
      ...dbReport,
      charts: financialData.charts
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('analyze.failure', {
      query: safeQuery,
      errorName: error.name,
      errorMessage: error.message,
      statusCode: error.statusCode || 500,
      durationMs: duration,
      stack: error.stack?.slice(0, 400)
    });

    // Operational Errors (Custom Classes)
    if (error instanceof PrivateCompanyError) {
      return res.status(403).json({
        error: 'PrivateCompany',
        message: error.message,
        isPrivate: true
      });
    }

    if (error instanceof SymbolResolutionError) {
      return res.status(404).json({
        error: 'SymbolResolutionFailed',
        message: error.message
      });
    }

    if (error instanceof FmpApiError) {
      return res.status(error.statusCode || 502).json({
        error: 'FinancialDataFeedFailure',
        message: error.message
      });
    }

    if (error instanceof AiQuotaExceededError) {
      return res.status(429).json({
        error: 'AI_QUOTA_EXCEEDED',
        message: error.message
      });
    }

    if (error instanceof AiAnalysisError) {
      return res.status(error.statusCode || 502).json({
        error: 'AiAnalysisFailure',
        message: error.message
      });
    }

    // Default System/Database Errors
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'An unexpected internal error occurred during company analysis. Please try again later.'
    });
  }
};
