import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import SearchBar from '../components/SearchBar.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import MetricCard from '../components/MetricCard.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import SWOTCard from '../components/SWOTCard.jsx';
import RiskCard from '../components/RiskCard.jsx';
import NewsCard from '../components/NewsCard.jsx';
import FinancialCharts from '../components/FinancialCharts.jsx';
import { 
  Building2, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Scale, 
  Globe, 
  Heart,
  Calendar,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  
  // Guard to prevent React StrictMode double triggers in development
  const fetchedQueryRef = useRef('');
  const loadedReportIdRef = useRef('');

  // States for Favorites and Saving
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const searchQuery = searchParams.get('search');
  const reportId = searchParams.get('reportId');

  useEffect(() => {
    if (reportId) {
      const trimmedId = reportId.trim();
      if (trimmedId === loadedReportIdRef.current) {
        return;
      }
      loadedReportIdRef.current = trimmedId;
      fetchedQueryRef.current = ''; // Reset query ref when loading saved report
      loadSavedReport(trimmedId);
    } else if (searchQuery) {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery === fetchedQueryRef.current) {
        return;
      }
      fetchedQueryRef.current = trimmedQuery;
      loadedReportIdRef.current = ''; // Reset report ID ref when running new analysis
      triggerAnalysis(trimmedQuery);
    } else {
      // Clear refs if there is no query or reportId in the URL
      fetchedQueryRef.current = '';
      loadedReportIdRef.current = '';
    }
  }, [searchQuery, reportId]);

  const loadSavedReport = async (id) => {
    setIsLoading(true);
    setError('');
    setIsQuotaError(false);
    setReport(null);
    setIsSaved(true);
    setIsFavorite(false);

    try {
      const res = await api.get(`/report/${id}`);
      setReport(res.data);
      checkFavoriteStatus(res.data.companyId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load saved report from database.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAnalysis = async (query) => {
    setIsLoading(true);
    setError('');
    setIsQuotaError(false);
    setReport(null);
    setIsSaved(false);
    setIsFavorite(false);

    try {
      const res = await api.post('/analyze', { query });
      setReport(res.data);
      setIsSaved(true); // Automatically saved to PostgreSQL during analyze endpoint
      
      // Check if this company is in user's favorites
      checkFavoriteStatus(res.data.companyId);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error === 'AI_QUOTA_EXCEEDED') {
        setIsQuotaError(true);
      } else {
        setError(err.response?.data?.message || 'An error occurred during agent analysis. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavoriteStatus = async (companyId) => {
    try {
      const res = await api.get('/favorites');
      const isFav = res.data.some(f => f.companyId === companyId);
      setIsFavorite(isFav);
    } catch (err) {
      console.warn('Could not verify favorite status:', err);
    }
  };

  const handleSearch = (query) => {
    fetchedQueryRef.current = '';
    loadedReportIdRef.current = '';
    setSearchParams({ search: query });
  };

  const handleToggleFavorite = async () => {
    if (!report) return;
    setIsTogglingFav(true);
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${report.companyId}`);
        setIsFavorite(false);
      } else {
        await api.post('/favorites', { companyId: report.companyId });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Helper to format large currencies
  const formatCompact = (val, companySymbol) => {
    const symbolToUse = (companySymbol && (companySymbol.toUpperCase().endsWith('.NS') || companySymbol.toUpperCase().endsWith('.BO'))) ? '₹' : '$';
    if (val === null || val === undefined) return 'N/A';
    if (val >= 1e12) return `${symbolToUse}${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `${symbolToUse}${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${symbolToUse}${(val / 1e6).toFixed(2)}M`;
    return `${symbolToUse}${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header (No print) */}
      <div className="no-print space-y-4">
        <h1 className="text-xl font-extrabold tracking-wider uppercase text-slate-100 font-mono">
          Research Console
        </h1>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Error Callout */}
      {error && (
        <div className="no-print glass-panel p-5 border-l-4 border-l-accent-red bg-slate-950/60 flex items-start space-x-3 max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-mono tracking-wider text-accent-red uppercase">Analysis Failure</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Quota Exceeded Card */}
      {isQuotaError && !isLoading && (
        <div className="no-print glass-panel p-6 border-l-4 border-l-accent-amber bg-slate-950/60 max-w-xl mx-auto text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-accent-amber mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-mono tracking-wider text-accent-amber uppercase">
              ⚠️ AI Analysis Temporarily Unavailable
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              The AI service has reached its daily request limit. Please try again later.
            </p>
          </div>
          <button
            onClick={() => triggerAnalysis(searchQuery)}
            className="no-print font-mono font-bold tracking-wider text-[11px] uppercase px-5 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-accent-amber hover:bg-accent-amber/20 transition-all duration-300 active:scale-95"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Timeline & Skeleton */}
      {isLoading && <LoadingSkeleton />}

      {/* Loaded Dashboard Layout */}
      {report && !isLoading && (
        <div className="space-y-6 max-w-7xl mx-auto">
          
          {/* Company Brief Header Card */}
          <div className="glass-panel p-6 border-slate-800/80 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-accent-blue" />
                <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">{report.company.name}</h2>
                <span className="text-xs font-mono font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-0.5 rounded-md border border-accent-blue/20">
                  {report.company.symbol}
                </span>
              </div>
              <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-slate-700 mr-1.5" />Sector: {report.company.sector}</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-slate-700 mr-1.5" />Industry: {report.company.industry}</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-slate-700 mr-1.5" />CEO: {report.company.ceo}</span>
              </div>
            </div>
            {report.company.website && (
              <a 
                href={report.company.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="no-print flex items-center space-x-1.5 text-xs text-accent-blue font-bold hover:underline"
              >
                <Globe className="h-4 w-4" />
                <span>Visit Corporate Site</span>
              </a>
            )}
          </div>

          {/* Core Financial Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              label="Market Capitalization" 
              value={formatCompact(report.company.marketCap, report.company.symbol)} 
              subtext="Equity valuation"
              icon={DollarSign}
            />
            <MetricCard 
              label="Price to Earnings (P/E)" 
              value={report.company.peRatio ? report.company.peRatio.toFixed(2) : 'N/A'} 
              subtext="Valuation multiple"
              icon={TrendingUp}
              type={report.company.peRatio > 40 ? 'warning' : 'default'}
            />
            <MetricCard 
              label="Debt to Equity" 
              value={report.company.debtToEquity ? `${report.company.debtToEquity.toFixed(2)}%` : 'N/A'} 
              subtext="Leverage ratio"
              icon={Scale}
              type={report.company.debtToEquity > 150 ? 'danger' : 'default'}
            />
            <MetricCard 
              label="Operating Margin" 
              value={report.company.profitMargin ? `${(report.company.profitMargin * 100).toFixed(2)}%` : 'N/A'} 
              subtext="Profit profitability"
              icon={Percent}
              type={report.company.profitMargin > 0.15 ? 'success' : 'default'}
            />
          </div>

          {/* Main Dashboard Layout Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2/3 Content Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Financial Performance Charts */}
              <FinancialCharts chartsData={report.charts} symbol={report.company.symbol} />

              {/* SWOT Matrix Card */}
              <SWOTCard 
                strengths={report.strengths} 
                weaknesses={report.weaknesses} 
                opportunities={report.opportunities} 
                threats={report.threats} 
              />

              {/* Business Description */}
              {report.company.description && (
                <div className="glass-panel p-6 border-slate-800/80">
                  <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-200 mb-4 flex items-center space-x-2">
                    <Building2 className="h-4.5 w-4.5 text-accent-blue" />
                    <span>Business Profile Summary</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                    {report.company.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right 1/3 Analytical Verdict Column */}
            <div className="space-y-6">
              {/* Recommendation Card */}
              <RecommendationCard 
                recommendation={report.recommendation}
                confidence={report.confidence}
                summary={report.summary}
                companyName={report.company.name}
                symbol={report.company.symbol}
                isSaved={isSaved}
                isSaving={isSaving}
                isFavorite={isFavorite}
                isTogglingFav={isTogglingFav}
                onToggleFavorite={handleToggleFavorite}
                onExportPDF={handleExportPDF}
              />

              {/* Business Risks */}
              <RiskCard risks={report.risks} />

              {/* News Feed Sentiment */}
              <NewsCard news={report.news} />
            </div>

          </div>

          {/* Free Tier Disclaimer Alert (No print) */}
          <div className="no-print glass-panel p-5 border-l-4 border-l-accent-amber bg-slate-950/40 flex items-start space-x-3 text-xs max-w-7xl mx-auto">
            <AlertCircle className="h-5 w-5 text-accent-amber shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold font-mono tracking-wider text-accent-amber uppercase text-xs">Free Tier Quota Disclaimer</h4>
              <p className="text-slate-400 leading-relaxed font-medium">
                Please note: The analysis and metrics provided above may contain data gaps or empty values. 
                Because we are running on developer free-tier API quotas, global stocks (non-US) are subject to statement paywalls, 
                and FMP/Tavily/Gemini keys can occasionally hit rate-limiting and query restrictions, leading to lookup errors or partial data loads.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Initial state (no search) */}
      {!report && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-xl mx-auto">
          <Building2 className="h-16 w-16 text-slate-700 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-200 tracking-wide">Awaiting Command input</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter a ticker or company name above. The AI Agent will scraping Yahoo Finance metrics, process historical balance sheets, calculate news sentiment levels, and generate structured final recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
