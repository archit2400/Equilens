import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { History, Calendar, Search, Loader2, RefreshCw } from 'lucide-react';

const SearchHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/history');
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryClick = (query) => {
    // Extract symbol if in format "Company Name (SYMBOL)"
    let target = query;
    const match = query.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      target = match[1];
    }
    navigate(`/dashboard?search=${encodeURIComponent(target)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-accent-blue" />
          <h1 className="text-xl font-extrabold tracking-wider uppercase text-slate-100 font-mono">
            Analysis Search History
          </h1>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh History"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-accent-blue">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : history.length > 0 ? (
        <div className="glass-panel p-6 border-slate-800/80 max-w-3xl">
          <div className="divide-y divide-slate-900/60">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleQueryClick(item.query)}
                className="flex items-center justify-between py-4 hover:bg-slate-900/10 px-3 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 group-hover:text-accent-blue transition-colors">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-accent-blue transition-colors leading-tight">
                      {item.query}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Triggered research audit console
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-[10px] font-mono text-slate-500 space-x-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(item.searchedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-xl mx-auto">
          <History className="h-12 w-12 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-300">Search history is clear</h2>
          <p className="text-xs text-slate-500">
            Any company search analysis you perform will be saved here for quick audit access.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchHistory;
