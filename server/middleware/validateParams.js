/**
 * Route Parameter Validators
 *
 * Reusable Express middleware that validates URL path parameters before
 * they reach any controller or database query. Invalid params return
 * a clean 400 immediately — no DB round-trip, no noisy error logs.
 */

// ─── UUID v4 regex ────────────────────────────────────────────────────────────
// Matches: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Stock symbol regex ───────────────────────────────────────────────────────
// Allows standard exchange ticker formats: AAPL, BRK.B, ^GSPC, TCS.NS
const SYMBOL_REGEX = /^[A-Z0-9.^-]{1,12}$/i;

/**
 * Middleware factory: validates that req.params[paramName] is a valid UUID v4.
 * Returns 400 if invalid — attacker cannot probe internal behavior with arbitrary strings.
 *
 * Usage: router.get('/report/:id', requireUuid('id'), controller)
 */
export function requireUuid(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !UUID_REGEX.test(value)) {
      return res.status(400).json({
        message: `Invalid request: '${paramName}' must be a valid ID.`,
      });
    }
    next();
  };
}

/**
 * Middleware factory: validates that req.params[paramName] is a valid stock symbol.
 *
 * Usage: router.get('/quote/:symbol', requireSymbol('symbol'), controller)
 */
export function requireSymbol(paramName = 'symbol') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !SYMBOL_REGEX.test(value)) {
      return res.status(400).json({
        message: `Invalid request: '${paramName}' must be a valid stock symbol.`,
      });
    }
    next();
  };
}

/**
 * Sanitizes a stock symbol string for safe use in URLs and AI prompts.
 * Strips everything except letters, digits, dots, hyphens, and carets.
 * Returns uppercase trimmed result, max 12 characters.
 */
export function sanitizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  return symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.^-]/g, '')
    .slice(0, 12);
}

/**
 * Sanitizes a free-text company search query for safe embedding in:
 *   - External API URL query strings
 *   - AI/LLM prompt templates (prevents prompt injection)
 *
 * Allows: letters, digits, spaces, periods, ampersands, apostrophes, commas, hyphens, parentheses.
 * Strips: shell metacharacters (; | & $ ( ) ` > < !), HTML tags, quote chars that break prompts.
 * Max length enforced to 100 characters.
 */
export function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Allow only safe characters for both URLs and AI prompts
    .replace(/[^A-Za-z0-9 .&',\-()\u00C0-\u024F]/g, '')
    .slice(0, 100);
}

/**
 * Validates that a value is a valid UUID v4 — use directly in controllers
 * when you need to validate a body field (not a route param).
 */
export function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}
