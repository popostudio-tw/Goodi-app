
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] setting up onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        '[AuthProvider] onAuthStateChanged:',
        'projectId =', auth.app.options.projectId,
        'uid =', user?.uid || null
      );
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => {
      console.log('[AuthProvider] cleanup onAuthStateChanged');
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
