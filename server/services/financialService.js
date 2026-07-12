import axios from 'axios';
import { FmpApiError } from './errors.js';
import { sanitizeSymbol } from '../middleware/validateParams.js';

/**
 * Utility to wrap any promise in a timeout limit
 *
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout limit in milliseconds
 * @param {string} operationName - Description of the operation for errors
 */
const withTimeout = (promise, ms, operationName = 'Operation') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${ms}ms`)), ms)
    )
  ]);
};

/**
 * Maps Axios errors or custom FMP payload error structures to structured FmpApiErrors.
 *
 * @param {Error} err - The error object to parse
 * @param {string} symbol - Symbol that was queried
 * @throws {FmpApiError}
 */
const handleAxiosError = (err, symbol) => {
  if (err instanceof FmpApiError) {
    throw err;
  }
  const status = err.response?.status || 500;
  const errMsg = err.response?.data?.['Error Message'] || err.message;
  console.error(`[FMP Error] status ${status} for symbol ${symbol}:`, errMsg);
  throw new FmpApiError(`FMP API failed for symbol ${symbol}: ${errMsg}`, status);
};

/**
 * Validates FMP response data, verifying key status, paywalls, and legacy endpoints.
 *
 * @param {any} resData - Response data to inspect
 * @throws {FmpApiError}
 */
const checkFmpPayload = (resData) => {
  if (resData && !Array.isArray(resData) && resData['Error Message']) {
    const msg = resData['Error Message'];
    let status = 400;
    if (msg.includes('Invalid API') || msg.includes('Expired')) {
      status = 401;
    } else if (msg.includes('Legacy') || msg.includes('Restricted') || msg.includes('Upgrade')) {
      status = 403;
    }
    throw new FmpApiError(msg, status);
  }
};

/**
 * Fetches all necessary company details and financial metrics from FMP stable endpoints in parallel.
 *
 * @param {string} symbol - The resolved stock symbol
 * @returns {Promise<{
 *   profile: {symbol: string, name: string, description: string, industry: string, sector: string, ceo: string, website: string, employees: number},
 *   metrics: {marketCap: number, peRatio: number, dyRatio: number, revenue: number, netProfit: number, profitMargin: number, debtToEquity: number, currentRatio: number, eps: number, beta: number, dividend: number},
 *   charts: Array<{year: number, revenue: number, earnings: number}>
 * }>}
 * @throws {FmpApiError}
 */
export async function fetchFinancialData(symbol) {
  const fmpKey = process.env.FMP_API_KEY;
  if (!fmpKey || fmpKey.trim() === '') {
    throw new Error('FMP API key is not configured.');
  }

  const safeSymbol = sanitizeSymbol(symbol).toUpperCase();
  console.log(`[Financial Service] Querying FMP stable endpoints for symbol: ${safeSymbol}`);

  try {
    const urls = {
      profile: `https://financialmodelingprep.com/stable/profile?symbol=${safeSymbol}&apikey=${fmpKey}`,
      ratios: `https://financialmodelingprep.com/stable/ratios-ttm?symbol=${safeSymbol}&apikey=${fmpKey}`,
      income: `https://financialmodelingprep.com/stable/income-statement?symbol=${safeSymbol}&limit=4&apikey=${fmpKey}`
    };

    console.log("=================================");
    console.log("FMP PROFILE URL:", urls.profile);
    console.log("FMP RATIOS URL:", urls.ratios);
    console.log("FMP INCOME URL:", urls.income);
    console.log("Symbol:", safeSymbol);
    console.log("API Key Prefix:", fmpKey?.substring(0,6));
    console.log("=================================");

    // 1. Profile is strictly required
    let profileRes;
    try {
      profileRes = await withTimeout(axios.get(urls.profile), 3000, 'FMP Profile Fetch');
    } catch (err) {
      console.error(`[FMP Profile Fetch Failed] for ${safeSymbol}:`, err.message);
      throw new FmpApiError(`FMP Profile API failed for symbol ${safeSymbol}: ${err.message}`, err.response?.status || 500);
    }

    checkFmpPayload(profileRes.data);
    const profileData = Array.isArray(profileRes.data) && profileRes.data[0] ? profileRes.data[0] : {};

    if (!profileData.symbol) {
      throw new FmpApiError(`Stock details for symbol ${safeSymbol} not found.`, 404);
    }

    // 2. Fetch ratios and income statement. Catch 402 paywall errors gracefully for global symbols
    let ratiosData = {};
    let incomeData = [];

    try {
      const [rRes, iRes] = await withTimeout(
        Promise.all([
          axios.get(urls.ratios).catch(err => {
            console.warn(`[FMP Ratios Paywall/Failure] for ${safeSymbol}: ${err.message}`);
            return { data: {} };
          }),
          axios.get(urls.income).catch(err => {
            console.warn(`[FMP Income Paywall/Failure] for ${safeSymbol}: ${err.message}`);
            return { data: [] };
          })
        ]),
        3000,
        'FMP Non-blocking Fetch'
      );

      // Inspect payloads for 402/paywall messages embedded inside 200 responses
      try { checkFmpPayload(rRes.data); } catch (e) { console.warn(`[Ratios Paywall Payload] ${safeSymbol}: ${e.message}`); rRes.data = {}; }
      try { checkFmpPayload(iRes.data); } catch (e) { console.warn(`[Income Paywall Payload] ${safeSymbol}: ${e.message}`); iRes.data = []; }

      ratiosData = Array.isArray(rRes.data) && rRes.data[0] ? rRes.data[0] : (rRes.data || {});
      incomeData = Array.isArray(iRes.data) ? iRes.data : [];
    } catch (metricErr) {
      console.warn(`[FMP Metrics Query Failed] non-blocking fallback for ${safeSymbol}:`, metricErr.message);
    }

    // Map historical statements to Recharts format
    let charts = [];
    if (incomeData.length > 0) {
      charts = incomeData.map(statement => ({
        year: new Date(statement.date).getFullYear(),
        revenue: statement.revenue || 0,
        earnings: statement.netIncome || 0
      })).reverse();
    }

    const latestStatement = incomeData[0] || {};

    const profile = {
      symbol: safeSymbol,
      name: profileData.companyName || safeSymbol,
      description: profileData.description || '',
      industry: profileData.industry || 'Unknown',
      sector: profileData.sector || 'Unknown',
      ceo: profileData.ceo || 'Unknown',
      website: profileData.website || '',
      employees: profileData.fullTimeEmployees ? parseInt(profileData.fullTimeEmployees, 10) : 0
    };

    const metrics = {
      marketCap: profileData.marketCap || null,
      peRatio: ratiosData.priceToEarningsRatioTTM || profileData.pe || null,
      dyRatio: ratiosData.dividendYieldTTM || null,
      revenue: latestStatement.revenue || null,
      netProfit: latestStatement.netIncome || null,
      profitMargin: ratiosData.netProfitMarginTTM || (latestStatement.netIncome && latestStatement.revenue ? latestStatement.netIncome / latestStatement.revenue : null),
      debtToEquity: ratiosData.debtToEquityRatioTTM !== undefined && ratiosData.debtToEquityRatioTTM !== null ? ratiosData.debtToEquityRatioTTM * 100 : null,
      currentRatio: ratiosData.currentRatioTTM || null,
      eps: latestStatement.eps || null,
      beta: profileData.beta || null,
      dividend: profileData.lastDividend || null
    };

    return {
      profile,
      metrics,
      charts
    };
  } catch (error) {
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);
    console.log("URL:", error.config?.url);
    console.log("MESSAGE:", error.message);
    throw error;
  }
}
// Trigger nodemon watch reload v3
