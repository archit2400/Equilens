import './config/env.js';
import { validateSecrets } from './config/secrets.js'; // ← run before anything else
validateSecrets();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dns from 'dns';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { clerkMiddleware } from '@clerk/express';
import apiRouter from './routes/api.js';
import prisma from './config/db.js';
import logger, { morganStream, getClientIp } from './config/logger.js';

// Force Node.js to resolve IPv4 first (prevents Google API IPv6 timeout bugs)
dns.setDefaultResultOrder('ipv4first');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────────
// Required when deployed behind Render / Vercel / Heroku reverse proxies.
// Without this, req.ip is always 127.0.0.1 — defeating per-IP rate limiting.
app.set('trust proxy', 1);

// ─── HTTPS Redirect (production only) ────────────────────────────────────────
// The reverse proxy terminates TLS and sets X-Forwarded-Proto.
// Redirect any HTTP request to HTTPS before it reaches any route handler.
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
      logger.security('http.redirect_to_https', {
        ip: getClientIp(req),
        from: req.originalUrl,
        to: httpsUrl,
      });
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  // HSTS: tell browsers to always use HTTPS for this domain for 1 year
  hsts: {
    maxAge: 31_536_000,          // 1 year in seconds
    includeSubDomains: true,
    preload: true,               // eligible for browser HSTS preload lists
  },
  // Content-Security-Policy: restrict resource loading
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'", 'https:'],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],   // equivalent to X-Frame-Options: DENY
    },
  },
  // Prevent MIME-type sniffing
  noSniff: true,
  // Disable X-Powered-By: Express fingerprinting
  hidePoweredBy: true,
  // Referrer policy — don't leak full URL to third-party requests
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman in dev)
    if (!origin || origin === ALLOWED_ORIGIN) {
      return callback(null, true);
    }
    logger.security('cors.blocked', { blockedOrigin: origin, allowedOrigin: ALLOWED_ORIGIN });
    return callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again later.' },
  // Log every rate-limit trigger as a security event
  handler: (req, res, next, options) => {
    logger.security('ratelimit.global.triggered', {
      ip: getClientIp(req),
      method: req.method,
      path: req.path,
      limit: options.max,
      windowMs: options.windowMs,
    });
    res.status(options.statusCode).json(options.message);
  },
});
app.use(globalLimiter);

// ─── Clerk Middleware ─────────────────────────────────────────────────────────
app.use(clerkMiddleware());

// ─── Structured Request Logger ────────────────────────────────────────────────
// JSON format for cloud log aggregators; uses the morganStream from logger.js
morgan.token('client-ip', (req) => getClientIp(req));
app.use(
  morgan(
    (tokens, req, res) => {
      const status = tokens.status(req, res);
      const duration = tokens['response-time'](req, res);
      const ip = tokens['client-ip'](req, res);
      const method = tokens.method(req, res);
      const url = tokens.url(req, res);

      const entry = {
        timestamp: new Date().toISOString(),
        level: status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO',
        event: 'http.request',
        ip,
        method,
        path: url,
        status: Number(status),
        durationMs: Number(duration),
      };
      return JSON.stringify(entry);
    },
    { stream: morganStream }
  )
);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Returns minimal info — no uptime or timestamp leakage
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Never expose stack traces or internal details to the client.
// All errors go to the structured logger (stdout), not to disk files.
app.use((err, req, res, next) => {
  // CORS violations
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: 'Forbidden: cross-origin request blocked.' });
  }

  // Log full error details internally — client gets only a generic message
  logger.error('error.unhandled', {
    ip: getClientIp(req),
    method: req.method,
    path: req.path,
    status: err.status || 500,
    error: err.message,
    // Stack only in non-production to avoid leaking internals in logs shipped to external services
    ...(IS_PRODUCTION ? {} : { stack: err.stack }),
  });

  res.status(err.status || 500).json({
    message: 'An internal server error occurred.',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    logger.info('db.connecting', { message: 'Connecting to PostgreSQL...' });
    await prisma.$connect();
    logger.info('db.connected', { message: 'PostgreSQL connection established.' });

    app.listen(PORT, () => {
      logger.info('server.started', {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        httpsEnforced: IS_PRODUCTION,
        allowedOrigin: ALLOWED_ORIGIN,
      });
    });
  } catch (error) {
    logger.error('server.startup_failed', { error: error.message });
    process.exit(1);
  }
};

startServer();
