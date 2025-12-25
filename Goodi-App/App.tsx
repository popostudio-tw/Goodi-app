import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { UserDataProvider, useUserData } from './UserContext';
import { ToastMessage } from './types';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import AppContent from './AppContent'; // Assuming your main app content is refactored into this component
import LegalPage from './components/LegalPage';
import PremiumUpgradePage from './pages/PremiumUpgradePage';
import PremiumUpgradeFlow from './pages/PremiumUpgradeFlow';

// --- Full Screen Spinner --- //
const FullScreenSpinner: React.FC = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-lime-50 text-xl font-semibold text-lime-800">
    <p>Goodi 載入中...</p>
    <p className="text-sm mt-2 text-lime-600">正在為您準備孩子的成長之旅</p>
  </div>
);

// --- Protected Route Logic --- //
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  const { userDataLoading } = useUserData();

  // Per your request, adding detailed logs
  console.log(`[ProtectedRoute] Status: authLoading=${authLoading}, userDataLoading=${userDataLoading}, currentUserPresent=${!!currentUser}`);

  if (authLoading || userDataLoading) {
    return <FullScreenSpinner />;
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] Auth and user data loaded. No user found. Redirecting to /login.');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Auth and user data loaded. User found. Rendering children.');
  return <>{children}</>;
};

// --- Main App Structure --- //
const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth(); // Also used for the login page redirect

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/privacy"
        element={<LegalPage type="privacy" />}
      />
      <Route
        path="/terms"
        element={<LegalPage type="terms" />}
      />
      {/* Premium 升級頁面路由 */}
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <PremiumUpgradePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium/upgrade-flow"
        element={
          <ProtectedRoute>
            <PremiumUpgradeFlow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  // This state now lives here to be passed to UserDataProvider
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const addToast = useCallback((message: string, type: 'success' | 'celebrate' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider> {/* ✅ 1. AuthProvider wraps everything */}
        <UserDataProvider addToast={addToast}> {/* ✅ 2. UserDataProvider is inside AuthProvider */}
          <Toast toast={toast} />
          <AppRoutes /> {/* ✅ 3. Routes use the contexts */}
        </UserDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
