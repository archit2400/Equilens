import prisma from '../config/db.js';
import { isValidUuid } from '../middleware/validateParams.js';

// ─── Retrieve all reports created by the logged-in user ───────────────────────
export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await prisma.report.findMany({
      where: { userId }, // scoped to owner — no IDOR possible
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('[GetReports Error]', error.message);
    res.status(500).json({ message: 'Failed to retrieve reports.' });
  }
};

// ─── Retrieve a single report by ID ──────────────────────────────────────────
// Ownership is enforced atomically inside the Prisma query (where: { id, userId }).
// If the report doesn't exist OR belongs to another user, Prisma returns null.
// Both cases return 404 — attacker cannot distinguish "not yours" from "doesn't exist".
export const getReportById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: {
        id,
        userId, // ← ownership baked into the DB query — zero data leakage
      },
      include: { company: true },
    });

    if (!report) {
      // Generic 404 — intentionally does not distinguish "not found" from "forbidden"
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.json(report);
  } catch (error) {
    console.error('[GetReportById Error]', error.message);
    res.status(500).json({ message: 'Failed to retrieve report.' });
  }
};

// ─── Delete a report ──────────────────────────────────────────────────────────
// Uses deleteMany with { id, userId } — atomic single-query ownership check + delete.
// No fetch-then-check pattern; no race window; no foreign data ever touched.
export const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await prisma.report.deleteMany({
      where: {
        id,
        userId, // ← only deletes if the record belongs to this user
      },
    });

    if (result.count === 0) {
      // Either report doesn't exist or belongs to someone else — same 404
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.json({ message: 'Report deleted successfully.' });
  } catch (error) {
    console.error('[DeleteReport Error]', error.message);
    res.status(500).json({ message: 'Failed to delete report.' });
  }
};

// ─── Retrieve search history (scoped to user) ─────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await prisma.history.findMany({
      where: { userId }, // scoped to owner
      orderBy: { searchedAt: 'desc' },
      take: 50,
    });
    res.json(history);
  } catch (error) {
    console.error('[GetHistory Error]', error.message);
    res.status(500).json({ message: 'Failed to retrieve search history.' });
  }
};

// ─── Retrieve favorite companies (scoped to user) ─────────────────────────────
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await prisma.favorite.findMany({
      where: { userId }, // scoped to owner
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(favorites);
  } catch (error) {
    console.error('[GetFavorites Error]', error.message);
    res.status(500).json({ message: 'Failed to retrieve favorites.' });
  }
};

// ─── Add a company to favorites ───────────────────────────────────────────────
// userId is always sourced from req.user.id (the verified Clerk session) —
// the client cannot inject a different userId.
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId, symbol } = req.body;

    let targetCompanyId = companyId;

    // Validate companyId format if directly provided
    if (targetCompanyId && !isValidUuid(targetCompanyId)) {
      return res.status(400).json({ message: 'Invalid company ID format.' });
    }

    // Resolve companyId from symbol if not directly provided
    if (!targetCompanyId && symbol) {
      // Validate symbol format before hitting DB
      if (!/^[A-Z0-9.^-]{1,10}$/i.test(symbol)) {
        return res.status(400).json({ message: 'Invalid stock symbol format.' });
      }
      const company = await prisma.company.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { id: true },
      });
      if (!company) {
        return res.status(404).json({ message: 'Company not found. Analyze it first.' });
      }
      targetCompanyId = company.id;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ message: 'Company ID or Symbol is required.' });
    }

    // Verify the target company actually exists before creating the relation
    const companyExists = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { id: true },
    });
    if (!companyExists) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    // Check if already favorited (scoped to this user)
    const existingFav = await prisma.favorite.findUnique({
      where: {
        userId_companyId: { userId, companyId: targetCompanyId },
      },
    });
    if (existingFav) {
      return res.status(400).json({ message: 'Company is already in your favorites.' });
    }

    const favorite = await prisma.favorite.create({
      data: { userId, companyId: targetCompanyId },
      include: { company: true },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('[AddFavorite Error]', error.message);
    res.status(500).json({ message: 'Failed to add favorite.' });
  }
};

// ─── Remove a company from favorites ─────────────────────────────────────────
// The :id param can be either a Favorite record ID or a Company ID.
// In both lookup paths, userId is included in the WHERE clause from the start —
// no fetch-then-check, no foreign record exposure.
export const deleteFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Attempt 1: treat :id as the Favorite row ID, scoped to this user
    let favorite = await prisma.favorite.findFirst({
      where: {
        id,
        userId, // ← ownership enforced in query — no foreign rows returned
      },
      select: { id: true },
    });

    // Attempt 2: treat :id as a Company ID, scoped to this user
    if (!favorite) {
      favorite = await prisma.favorite.findUnique({
        where: {
          userId_companyId: { userId, companyId: id },
        },
        select: { id: true },
      });
    }

    if (!favorite) {
      // Generic 404 — does not reveal whether the ID belongs to another user
      return res.status(404).json({ message: 'Favorite entry not found.' });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({ message: 'Removed from favorites.' });
  } catch (error) {
    console.error('[DeleteFavorite Error]', error.message);
    res.status(500).json({ message: 'Failed to remove from favorites.' });
  }
};
