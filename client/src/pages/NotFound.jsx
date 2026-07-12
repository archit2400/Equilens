import { Link } from 'react-router-dom';
import { Cpu, AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-bg-base relative text-slate-100 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background glow node */}
      <div className="glow-orb-blue top-1/3 left-1/3 scale-75" />
      <div className="glow-orb-purple bottom-1/3 right-1/3 scale-75" />

      <div className="glass-panel w-full max-w-md p-8 relative z-10 bg-slate-950/70 border-slate-800/80 shadow-2xl text-center space-y-6">
        
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-accent-red/10 border border-accent-red/20 text-accent-red">
            <AlertCircle className="h-12 w-12 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black font-sans tracking-tight text-white">404 - Area Locked</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            The page terminal address you entered does not exist or has been archived by the AI system controller.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-accent-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 shadow-md hover:shadow-blue-500/10 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
