import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { Star, Building2, Trash2, ArrowUpRight, Loader2, Globe } from 'lucide-react';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (e, companyId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this company from your favorites list?')) return;

    setIsDeleting(companyId);
    try {
      await api.delete(`/favorites/${companyId}`);
      setFavorites(favorites.filter(f => f.companyId !== companyId));
    } catch (err) {
      console.error('Failed to delete favorite:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCardClick = (symbol) => {
    navigate(`/dashboard?search=${encodeURIComponent(symbol)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Star className="h-5 w-5 text-accent-amber fill-accent-amber" />
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-slate-100 font-mono">
          Pinned Favorite Companies
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-accent-blue">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              onClick={() => handleCardClick(fav.company.symbol)}
              className="glass-card p-5 flex flex-col justify-between h-44 cursor-pointer relative group border-t border-t-accent-amber/20 hover:border-t-accent-amber"
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-200 truncate max-w-[150px] group-hover:text-accent-blue transition-colors">
                      {fav.company.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-accent-amber bg-accent-amber/10 px-2.5 py-0.5 rounded border border-accent-amber/20">
                      {fav.company.symbol}
                    </span>
                  </div>
                  
                  <Star className="h-5 w-5 text-accent-amber fill-accent-amber animate-pulse" />
                </div>

                {/* Body Sector info */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Sector: {fav.company.sector || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Industry: {fav.company.industry || 'Unknown'}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-slate-900/60 pt-3 mt-3">
                <span className="text-[10px] font-mono text-slate-500">
                  Added {new Date(fav.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleRemove(e, fav.companyId)}
                    disabled={isDeleting === fav.companyId}
                    className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-accent-red hover:bg-accent-red/10 hover:border-accent-red/20 transition-all duration-200 cursor-pointer"
                    title="Remove Favorite"
                  >
                    {isDeleting === fav.companyId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <span className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 group-hover:text-accent-blue group-hover:bg-accent-blue/10 transition-colors">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-xl mx-auto">
          <Star className="h-12 w-12 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-300 font-sans">No favorite companies pinned</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pin companies that you monitor frequently to this folder by clicking the Heart button inside the generated valuation card.
          </p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
