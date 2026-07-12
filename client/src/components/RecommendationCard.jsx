import { CheckCircle2, XCircle, ShieldAlert, Award, FileDown, Heart, Loader2 } from 'lucide-react';

const RecommendationCard = ({ 
  recommendation, 
  confidence, 
  summary, 
  companyName, 
  symbol,
  onExportPDF, 
  onSave, 
  isSaved,
  isFavorite,
  onToggleFavorite,
  isSaving,
  isTogglingFav
}) => {
  const isInvest = recommendation === 'INVEST';
  
  // SVG Ring Calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className={`glass-panel p-6 border-l-4 flex flex-col justify-between relative overflow-hidden
      ${isInvest ? 'border-l-accent-green' : 'border-l-accent-red'}
    `}>
      
      {/* Visual Glowing Background Orbs */}
      <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full filter blur-3xl opacity-30
        ${isInvest ? 'bg-accent-green' : 'bg-accent-red'}
      `} />

      <div>
        {/* Header - Recommendation & Score */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <span className="text-[10px] tracking-widest uppercase font-mono text-slate-500 font-bold block">
              Agent Valuation
            </span>
            <div className="flex items-center space-x-2.5">
              {isInvest ? (
                <>
                  <CheckCircle2 className="h-7 w-7 text-accent-green animate-pulse" />
                  <h2 className="text-3xl font-extrabold tracking-wider text-accent-green uppercase font-sans neon-text-green">
                    INVEST
                  </h2>
                </>
              ) : (
                <>
                  <XCircle className="h-7 w-7 text-accent-red animate-pulse" />
                  <h2 className="text-3xl font-extrabold tracking-wider text-accent-red uppercase font-sans neon-text-red">
                    PASS
                  </h2>
                </>
              )}
            </div>
          </div>

          {/* Radial Confidence Meter */}
          <div className="relative flex items-center justify-center">
            <svg className="w-18 h-18 transform -rotate-90">
              <circle
                cx="36"
                cy="36"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="36"
                cy="36"
                r={radius}
                className={`transition-all duration-1000 ease-out
                  ${isInvest ? 'stroke-accent-green' : 'stroke-accent-red'}
                `}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-slate-100 font-mono leading-none">{confidence}%</span>
              <span className="text-[8px] text-slate-500 font-mono font-bold uppercase mt-0.5">Conviction</span>
            </div>
          </div>
        </div>

        {/* Investment Thesis Summary */}
        <div className="space-y-3 mb-6 bg-slate-900/30 p-4 rounded-xl border border-slate-800/40">
          <div className="flex items-center space-x-2">
            <Award className={`h-4.5 w-4.5 ${isInvest ? 'text-accent-green' : 'text-accent-red'}`} />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">Investment Thesis</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
            {summary}
          </p>
        </div>

        {/* Confidence Meter Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">Agent Confidence Level</span>
            <span className={`font-bold font-mono ${isInvest ? 'text-accent-green' : 'text-accent-red'}`}>
              {confidence >= 80 ? 'HIGH CONVICTION' : confidence >= 60 ? 'MODERATE CONVICTION' : 'LOW CONVICTION'}
            </span>
          </div>
          <div className="w-full bg-slate-800/40 rounded-full h-2 overflow-hidden border border-slate-700/30">
            <div 
              className={`h-full rounded-full transition-all duration-1000
                ${isInvest ? 'bg-accent-green' : 'bg-accent-red'}
              `}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900/60 mt-auto">
        <button
          onClick={onExportPDF}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md"
        >
          <FileDown className="h-4 w-4 text-accent-blue" />
          <span>Export PDF</span>
        </button>

        <div className="flex space-x-1.5">
          <button
            onClick={onToggleFavorite}
            disabled={isTogglingFav}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-md
              ${isFavorite 
                ? 'bg-accent-amber/10 border-accent-amber text-accent-amber' 
                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'}
            `}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            {isTogglingFav ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-accent-amber' : ''}`} />
            )}
          </button>

          <button
            onClick={onSave}
            disabled={isSaved || isSaving}
            className={`flex-[2] flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer shadow-md
              ${isSaved 
                ? 'bg-accent-green/10 border border-accent-green text-accent-green cursor-default' 
                : 'bg-accent-blue hover:bg-blue-600 text-white border border-transparent'}
            `}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <span>Saved</span>
            ) : (
              <span>Save Report</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
