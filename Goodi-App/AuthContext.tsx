
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      // Per your request, adding detailed logs
      console.log('[AuthContext] onAuthStateChanged callback triggered. User UID:', user?.uid || null);
      setCurrentUser(user);
      
      // This is the key change: we only consider auth loaded after the first callback.
      if (authLoading) {
        setAuthLoading(false);
        console.log('[AuthContext] Auth state initialized. authLoading is now false.');
      }
    });

    return () => {
      console.log('[AuthContext] Cleaning up onAuthStateChanged listener.');
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    authLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
