import { ShieldAlert, Info } from 'lucide-react';

const RiskCard = ({ risks = [] }) => {
  // Determine risk level based on count & presence of severe words
  const riskCount = risks.length;
  
  let riskScore = Math.min(riskCount * 18, 100); // Dynamic score up to 100
  let riskLevel = 'Moderate';
  let colorClass = 'text-accent-amber';
  let barColor = 'bg-accent-amber';

  if (riskScore >= 75) {
    riskLevel = 'Critical';
    colorClass = 'text-accent-red';
    barColor = 'bg-accent-red';
  } else if (riskScore >= 50) {
    riskLevel = 'High';
    colorClass = 'text-orange-500';
    barColor = 'bg-orange-500';
  } else if (riskScore < 30) {
    riskLevel = 'Low';
    colorClass = 'text-accent-green';
    barColor = 'bg-accent-green';
  }

  return (
    <div className="glass-panel p-6 border-l-4 border-l-accent-amber flex flex-col justify-between">
      <div>
        {/* Header and Risk Meter */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-900/60">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-accent-amber" />
            <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-200">Business Risks</h3>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Risk Meter:</span>
            <span className={`text-[10px] font-extrabold font-mono uppercase ${colorClass}`}>
              {riskLevel}
            </span>
          </div>
        </div>

        {/* Risk progress indicator */}
        <div className="mb-6 space-y-1.5">
          <div className="w-full bg-slate-800/40 rounded-full h-1.5 overflow-hidden border border-slate-700/30">
            <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${riskScore}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Low Risk</span>
            <span>Moderate</span>
            <span>High Risk</span>
            <span>Critical</span>
          </div>
        </div>

        {/* Risks List */}
        <ul className="space-y-4">
          {risks && risks.length > 0 ? (
            risks.map((risk, index) => (
              <li key={index} className="flex items-start bg-slate-900/10 p-3 rounded-xl border border-slate-800/30 hover:border-slate-800 transition-all duration-200">
                <Info className="h-4.5 w-4.5 text-accent-amber shrink-0 mr-3 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">Risk Factor {index + 1}</p>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">{risk}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500 italic p-3 text-center">No major risk factors detected.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RiskCard;
