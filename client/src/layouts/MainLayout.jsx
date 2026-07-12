import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { user, loading } = useAuth();

  // If session is loading, display spinner centered
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-base text-accent-blue">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // Protect all child dashboard pages
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-base relative">
      {/* Dynamic Glowing background nodes */}
      <div className="glow-orb-blue top-12 left-12" />
      <div className="glow-orb-purple bottom-12 right-12" />

      {/* Main Sidebar (Desktop only) */}
      <Sidebar />

      {/* Page wrapper */}
      <div className="flex flex-col flex-1 md:pl-72 min-h-screen">
        {/* Top Navbar */}
        <Navbar />

        {/* Content workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 animate-fade-in z-10">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
