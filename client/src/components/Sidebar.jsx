import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Bookmark, 
  Star, 
  LogOut, 
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Saved Reports', path: '/saved-reports', icon: Bookmark },
    { name: 'Favorites', path: '/favorites', icon: Star },
    { name: 'Search History', path: '/history', icon: History },
  ];

  return (
    <aside className="fixed bottom-4 left-4 top-4 z-40 hidden w-64 flex-col justify-between p-4 md:flex">
      <div className="glass-panel flex h-full flex-col justify-between px-4 py-6">
        <div>
          {/* Logo Brand Header */}
          <div className="mb-8 flex items-center space-x-2 px-2">
            <Cpu className="text-accent-blue animate-pulse h-8 w-8" />
            <div>
              <span className="font-sans text-lg font-bold tracking-wider text-slate-100 uppercase block leading-none">
                EquiLens
              </span>
              <span className="text-[10px] text-accent-blue tracking-widest font-mono uppercase">
                Invest AI
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-accent-blue/15 text-accent-blue border-l-2 border-accent-blue font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}
                `}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="mb-4 flex items-center space-x-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/20 text-accent-blue font-bold text-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'UI'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 leading-tight truncate">{user?.name || 'Investor'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'guest@invest.ai'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
