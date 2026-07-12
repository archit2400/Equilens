import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import logger, { getClientIp, hashEmail, trackAuthFailure } from '../config/logger.js';

// ─── Validation Rules ─────────────────────────────────────────────────────────
export const registerValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email address is too long.'),
  body('password')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be between 8 and 100 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name is too long.')
    .escape(),
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 100 }).withMessage('Invalid credentials.'),
];

// ─── In-memory login attempt tracker (upgrade to Redis in production) ─────────
const loginAttempts = new Map(); // key: email, value: { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginAttempts(email) {
  const record = loginAttempts.get(email);
  if (!record) return { allowed: true };
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return { allowed: false, minutesLeft, count: record.count };
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginAttempts.delete(email);
  }
  return { allowed: true };
}

function recordFailedAttempt(email) {
  const record = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(email, record);
  return record;
}

function clearLoginAttempts(email) {
  loginAttempts.delete(email);
}

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email, password, name } = req.body;
    const ip = getClientIp(req);

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Generic message — no user enumeration
      logger.security('auth.register.duplicate_attempt', { emailHash: hashEmail(email), ip });
      return res.status(400).json({ message: 'Unable to create account. Please try different credentials.' });
    }

    // bcrypt cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
      },
    });

    logger.security('auth.register.success', {
      userId: user.id,
      emailHash: hashEmail(user.email),
      ip,
    });

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m', issuer: 'equilens-api' }
    );

    res.status(201).json({
      token,
      expiresIn: 900,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    logger.error('auth.register.error', { error: error.message });
    res.status(500).json({ message: 'Registration failed due to a server error.' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const ip = getClientIp(req);
    const emailHash = hashEmail(normalizedEmail); // PII-safe identifier for logs

    // ── Check account lockout ─────────────────────────────────────────────────
    const { allowed, minutesLeft, count } = checkLoginAttempts(normalizedEmail);
    if (!allowed) {
      logger.security('auth.login.lockout_active', {
        emailHash,
        ip,
        failedAttempts: count,
        minutesRemaining: minutesLeft,
      });
      return res.status(429).json({
        message: `Too many failed attempts. Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Timing-attack safe: always run bcrypt even if user doesn't exist
    const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isMatch) {
      const record = recordFailedAttempt(normalizedEmail);

      // Log security event — email hash only, never plaintext
      logger.security('auth.login.failure', {
        emailHash,
        ip,
        attemptNumber: record.count,
        locked: record.count >= MAX_ATTEMPTS,
        userAgent: req.headers?.['user-agent']?.slice(0, 120),
      });

      // Track IP-level anomaly (many 401s from same IP)
      trackAuthFailure(ip, req);

      // Log lockout event separately when it first triggers
      if (record.count === MAX_ATTEMPTS) {
        logger.security('auth.login.lockout_triggered', {
          emailHash,
          ip,
          lockoutMinutes: LOCKOUT_MS / 60000,
        });
      }

      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Success ───────────────────────────────────────────────────────────────
    clearLoginAttempts(normalizedEmail);

    logger.security('auth.login.success', {
      userId: user.id,
      emailHash,
      ip,
      userAgent: req.headers?.['user-agent']?.slice(0, 120),
    });

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m', issuer: 'equilens-api' }
    );

    res.json({
      token,
      expiresIn: 900,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    logger.error('auth.login.error', { error: error.message });
    res.status(500).json({ message: 'Login failed due to a server error.' });
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // Explicitly excludes: password
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    logger.error('auth.getme.error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to retrieve profile.' });
  }
};
