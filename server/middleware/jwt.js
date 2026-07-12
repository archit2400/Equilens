import { getAuth, clerkClient } from '@clerk/express';
import prisma from '../config/db.js';
import logger, { getClientIp } from '../config/logger.js';

// ─── Clerk User ID format validator ──────────────────────────────────────────
// Clerk user IDs follow the pattern: user_XXXXXXXXXXXXXXXXXXXXXXXXXX
const CLERK_ID_REGEX = /^user_[a-zA-Z0-9]{20,}$/;

export const verifyToken = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const ip = getClientIp(req);

    if (!auth || !auth.userId) {
      logger.security('auth.token.missing', {
        ip,
        method: req.method,
        path: req.path,
        userAgent: req.headers?.['user-agent']?.slice(0, 120),
      });
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }

    // Validate Clerk user ID format to prevent injection
    if (!CLERK_ID_REGEX.test(auth.userId)) {
      logger.security('auth.token.invalid_format', {
        ip,
        reason: 'userId failed regex validation',
      });
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    // ── Sync/verify user in local DB on demand ────────────────────────────────
    let localUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true },
    });

    if (!localUser) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);

      // ── Email verification gate ───────────────────────────────────────────
      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      );
      const isEmailVerified = primaryEmail?.verification?.status === 'verified';

      if (!isEmailVerified) {
        logger.security('auth.email.unverified', {
          ip,
          userId: auth.userId,
        });
        return res.status(403).json({
          message: 'Email address is not verified. Please verify your email before accessing this resource.',
        });
      }

      const email = primaryEmail?.emailAddress;
      const name = clerkUser.fullName || clerkUser.firstName || 'Investor';

      // Check for legacy account with same email
      const legacyUser = await prisma.user.findUnique({ where: { email } });

      if (legacyUser) {
        try {
          logger.info('auth.clerk.legacy_migration', { userId: auth.userId });
          // Use ORM update instead of $executeRaw — eliminates raw SQL entirely
          await prisma.user.update({
            where: { id: legacyUser.id },
            data: { id: auth.userId },
          });
        } catch (updateError) {
          logger.warn('auth.clerk.migration_skipped', { message: updateError.message });
        }
        localUser = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { id: true, email: true },
        });
      } else {
        try {
          localUser = await prisma.user.create({
            data: {
              id: auth.userId,
              email: email || `${auth.userId}@noemail.placeholder`,
              name,
              // Cryptographically random sentinel — not a real password
              password: await import('crypto').then(m =>
                m.randomBytes(64).toString('hex')
              ),
            },
            select: { id: true, email: true },
          });
          logger.security('auth.clerk.user_synced', { userId: auth.userId, ip });
        } catch (createError) {
          if (createError.code === 'P2002') {
            // Parallel request already created the user — safe to ignore
            logger.warn('auth.clerk.sync_race', { userId: auth.userId });
            localUser = await prisma.user.findUnique({
              where: { id: auth.userId },
              select: { id: true, email: true },
            });
          } else {
            throw createError;
          }
        }
      }
    }

    // Attach minimal user info to request — never expose sensitive fields
    req.user = { id: auth.userId };
    next();
  } catch (error) {
    logger.error('auth.middleware.error', {
      error: error.message,
      path: req.path,
      ip: getClientIp(req),
    });
    return res.status(500).json({ message: 'Authentication error. Please try again.' });
  }
};
