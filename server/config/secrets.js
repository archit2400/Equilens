/**
 * Startup Secrets Validator
 *
 * Call validateSecrets() before any other initialization.
 * If a required secret is missing or invalid, the server refuses to start
 * with a clear, actionable error message.
 *
 * This prevents silent misconfiguration in production deployments.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Validates all required environment variables.
 * Calls process.exit(1) if any critical secret is missing or malformed.
 */
export function validateSecrets() {
  const errors = [];
  const warnings = [];

  // ── JWT_SECRET ─────────────────────────────────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is not set.');
  } else if (jwtSecret.length < 64) {
    errors.push(
      `JWT_SECRET is too short (${jwtSecret.length} chars). ` +
      'Minimum 64 characters required. ' +
      'Generate one with: node -e "require(\'crypto\').randomBytes(64).toString(\'hex\')|console.log"'
    );
  }

  // ── DATABASE_URL ───────────────────────────────────────────────────────────
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    errors.push('DATABASE_URL is not set.');
  } else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...).');
  } else if (IS_PRODUCTION && !databaseUrl.includes('sslmode=require')) {
    warnings.push('DATABASE_URL does not include sslmode=require. SSL is strongly recommended in production.');
  }

  // ── CLERK_SECRET_KEY ───────────────────────────────────────────────────────
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    errors.push('CLERK_SECRET_KEY is not set. Required for Clerk backend authentication.');
  } else if (!clerkSecret.startsWith('sk_')) {
    warnings.push('CLERK_SECRET_KEY does not look like a valid Clerk secret key (expected prefix: sk_).');
  }

  // ── CLERK_PUBLISHABLE_KEY ──────────────────────────────────────────────────
  const clerkPub = process.env.CLERK_PUBLISHABLE_KEY;
  if (!clerkPub) {
    errors.push('CLERK_PUBLISHABLE_KEY is not set. Required for Clerk backend authentication.');
  } else if (!clerkPub.startsWith('pk_')) {
    warnings.push('CLERK_PUBLISHABLE_KEY does not look like a valid Clerk publishable key (expected prefix: pk_).');
  }

  // ── ALLOWED_ORIGIN ─────────────────────────────────────────────────────────
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin) {
    warnings.push('ALLOWED_ORIGIN is not set. Defaulting to http://localhost:5173. Set this to your production frontend URL.');
  } else if (IS_PRODUCTION && (allowedOrigin.includes('localhost') || allowedOrigin.includes('127.0.0.1'))) {
    warnings.push(
      `ALLOWED_ORIGIN is set to "${allowedOrigin}" but NODE_ENV=production. ` +
      'Update ALLOWED_ORIGIN to your production frontend domain (e.g., https://your-app.vercel.app).'
    );
  }

  // ── External API keys (warn only — app can degrade gracefully) ─────────────
  if (!process.env.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY is not set. AI analysis features will be unavailable.');
  }
  if (!process.env.FMP_API_KEY) {
    warnings.push('FMP_API_KEY is not set. Financial data features will be limited.');
  }

  // ── Output results ─────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    console.warn('\n[Secrets] ⚠️  Configuration warnings:');
    warnings.forEach((w) => console.warn(`  • ${w}`));
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('\n[Secrets] 🚨 CRITICAL: Missing or invalid environment variables. Server cannot start.\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    console.error('\nFix these issues in your .env file and restart the server.\n');
    process.exit(1);
  }

  console.log(`[Secrets] ✓ All required secrets validated (${IS_PRODUCTION ? 'production' : 'development'} mode).`);
}
