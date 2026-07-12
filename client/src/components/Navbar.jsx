import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Cpu, LogOut } from 'lucide-react';
import { UserButton } from '@clerk/react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Saved Reports', path: '/saved-reports' },
    { name: 'Favorites', path: '/favorites' },
    { name: 'Search History', path: '/history' },
  ];

  return (
    <nav className="glass-panel sticky top-4 z-50 mx-4 mt-4 flex items-center justify-between px-6 py-4 md:px-8">
      {/* Mobile Title Logo */}
      <div className="flex items-center space-x-2">
        <Cpu className="text-accent-blue h-6 w-6 animate-pulse" />
        <span className="font-sans text-base font-bold tracking-wider text-slate-100 uppercase">
          EquiLens
        </span>
      </div>

      {/* Actions (Desktop) */}
      <div className="hidden items-center space-x-4 md:flex">
        <span className="text-xs text-slate-400">
          Status: <span className="text-accent-green font-mono">Agent Online</span>
        </span>
        <div className="h-4 w-px bg-slate-800" />
        <UserButton />
      </div>

      {/* Hamburger Menu (Mobile) */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-slate-200 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="flex flex-col space-y-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  text-sm font-medium transition-colors py-2 px-3 rounded-lg
                  ${isActive ? 'bg-accent-blue/10 text-accent-blue' : 'text-slate-400 hover:text-slate-200'}
                `}
              >
                {item.name}
              </NavLink>
            ))}
            <div className="h-px bg-slate-800 my-2" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-slate-300 font-medium">{user?.name || 'Investor'}</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center space-x-1 text-xs text-accent-red font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
