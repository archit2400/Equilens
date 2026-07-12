import { ShieldAlert, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

const SWOTCard = ({ strengths = [], weaknesses = [], opportunities = [], threats = [] }) => {
  const quadrants = [
    {
      title: 'Strengths',
      items: strengths,
      colorClass: 'text-accent-green bg-accent-green/5 border-t-accent-green/50',
      bulletClass: 'bg-accent-green/20 text-accent-green',
      icon: Sparkles
    },
    {
      title: 'Weaknesses',
      items: weaknesses,
      colorClass: 'text-accent-red bg-accent-red/5 border-t-accent-red/50',
      bulletClass: 'bg-accent-red/20 text-accent-red',
      icon: AlertTriangle
    },
    {
      title: 'Opportunities',
      items: opportunities,
      colorClass: 'text-accent-blue bg-accent-blue/5 border-t-accent-blue/50',
      bulletClass: 'bg-accent-blue/20 text-accent-blue',
      icon: TrendingUp
    },
    {
      title: 'Threats',
      items: threats,
      colorClass: 'text-accent-amber bg-accent-amber/5 border-t-accent-amber/50',
      bulletClass: 'bg-accent-amber/20 text-accent-amber',
      icon: ShieldAlert
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-accent-blue" />
        <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-200">SWOT Audit Matrix</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => (
          <div 
            key={q.title} 
            className={`glass-card p-5 border-t-2 ${q.colorClass} flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <q.icon className="h-4.5 w-4.5" />
                <h4 className="text-xs font-bold font-mono tracking-widest uppercase">{q.title}</h4>
              </div>
              <ul className="space-y-2.5">
                {q.items && q.items.length > 0 ? (
                  q.items.map((item, index) => (
                    <li key={index} className="flex items-start text-xs text-slate-300 leading-relaxed font-sans font-medium">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-mono font-bold mr-2 mt-0.5 ${q.bulletClass}`}>
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500 italic">No details compiled by agent.</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SWOTCard;
