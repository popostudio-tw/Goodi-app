import React, { createContext, useState, useContext, useCallback } from 'react';

interface UIContextType {
  isPointsAnimating: boolean;
  triggerPointsAnimation: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPointsAnimating, setIsPointsAnimating] = useState(false);

  const triggerPointsAnimation = useCallback(() => {
    setIsPointsAnimating(true);
    setTimeout(() => setIsPointsAnimating(false), 600);
  }, []);

  const value = {
    isPointsAnimating,
    triggerPointsAnimation,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
