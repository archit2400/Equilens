import prisma from '../config/db.js';

/**
 * Service to manage Postgres DB operations for Companies, Reports, and News feeds.
 * Follows ACID transactions and utilizes Prisma upsert() to prevent duplicate symbols.
 */

/**
 * Upserts (creates or updates) a company details entry in the database.
 * Ensures the company symbol is stored uniquely.
 *
 * @param {any} profile - FMP Company profile data
 * @param {any} metrics - FMP Company metrics data
 * @returns {Promise<any>} The saved company record
 */
export async function upsertCompany(profile, metrics) {
  const symbol = profile.symbol.toUpperCase();

  const data = {
    symbol,
    name: profile.name,
    description: profile.description || null,
    industry: profile.industry || null,
    sector: profile.sector || null,
    ceo: profile.ceo || null,
    website: profile.website || null,
    marketCap: metrics.marketCap,
    peRatio: metrics.peRatio,
    dyRatio: metrics.dyRatio,
    revenue: metrics.revenue,
    netProfit: metrics.netProfit,
    profitMargin: metrics.profitMargin,
    debtToEquity: metrics.debtToEquity,
    currentRatio: metrics.currentRatio,
    eps: metrics.eps,
    beta: metrics.beta,
    employees: metrics.employees
  };

  console.log(`[Company Service] Database upsert for symbol: ${symbol}`);

  return await prisma.company.upsert({
    where: { symbol },
    update: data,
    create: data
  });
}

/**
 * Saves a company research analysis report, updates the cached news feed,
 * and records search query history in a single Prisma transaction.
 *
 * @param {string} userId - ID of the authenticated user
 * @param {any} company - Upserted company database object
 * @param {Array<any>} newsFeed - Fetched news list from Tavily
 * @param {any} analysis - Output from Gemini analysis
 * @returns {Promise<any>} The saved Report record including the company details
 */
export async function saveReport(userId, company, newsFeed, analysis) {
  console.log(`[Company Service] Saving report and caching news for symbol: ${company.symbol}`);

  const sentimentMap = {};
  if (analysis.news && Array.isArray(analysis.news)) {
    analysis.news.forEach(n => {
      if (n.title) {
        sentimentMap[n.title.toLowerCase().trim()] = n.sentiment || 'Neutral';
      }
    });
  }

  const newsToInsert = newsFeed.map(article => {
    let sentiment = 'Neutral';
    const lowerTitle = article.title.toLowerCase().trim();
    Object.keys(sentimentMap).forEach(key => {
      if (lowerTitle.includes(key) || key.includes(lowerTitle)) {
        sentiment = sentimentMap[key];
      }
    });

    return {
      companyId: company.id,
      title: article.title,
      source: article.source || 'Search Feed',
      url: article.url || null,
      summary: article.summary || null,
      sentiment: sentiment,
      publishedAt: article.publishedAt || new Date()
    };
  });

  // Run updates inside a single PostgreSQL transaction
  const [_, __, report] = await prisma.$transaction([
    // 1. Delete legacy news caches for this company
    prisma.news.deleteMany({
      where: { companyId: company.id }
    }),
    
    // 2. Add new news feeds to the DB
    prisma.news.createMany({
      data: newsToInsert
    }),

    // 3. Create the Detailed Report
    prisma.report.create({
      data: {
        userId: userId,
        companyId: company.id,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities: analysis.opportunities,
        threats: analysis.threats,
        risks: analysis.risks,
        news: analysis.news
      },
      include: {
        company: true
      }
    }),

    // 4. Save history record
    prisma.history.create({
      data: {
        userId: userId,
        query: `${company.name} (${company.symbol})`
      }
    })
  ]);

  return report;
}
