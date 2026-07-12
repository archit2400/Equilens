import dotenv from 'dotenv';
dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY;

// Fallback prices in case FMP is down
const mockDict = {
  'NVDA': { name: 'NVIDIA Corp.', price: '$209.98', change: '+3.55%', isPositive: true },
  'AAPL': { name: 'Apple Inc.', price: '$213.32', change: '-0.42%', isPositive: false },
  'TSLA': { name: 'Tesla Inc.', price: '$314.67', change: '+1.83%', isPositive: true },
  'MSFT': { name: 'Microsoft Corp.', price: '$501.45', change: '-0.28%', isPositive: false }
};

// Allowed character pattern for stock symbols
const SYMBOL_REGEX = /^[A-Z0-9.^-]{1,10}$/;
const MAX_SYMBOLS = 10;

export const getPublicQuotes = async (req, res) => {
  try {
    const symbolsQuery = req.query.symbols || 'NVDA,AAPL,TSLA,MSFT';

    // Validate input format — only safe characters, no injection
    if (!/^[A-Z0-9.,^-]+$/i.test(symbolsQuery)) {
      return res.status(400).json({ message: 'Invalid symbols format.' });
    }

    const symbolsArray = symbolsQuery
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    // Cap to prevent server-side request amplification
    if (symbolsArray.length > MAX_SYMBOLS) {
      return res.status(400).json({ message: `Maximum ${MAX_SYMBOLS} symbols allowed per request.` });
    }

    // Validate each individual symbol
    const invalidSymbol = symbolsArray.find(s => !SYMBOL_REGEX.test(s));
    if (invalidSymbol) {
      return res.status(400).json({ message: `Invalid stock symbol: "${invalidSymbol}".` });
    }

    // Fetch all symbols in parallel from FMP stable endpoint
    const promises = symbolsArray.map(async (symbol) => {
      try {
        const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${FMP_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        // FMP stable returns an array
        const q = Array.isArray(data) ? data[0] : null;

        if (!q || q['Error Message']) {
          throw new Error(q?.['Error Message'] || 'No data returned');
        }

        const changePercent = q.changePercentage ?? 0;
        return {
          symbol,
          name: q.name || symbol,
          price: `$${(+q.price).toFixed(2)}`,
          change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          isPositive: changePercent >= 0
        };

      } catch (err) {
        console.warn(`[Public Quote FMP Failed] ${symbol}:`, err.message);
        return {
          symbol,
          ...(mockDict[symbol] || { name: `${symbol} Corp.`, price: '$100.00', change: '0.00%', isPositive: true })
        };
      }
    });

    const quotes = await Promise.all(promises);
    res.json(quotes);

  } catch (error) {
    console.error('getPublicQuotes error:', error);
    res.status(500).json({ message: 'Internal server error fetching public quotes.' });
  }
};
