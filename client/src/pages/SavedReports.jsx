import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { Bookmark, Calendar, ArrowUpRight, Trash2, Loader2, Sparkles } from 'lucide-react';

const SavedReports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null); // stores reportId being deleted
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to load saved reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, reportId) => {
    e.stopPropagation(); // prevent card click redirect
    if (!window.confirm('Are you sure you want to delete this saved report?')) return;
    
    setIsDeleting(reportId);
    try {
      await api.delete(`/report/${reportId}`);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete report:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCardClick = (reportId) => {
    navigate(`/dashboard?reportId=${reportId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Bookmark className="h-5 w-5 text-accent-blue" />
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-slate-100 font-mono">
          Saved Reports Cache
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-accent-blue">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => {
            const isInvest = report.recommendation === 'INVEST';
            
            return (
              <div
                key={report.id}
                onClick={() => handleCardClick(report.id)}
                className="glass-card p-5 border-l-4 flex flex-col justify-between h-48 cursor-pointer relative group overflow-hidden
                  ${isInvest ? 'border-l-accent-green/60 hover:border-l-accent-green' : 'border-l-accent-red/60 hover:border-l-accent-red'}
                "
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-slate-200 truncate max-w-[140px] group-hover:text-accent-blue transition-colors">
                        {report.company.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">
                        {report.company.symbol}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border
                        ${isInvest 
                          ? 'bg-accent-green/10 text-accent-green border-accent-green/20' 
                          : 'bg-accent-red/10 text-accent-red border-accent-red/20'}
                      `}>
                        {report.recommendation}
                      </span>
                    </div>
                  </div>

                  {/* Summary Snippet */}
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {report.summary}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center border-t border-slate-900/60 pt-3 mt-3">
                  <div className="flex items-center text-[10px] font-mono text-slate-500">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDelete(e, report.id)}
                      disabled={isDeleting === report.id}
                      className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-accent-red hover:bg-accent-red/10 hover:border-accent-red/20 transition-all duration-200 cursor-pointer"
                      title="Delete Report"
                    >
                      {isDeleting === report.id ? (
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
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-xl mx-auto">
          <Bookmark className="h-12 w-12 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-300">No saved reports found</h2>
          <p className="text-xs text-slate-500">
            Once you perform an analysis search inside the dashboard console, click the **Save Report** button to archive it in your personal cache.
          </p>
        </div>
      )}
    </div>
  );
};

export default SavedReports;
