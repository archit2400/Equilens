import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SavedReports from './pages/SavedReports.jsx';
import Favorites from './pages/Favorites.jsx';
import SearchHistory from './pages/SearchHistory.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Marketing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Console Workspace Routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/saved-reports" element={<SavedReports />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/history" element={<SearchHistory />} />
          </Route>

          {/* 404 Fallback Route */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
