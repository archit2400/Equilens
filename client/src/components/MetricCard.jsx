import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ label, value, subtext, icon: Icon, type = 'default' }) => {
  const isPositive = subtext && (subtext.startsWith('+') || parseFloat(subtext) > 0);
  const isNegative = subtext && (subtext.startsWith('-') || parseFloat(subtext) < 0);

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'hover:border-accent-green/30';
      case 'warning': return 'hover:border-accent-amber/30';
      case 'danger': return 'hover:border-accent-red/30';
      default: return 'hover:border-accent-blue/30';
    }
  };

  return (
    <div className={`glass-card p-5 flex items-center justify-between border-l-4 border-l-slate-800 ${getBorderColor()}`}>
      <div className="space-y-1 bg-transparent">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <h4 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
          {value || 'N/A'}
        </h4>
        
        {subtext && (
          <div className="flex items-center space-x-1">
            {isPositive && <ArrowUpRight className="h-3 w-3 text-accent-green" />}
            {isNegative && <ArrowDownRight className="h-3 w-3 text-accent-red" />}
            <span className={`text-[10px] font-medium tracking-wide
              ${isPositive ? 'text-accent-green' : ''}
              ${isNegative ? 'text-accent-red' : ''}
              ${!isPositive && !isNegative ? 'text-slate-400' : ''}
            `}>
              {subtext}
            </span>
          </div>
        )}
      </div>

      <div className={`p-3 rounded-xl bg-slate-900/60 text-slate-400
        ${type === 'default' ? 'text-accent-blue bg-accent-blue/5' : ''}
        ${type === 'success' ? 'text-accent-green bg-accent-green/5' : ''}
        ${type === 'warning' ? 'text-accent-amber bg-accent-amber/5' : ''}
        ${type === 'danger' ? 'text-accent-red bg-accent-red/5' : ''}
      `}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
    </div>
  );
};

export default MetricCard;
