import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSkeleton = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const timelineSteps = [
    'Initializing LangChain workflow...',
    'Resolving stock symbol and exchange...',
    'Fetching company profile from Financial Modeling Prep...',
    'Retrieving available financial statements...',
    'Searching real-time financial news via Tavily...',
    'Formulating prompt and compiling valuation indices...',
    'Running AI investment analysis...',
    'Applying structured JSON parser validation...',
    'Caching analysis report to PostgreSQL database...',
    'Rendering premium analytics dashboard...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < timelineSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in p-4 md:p-8">
      
      {/* Dynamic Agent Timeline Card */}
      <div className="glass-panel p-6 border-accent-blue/20 bg-slate-950/80 shadow-xl shadow-blue-900/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-slate-800/80 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-accent-blue/10 p-2.5 rounded-xl border border-accent-blue/30 text-accent-blue">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wider uppercase">AI Investment Agent Thinking</h3>
              <p className="text-xs text-slate-400">Processing real-time stock filings, earnings templates, and news sentiment...</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono bg-accent-blue/10 border border-accent-blue/30 px-3 py-1.5 rounded-md font-bold text-accent-blue uppercase tracking-widest animate-pulse">
              Agent State: Executing Pipeline
            </span>
          </div>
        </div>

        {/* AI Timeline Steps */}
        <div className="relative pl-6 space-y-4 border-l border-slate-800/80 ml-3">
          {timelineSteps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            const isFuture = idx > currentStep;

            return (
              <div key={step} className="relative flex items-center">
                {/* Visual Bullet Icon Indicator */}
                <span className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-300
                  ${isCompleted ? 'bg-accent-green/20 border-accent-green text-[9px] text-accent-green font-bold' : ''}
                  ${isActive ? 'bg-accent-blue border-accent-blue animate-ping scale-75' : ''}
                  ${isFuture ? 'bg-slate-900 border-slate-800' : ''}
                `}>
                  {isCompleted && '✓'}
                </span>
                
                {/* Secondary static ring for the active item to sit inside the ping animation */}
                {isActive && (
                  <span className="absolute -left-[31px] h-4 w-4 rounded-full border border-accent-blue bg-accent-blue/20" />
                )}

                <span className={`text-xs transition-colors duration-300 font-mono pl-3
                  ${isCompleted ? 'text-slate-400 line-through' : ''}
                  ${isActive ? 'text-accent-blue font-semibold scale-102 origin-left' : ''}
                  ${isFuture ? 'text-slate-600' : ''}
                `}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Dashboard Skeleton Mockup */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column skeletons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card (Overview) */}
          <div className="glass-card p-6 h-48 flex flex-col justify-between skeleton-shimmer">
            <div className="space-y-3">
              <div className="h-6 w-1/3 bg-slate-800 rounded-md" />
              <div className="h-4 w-1/4 bg-slate-800/60 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800/50 rounded-md" />
              <div className="h-4 w-5/6 bg-slate-800/50 rounded-md" />
            </div>
          </div>

          {/* Chart Card Skeleton */}
          <div className="glass-card p-6 h-80 flex flex-col justify-between skeleton-shimmer">
            <div className="h-6 w-1/4 bg-slate-800 rounded-md" />
            <div className="flex items-end justify-between h-48 px-4">
              <div className="h-28 w-[10%] bg-slate-800/40 rounded-t-md" />
              <div className="h-36 w-[10%] bg-slate-800/40 rounded-t-md" />
              <div className="h-24 w-[10%] bg-slate-800/40 rounded-t-md" />
              <div className="h-40 w-[10%] bg-slate-800/40 rounded-t-md" />
              <div className="h-32 w-[10%] bg-slate-800/40 rounded-t-md" />
              <div className="h-44 w-[10%] bg-slate-800/40 rounded-t-md" />
            </div>
          </div>
        </div>

        {/* Right column skeleton (Recommendation Card) */}
        <div className="space-y-6">
          <div className="glass-card p-6 h-[464px] flex flex-col justify-between skeleton-shimmer border-accent-blue/10">
            <div className="flex flex-col items-center space-y-4 mt-6">
              <div className="h-24 w-24 rounded-full bg-slate-800/60 flex items-center justify-center" />
              <div className="h-6 w-1/2 bg-slate-800 rounded-md" />
              <div className="h-4 w-1/3 bg-slate-800/60 rounded-md" />
            </div>
            
            <div className="space-y-3 px-2">
              <div className="h-4 w-full bg-slate-800/50 rounded-md" />
              <div className="h-4 w-full bg-slate-800/50 rounded-md" />
              <div className="h-4 w-2/3 bg-slate-800/50 rounded-md" />
            </div>

            <div className="h-10 w-full bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
