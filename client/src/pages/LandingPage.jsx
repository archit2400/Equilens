import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { TrendingUp, Sparkles } from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import SoftAurora from '../components/SoftAurora.jsx';

const sparklinePaths = {
  'NVDA': 'M0,15 Q15,10 30,14 T60,5',
  'AAPL': 'M0,5 Q15,18 30,10 T60,18',
  'TSLA': 'M0,18 Q15,5 30,12 T60,2',
  'MSFT': 'M0,8 Q15,14 30,12 T60,18'
};

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [trendingStocks, setTrendingStocks] = useState([
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$202.77', change: '+3.40%', isPositive: true, path: 'M0,15 Q15,10 30,14 T60,5' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: '$312.23', change: '-1.20%', isPositive: false, path: 'M0,5 Q15,18 30,10 T60,18' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: '$406.55', change: '+5.12%', isPositive: true, path: 'M0,18 Q15,5 30,12 T60,2' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: '$384.36', change: '-0.65%', isPositive: false, path: 'M0,8 Q15,14 30,12 T60,18' }
  ]);



  // Fetch live quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await api.get('/public/quotes');
        const formatted = res.data.map(stock => ({
          ...stock,
          path: sparklinePaths[stock.symbol] || 'M0,10 H60'
        }));
        setTrendingStocks(formatted);
      } catch (err) {
        console.warn('Failed to fetch public quotes:', err);
      }
    };
    fetchQuotes();
  }, []);

  const handleSearch = (query) => {
    if (user) {
      navigate(`/dashboard?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/login?redirect=dashboard&search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="scroll-stage-container min-h-screen">
      
      {/* Background Aurora Glow */}
      <div className="aurora-glow">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={1.0}
          color1="#f7f7f7"
          color2="#e100ff"
          noiseFrequency={2.5}
          noiseAmplitude={1.0}
          bandHeight={0.5}
          bandSpread={1.0}
          octaveDecay={0.1}
          layerOffset={0}
          colorSpeed={1.0}
          enableMouseInteraction={true}
          mouseInfluence={0.25}
        />
      </div>

      {/* Site Navigation */}
      <nav className="site-nav">
        <div className="nav-logo text-white select-none">
          EQUILENS<span className="text-purple-500 font-bold">.</span>
        </div>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded transition-all duration-200 cursor-pointer shadow-md hover:shadow-purple-500/10"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold font-mono tracking-widest uppercase text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded transition-all duration-200 cursor-pointer shadow-md hover:shadow-purple-500/10"
              >
                Run Agent
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section – centered single column */}
      <div className="hero-center-section">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full mb-6 select-none">
            <span className="bg-purple-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
              NEW RELEASE
            </span>
            <span className="text-[10px] font-bold text-purple-400 font-mono">
              Multi-Agent Consensus 2.0 →
            </span>
          </div>

          <h1>Autonomous AI<br />for research-backed investing.</h1>
          <p className="subtitle">
            Four parallel research nodes—Overview, Sentiment, Financials, and Competitive Moats—converge automatically to synthesize clear stock calls.
          </p>

          {/* Search Input */}
          <div className="hero-search-wrap">
            <SearchBar onSearch={handleSearch} isLoading={false} />
          </div>

          {/* Trending Markets Grid */}
          <div className="hero-trending">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <TrendingUp className="text-purple-500 h-4 w-4" />
              <h3 className="text-[10px] uppercase font-bold font-mono tracking-widest text-slate-400">
                Trending Markets
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {trendingStocks.map((stock) => (
                <div 
                  key={stock.symbol}
                  onClick={() => handleSearch(stock.symbol)}
                  className="glass-panel p-4 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between text-left group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                        {stock.symbol}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold truncate mt-2 group-hover:text-slate-200 transition-colors">
                        {stock.name}
                      </p>
                    </div>
                    <svg className={`w-14 h-6 ${stock.isPositive ? 'text-accent-green' : 'text-accent-red'} shrink-0`} viewBox="0 0 60 20" fill="none">
                      <path d={stock.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-sm font-bold text-slate-200">{stock.price}</span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${stock.isPositive ? 'text-accent-green bg-accent-green/10 border border-accent-green/20' : 'text-accent-red bg-accent-red/10 border border-accent-red/20'}`}>
                      {stock.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

      </div>

      {/* Fold Content */}
      <div className="landing-content">
        <section className="landing-section text-left">
          <div className="section-label">Parallel Research</div>
          <h2 className="text-white">One query, four independent lenses, run at once.</h2>
          <p className="lede">
            Each node pulls live data through Tavily and reasons over it independently, so no single signal dominates the read before synthesis.
          </p>

          <div className="node-grid">
            <div className="node">
              <div className="node-index">01</div>
              <h3 className="text-slate-200 font-sans">Company Overview</h3>
              <p>Business model, segments, recent filings, and management commentary distilled to what actually moves the thesis.</p>
            </div>
            <div className="node">
              <div className="node-index">02</div>
              <h3 className="text-slate-200 font-sans">News &amp; Sentiment</h3>
              <p>Live web search across recent coverage, ranked by relevance and weighted for tone, not just volume.</p>
            </div>
            <div className="node">
              <div className="node-index">03</div>
              <h3 className="text-slate-200 font-sans">Financials</h3>
              <p>Margins, growth, leverage, and cash generation trends pulled against historical baselines.</p>
            </div>
            <div className="node">
              <div className="node-index">04</div>
              <h3 className="text-slate-200 font-sans">Competitive Landscape</h3>
              <p>Where the company sits versus peers on pricing power, share trend, and moat durability.</p>
            </div>
          </div>

          <div className="flow-row">
            <div className="flow-pill">4 parallel nodes</div>
            <div className="flow-arrow">→</div>
            <div className="flow-pill">Synthesis node</div>
            <div className="flow-arrow">→</div>
            <div className="flow-pill strong">Structured decision</div>
          </div>
        </section>

        <footer className="landing-footer text-xs">
          <span>EQUILENS — built on LangGraph.js</span>
          <span>Not investment advice &copy; {new Date().getFullYear()} EquiLens</span>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
