import { createContext, useState, useEffect, useContext } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState(null);

  // Synchronize Clerk user state into our custom context's user state
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        setUser({
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName || 'Investor'
        });
      } else {
        setUser(null);
      }
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  // Dynamically register Axios request interceptor to append current Clerk JWT token
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.error('Error fetching Clerk token for interceptor:', err);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  const login = async () => {
    // Under Clerk, login is handled via redirection or Clerk pre-built widgets.
    // This is kept for interface backward compatibility.
  };

  const register = async () => {
    // Under Clerk, signup is handled via redirection or Clerk pre-built widgets.
    // This is kept for interface backward compatibility.
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const loading = !isLoaded;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
