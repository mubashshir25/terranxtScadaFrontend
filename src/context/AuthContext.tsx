import React, { createContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, getUser, getToken, setUser as setStoredUser, User } from "../services/auth";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      const storedUser = getUser();
      
      if (token && storedUser) {
        setUserState(storedUser);
        // Verify token is still valid by fetching current user
        try {
          const currentUser = await getCurrentUser();
          setUserState(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          setUserState(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      setStoredUser(newUser);
    }
  };

  const isAuthenticated = !!user && !!getToken();

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
