import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

const SearchBar = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = [
    { name: 'Tesla Inc.', symbol: 'TSLA' },
    { name: 'Apple Inc.', symbol: 'AAPL' },
    { name: 'Microsoft Corp.', symbol: 'MSFT' },
    { name: 'NVIDIA Corp.', symbol: 'NVDA' },
    { name: 'Amazon.com Inc.', symbol: 'AMZN' },
    { name: 'Alphabet Inc.', symbol: 'GOOGL' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (symbol) => {
    setQuery(symbol);
    onSearch(symbol);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-30">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
          placeholder="Search any public company name or stock symbol (e.g., TSLA, Apple)..."
          className="glass-input w-full rounded-full pl-6 pr-32 py-4 text-sm font-medium tracking-wide shadow-lg border-slate-800/80"
          disabled={isLoading}
        />
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 bg-gradient-to-r from-accent-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-xs px-6 py-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-blue-500/25 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing</span>
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5" />
              <span>Analyze</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestions Drawer */}
      {showSuggestions && !isLoading && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl p-3 z-30">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-2 font-mono">Popular Companies</p>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
            {suggestions.map((company) => (
              <button
                key={company.symbol}
                type="button"
                onClick={() => handleSuggestionClick(company.symbol)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/50 hover:bg-accent-blue/10 border border-slate-800/50 hover:border-accent-blue/30 text-left transition-all duration-200 cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-200 truncate pr-2">{company.name}</span>
                <span className="text-[10px] font-mono font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-md">{company.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
