import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

const FinancialCharts = ({ chartsData = [], symbol = '' }) => {
  
  const getCurrencySymbol = (sym) => {
    if (!sym) return '$';
    const upperSym = sym.toUpperCase();
    if (upperSym.endsWith('.NS') || upperSym.endsWith('.BO')) return '₹';
    return '$';
  };

  const currencySymbol = getCurrencySymbol(symbol);

  // Format numbers for clean readability on Y-axis (e.g. ₹10.5B or $100M)
  const formatCurrency = (value) => {
    if (value === 0 || value === null || value === undefined) return `${currencySymbol}0`;
    
    const absValue = Math.abs(value);
    
    if (absValue >= 1e12) {
      return `${currencySymbol}${(value / 1e12).toFixed(1)}T`;
    } else if (absValue >= 1e9) {
      return `${currencySymbol}${(value / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6) {
      return `${currencySymbol}${(value / 1e6).toFixed(1)}M`;
    }
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  // Custom tooltips to match glass theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase">Fiscal Year {label}</p>
          <div className="space-y-1">
            {payload.map((item) => (
              <div key={item.name} className="flex items-center justify-between space-x-6 text-xs">
                <span className="flex items-center text-slate-400">
                  <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}:
                </span>
                <span className="font-mono font-bold text-slate-100">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 border-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <div className="flex items-center space-x-2">
          <BarChart2 className="h-5 w-5 text-accent-blue" />
          <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-200">
            Historical Financial Performance
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-[10px] font-mono text-slate-500">
          <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-accent-blue mr-1.5" />Revenue</span>
          <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-accent-green mr-1.5" />Earnings</span>
        </div>
      </div>

      <div className="h-72 w-full">
        {chartsData && chartsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartsData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="earningsGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="year" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatCurrency}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar 
                name="Revenue" 
                dataKey="revenue" 
                fill="url(#revenueGlow)" 
                stroke="#3b82f6"
                strokeWidth={1}
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
              <Bar 
                name="Net Income" 
                dataKey="earnings" 
                fill="url(#earningsGlow)" 
                stroke="#10b981"
                strokeWidth={1}
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500 italic text-xs">
            Financial chart data not available.
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialCharts;
