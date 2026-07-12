# EquiLens Backend — Deployment Checklist

Use this checklist every time you deploy or update the server in production.

---

## 1. Environment Variables

Set **all** of these in your hosting provider's secret/env manager (not in any committed file):

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | ✅ | Set to `production` |
| `PORT` | ✅ | Render sets this automatically |
| `DATABASE_URL` | ✅ | Must include `sslmode=require` |
| `JWT_SECRET` | ✅ | Min 64 random hex chars. Rotate every 90 days |
| `CLERK_SECRET_KEY` | ✅ | From Clerk Dashboard → API Keys |
| `ALLOWED_ORIGIN` | ✅ | Your Vercel frontend URL (no trailing slash) |
| `GEMINI_API_KEY` | ⚠️ | Required for AI analysis |
| `FMP_API_KEY` | ⚠️ | Required for financial data |
| `TAVILY_API_KEY` | ⚠️ | Required for news search |

> **Never put secrets in `.env` files committed to git.**
> Use Render's "Environment" tab or a secrets manager (e.g., Doppler, AWS Secrets Manager).

---

## 2. HTTPS

- TLS termination is handled by Render/Vercel at the reverse proxy layer
- The server enforces HTTPS via `X-Forwarded-Proto` redirect middleware (production only)
- HSTS header is sent with `max-age=31536000; includeSubDomains; preload`
- **Do not disable `trust proxy`** — the rate limiter depends on it for correct client IP detection

---

## 3. Database (Neon PostgreSQL)

- ✅ Connection requires `sslmode=require` — enforced in connection string
- ✅ Neon restricts direct public access — only your server can connect
- **Rotate database password** in [Neon Console](https://console.neon.tech) if you suspect exposure
- Run migrations before deploying new code:
  ```bash
  npx prisma migrate deploy
  ```

---

## 4. Clerk Authentication

- In [Clerk Dashboard](https://dashboard.clerk.com):
  - Enable **Email Verification** in Email settings
  - Set allowed redirect URLs to your production domain
  - Set **allowed origins** to your Vercel frontend URL
- Never use `CLERK_SECRET_KEY` in client-side (frontend) code

---

## 5. Render Deployment Settings

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm start` |
| **Node Version** | 18+ |
| **Health Check Path** | `/health` |
| **Auto-Deploy** | Recommended: enable on `main` branch only |

---

## 6. CORS

- Set `ALLOWED_ORIGIN` to your exact Vercel URL: `https://your-app.vercel.app`
- The server logs every blocked CORS attempt as a `SECURITY` event
- Do not set `ALLOWED_ORIGIN=*` in production

---

## 7. Monitoring & Logs

All logs are structured JSON written to stdout. In Render:
- Go to your service → **Logs** tab
- Filter by `"level":"SECURITY"` to see auth events
- Filter by `"event":"ratelimit"` to see rate limit triggers
- Filter by `"event":"anomaly.many_401s"` to detect credential stuffing

**Key security events to monitor:**
```
auth.login.failure          — failed login attempt
auth.login.lockout_triggered — account locked after 5 failures
anomaly.many_401s           — 10+ auth failures from same IP in 1 minute
ratelimit.global.triggered  — IP exceeded 100 req/15min
cors.blocked                — unauthorized origin attempting access
```

---

## 8. Key Rotation Schedule

| Secret | Rotation Frequency |
|---|---|
| `JWT_SECRET` | Every 90 days |
| `CLERK_SECRET_KEY` | Every 180 days or on suspected exposure |
| `DATABASE_URL` password | Every 90 days |
| `GEMINI_API_KEY` | Every 180 days |
| `FMP_API_KEY` / `TAVILY_API_KEY` | Every 180 days |

---

## 9. Pre-Deploy Checklist

```
[ ] NODE_ENV=production is set in hosting env vars
[ ] ALLOWED_ORIGIN points to production Vercel URL (not localhost)
[ ] DATABASE_URL contains sslmode=require
[ ] All API keys set in hosting provider (not in .env committed to git)
[ ] npx prisma migrate deploy has been run against production DB
[ ] .env is in .gitignore — verified with: git ls-files | grep .env (should return nothing)
[ ] Clerk Dashboard: email verification enabled, production domain added
```
