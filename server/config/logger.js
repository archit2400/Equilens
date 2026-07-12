/**
 * Structured Security Logger
 *
 * Outputs JSON log lines to stdout — compatible with all cloud log
 * aggregators (Render, Railway, Vercel, Datadog, etc.).
 *
 * Every log entry includes: timestamp, level, event, and any extra context.
 * Sensitive fields are automatically stripped before logging.
 */

import crypto from 'crypto';

// ─── Fields that must never appear in logs ────────────────────────────────────
const SENSITIVE_FIELDS = new Set([
  'password', 'token', 'secret', 'authorization',
  'key', 'apikey', 'api_key', 'accesstoken', 'refreshtoken',
  'database_url', 'connectionstring',
]);

/**
 * Recursively sanitize an object — replaces sensitive values with '[REDACTED]'.
 * Safe to call on any object before logging.
 */
export function sanitize(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(k.toLowerCase().replace(/[_-]/g, ''))) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitize(v, depth + 1);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Hash an email for log correlation without storing PII.
 * Use SHA-256 so the same email always produces the same hash (correlatable)
 * but cannot be reversed.
 */
export function hashEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

/**
 * Extract the real client IP, accounting for reverse proxies.
 * Relies on express `trust proxy` being set to 1 in index.js.
 */
export function getClientIp(req) {
  if (!req) return 'unknown';
  return (
    req.ip ||
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// ─── Core write function ──────────────────────────────────────────────────────
function write(level, event, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV || 'development',
    ...sanitize(context),
  };
  // Always write to stdout — cloud platforms capture this automatically
  process.stdout.write(JSON.stringify(entry) + '\n');
}

// ─── Public logger API ────────────────────────────────────────────────────────
export const logger = {
  info: (event, context = {}) => write('INFO', event, context),
  warn: (event, context = {}) => write('WARN', event, context),
  error: (event, context = {}) => write('ERROR', event, context),

  /** Security events — always written, regardless of log level settings */
  security: (event, context = {}) => write('SECURITY', event, context),
};

// ─── Anomaly tracker — detects bursts of 401s per IP ─────────────────────────
const authFailureWindow = new Map(); // ip → { count, windowStart }
const ANOMALY_THRESHOLD = 10;        // 401s per window
const ANOMALY_WINDOW_MS = 60_000;    // 1 minute

export function trackAuthFailure(ip, req) {
  const now = Date.now();
  const record = authFailureWindow.get(ip) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - record.windowStart > ANOMALY_WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count += 1;
  authFailureWindow.set(ip, record);

  if (record.count === ANOMALY_THRESHOLD) {
    logger.security('anomaly.many_401s', {
      ip,
      count: record.count,
      windowSeconds: ANOMALY_WINDOW_MS / 1000,
      path: req?.path,
      userAgent: req?.headers?.['user-agent']?.slice(0, 120),
    });
  }
}

// ─── Morgan-compatible request logger stream ──────────────────────────────────
export const morganStream = {
  write: (message) => {
    logger.info('http.request', { raw: message.trim() });
  },
};

export default logger;
