/**
 * Custom Error classes for the backend architecture.
 * Helps map service-level failures to descriptive JSON responses and clean HTTP status codes.
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Flag for operational vs. programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when trying to retrieve public stock data for private companies or subsidiaries
 */
export class PrivateCompanyError extends AppError {
  constructor(companyName) {
    super(
      `This company ("${companyName}") is privately held and does not have publicly traded financial data.`,
      403
    );
  }
}

/**
 * Thrown when a company name/query fails to resolve to a stock symbol
 */
export class SymbolResolutionError extends AppError {
  constructor(query) {
    super(`Failed to resolve company symbol or ticker for: "${query}".`, 404);
  }
}

/**
 * Wraps Financial Modeling Prep (FMP) response failures (e.g. 401, 403, 429, 500)
 */
export class FmpApiError extends AppError {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code returned by FMP
   */
  constructor(message, statusCode = 500) {
    super(message, statusCode);
  }
}

/**
 * Wraps Gemini AI Studio generation failures (e.g. Rate Limit, API key blocked)
 */
export class AiAnalysisError extends AppError {
  constructor(message = 'Generative AI analysis service encountered an error.') {
    super(message, 500);
  }
}

/**
 * Thrown when the Generative AI service hits its daily quota or rate limits (429)
 */
export class AiQuotaExceededError extends AppError {
  constructor(message = 'AI analysis is temporarily unavailable because the daily request limit has been reached. Please try again later.') {
    super(message, 429);
  }
}
