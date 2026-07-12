import axios from 'axios';
import { PrivateCompanyError, SymbolResolutionError, FmpApiError } from './errors.js';
import { sanitizeQuery } from '../middleware/validateParams.js';

/**
 * Known Private Companies or Subsidiaries that are not publicly traded.
 * Prevents downstream API request costs and rate limits.
 */
const PRIVATE_COMPANIES = new Set([
  'spacex',
  'openai',
  'flipkart',
  'byju',
  'byjus',
  'byju\'s',
  'chatgpt',
  'stripe',
  'epic games',
  'kfc' // KFC is owned by Yum! Brands (YUM), which is public, but KFC itself is a subsidiary.
]);

/**
 * Local dictionary for popular companies to resolve symbols instantly with 0 API calls.
 * Ensures consistent NSE/BSE suffix mappings for Indian tickers.
 */
const LOCAL_TICKER_MAP = {
  'google': { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  'alphabet': { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  'apple': { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  'microsoft': { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  'tesla': { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  'nvidia': { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  'accenture': { symbol: 'ACN', name: 'Accenture plc', exchange: 'NYSE' },
  'tcs': { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', exchange: 'NSE' },
  'infosys': { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE' },
  'reliance': { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE' },
  'hdfc bank': { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE' }
};

/**
 * Resolves user query to a valid stock ticker symbol using local map or FMP search stable endpoints.
 * Catches private companies and throws structured custom errors.
 *
 * @param {string} query - The search query (company name or ticker symbol)
 * @returns {Promise<{symbol: string, name: string, exchange: string}>}
 * @throws {PrivateCompanyError}
 * @throws {SymbolResolutionError}
 */
export async function resolveSymbol(query) {
  const fmpKey = process.env.FMP_API_KEY;
  if (!query) {
    throw new SymbolResolutionError('Empty query');
  }

  const cleanQuery = query.trim().toLowerCase();

  // 1. Check if the query is a known private company/subsidiary
  for (const privateCompany of PRIVATE_COMPANIES) {
    if (cleanQuery === privateCompany || cleanQuery.includes(privateCompany)) {
      throw new PrivateCompanyError(query);
    }
  }

  // 2. Check local mapping first (instant resolution, supports NSE/BSE correctly)
  if (LOCAL_TICKER_MAP[cleanQuery]) {
    console.log(`[Symbol Resolver] Local resolve for "${query}":`, LOCAL_TICKER_MAP[cleanQuery]);
    return LOCAL_TICKER_MAP[cleanQuery];
  }

  if (!fmpKey || fmpKey.trim() === '') {
    throw new Error('FMP API key is not configured.');
  }

  // 3. Fallback to FMP search stable endpoints
  try {
    const sanitized = sanitizeQuery(query);
    const encoded = encodeURIComponent(sanitized);

    // Try stable symbol search first
    console.log(`[Symbol Resolver] Querying FMP stable search-symbol for: "${sanitized}"`);
    const symRes = await axios.get(
      `https://financialmodelingprep.com/stable/search-symbol?query=${encoded}&apikey=${fmpKey}`
    );
    let searchData = symRes.data || [];

    // If symbol search yielded no results, try name search
    if (searchData.length === 0) {
      console.log(`[Symbol Resolver] Querying FMP stable search-name for: "${sanitized}"`);
      const nameRes = await axios.get(
        `https://financialmodelingprep.com/stable/search-name?query=${encoded}&apikey=${fmpKey}`
      );
      searchData = nameRes.data || [];
    }

    if (searchData['Error Message']) {
      throw new FmpApiError(searchData['Error Message'], 400);
    }

    if (!Array.isArray(searchData) || searchData.length === 0) {
      throw new SymbolResolutionError(query);
    }

    // 4. Resolve the best matching exchange symbol
    // Prioritize major US exchanges (NASDAQ/NYSE), then NSE/BSE suffixes (.NS / .BO)
    const bestMatch =
      searchData.find(item => item.exchange === 'NASDAQ' || item.exchange === 'NYSE') ||
      searchData.find(item => item.symbol.endsWith('.NS') || item.exchange === 'NSE') ||
      searchData.find(item => item.symbol.endsWith('.BO') || item.exchange === 'BSE') ||
      searchData[0];

    return {
      symbol: bestMatch.symbol.toUpperCase(),
      name: bestMatch.name || bestMatch.symbol,
      exchange: bestMatch.exchange || 'Unknown'
    };
  } catch (err) {
    if (err instanceof PrivateCompanyError || err instanceof SymbolResolutionError || err instanceof FmpApiError) {
      throw err;
    }
    console.error('[Symbol Resolver] FMP lookup exception:', err.message);
    throw new SymbolResolutionError(query);
  }
}
