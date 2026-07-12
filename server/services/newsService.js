import axios from 'axios';

/**
 * Utility to extract cleaner publisher source names from URLs.
 *
 * @param {string} urlStr - The URL string to parse
 * @returns {string} Domain name without www prefix
 */
const extractSource = (urlStr) => {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace('www.', '');
  } catch (e) {
    return 'Financial News';
  }
};

/**
 * Fetches latest stock news using Tavily Search API as a singular, unified provider.
 * Excludes Yahoo News scraping completely.
 *
 * @param {string} companyName - Full name of the company
 * @param {string} symbol - Ticker symbol
 * @returns {Promise<Array<{title: string, source: string, url: string, summary: string, publishedAt: Date}>>}
 */
export async function fetchNews(companyName, symbol) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[News Service] TAVILY_API_KEY is not set. Returning empty news cache.');
    return [];
  }

  const query = `${companyName} (${symbol}) stock news analysis latest updates`;
  console.log(`[News Service] Fetching news from Tavily for query: "${query}"`);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: 8
      })
    });

    if (!response.ok) {
      console.warn(`[News Service] Tavily request failed with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map(item => ({
      title: item.title || `${companyName} stock analysis update`,
      source: extractSource(item.url),
      url: item.url || '',
      summary: item.content || item.title || '',
      publishedAt: new Date() // Tavily search results reflect real-time results; defaults to current date
    }));
  } catch (error) {
    console.error('[News Service] Exception querying Tavily news:', error.message);
    return []; // Return empty news array gracefully to prevent breaking the pipeline
  }
}
