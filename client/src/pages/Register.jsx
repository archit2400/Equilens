import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { SignUp } from '@clerk/react';
import { useAuth } from '../context/AuthContext.jsx';
import { Cpu } from 'lucide-react';

const Register = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !loading) {
      const redirectTo = searchParams.get('redirect') || 'dashboard';
      const searchQuery = searchParams.get('search');
      if (searchQuery) {
        navigate(`/${redirectTo}?search=${encodeURIComponent(searchQuery)}`, { replace: true });
      } else {
        navigate(`/${redirectTo}`, { replace: true });
      }
    }
  }, [user, loading, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-bg-base relative text-slate-100 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background glow nodes */}
      <div className="glow-orb-blue top-1/4 left-1/4 scale-75" />
      <div className="glow-orb-purple bottom-1/4 right-1/4 scale-75" />

      <div className="flex flex-col items-center space-y-6 relative z-10 w-full max-w-md">
        {/* Logo and Header */}
        <Link to="/" className="flex items-center space-x-2">
          <Cpu className="text-accent-blue h-9 w-9 animate-pulse" />
          <span className="font-sans text-xl font-bold tracking-wider text-slate-100 uppercase">
            EquiLens
          </span>
        </Link>

        {/* Clerk Sign Up component */}
        <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80">
          <SignUp 
            signInUrl="/login" 
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
