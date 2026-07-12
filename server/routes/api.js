import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, getMe, registerValidation, loginValidation } from '../controllers/auth.controller.js';
import { analyzeCompany } from '../controllers/analyze.controller.js';
import { getPublicQuotes } from '../controllers/public.controller.js';
import { verifyToken } from '../middleware/jwt.js';
import { requireUuid } from '../middleware/validateParams.js';
import {
  getReports,
  getReportById,
  deleteReport,
  getHistory,
  getFavorites,
  addFavorite,
  deleteFavorite,
} from '../controllers/reports.controller.js';

const router = Router();

// ─── Auth-specific rate limiter ───────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/public/quotes', getPublicQuotes);

// ─── Authentication Routes ────────────────────────────────────────────────────
router.post('/auth/register', authLimiter, registerValidation, register);
router.post('/auth/login',    authLimiter, loginValidation,    login);
router.get('/auth/me',        verifyToken, getMe);

// ─── Analysis Route ───────────────────────────────────────────────────────────
router.post('/analyze', verifyToken, analyzeCompany);

// ─── Saved Reports Routes ─────────────────────────────────────────────────────
// requireUuid('id') validates the :id param is a proper UUID before any DB query
router.get('/reports',      verifyToken, getReports);
router.get('/report/:id',   verifyToken, requireUuid('id'), getReportById);
router.delete('/report/:id',verifyToken, requireUuid('id'), deleteReport);

// ─── Search History Route ─────────────────────────────────────────────────────
router.get('/history', verifyToken, getHistory);

// ─── Favorites Routes ─────────────────────────────────────────────────────────
router.get('/favorites',          verifyToken, getFavorites);
router.post('/favorites',         verifyToken, addFavorite);
// :id may be a Favorite UUID or a Company UUID — validate before controller
router.delete('/favorites/:id',   verifyToken, requireUuid('id'), deleteFavorite);

export default router;
