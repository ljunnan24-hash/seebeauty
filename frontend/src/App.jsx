import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SafeComponent from './components/SafeComponent';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RatingPage from './pages/RatingPage';
import ReportPage from './pages/ReportPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  // 等待初始化完成
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <SafeComponent>
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<SafeComponent><HomePage /></SafeComponent>} />
          <Route path="login" element={<SafeComponent><LoginPage /></SafeComponent>} />
          <Route path="register" element={<SafeComponent><RegisterPage /></SafeComponent>} />
          <Route path="privacy" element={<SafeComponent><PrivacyPolicyPage /></SafeComponent>} />
          <Route path="terms" element={<SafeComponent><TermsOfUsePage /></SafeComponent>} />
          <Route path="checkout/success" element={<SafeComponent><CheckoutSuccessPage /></SafeComponent>} />
          <Route path="checkout/cancel" element={<SafeComponent><CheckoutCancelPage /></SafeComponent>} />
          <Route
            path="dashboard"
            element={
              <PrivateRoute>
                <SafeComponent><DashboardPage /></SafeComponent>
              </PrivateRoute>
            }
          />
          <Route
            path="rate"
            element={
              <PrivateRoute>
                <SafeComponent><RatingPage /></SafeComponent>
              </PrivateRoute>
            }
          />
          <Route
            path="report/:id"
            element={
              <PrivateRoute>
                <SafeComponent><ReportPage /></SafeComponent>
              </PrivateRoute>
            }
          />
          <Route
            path="profile"
            element={
              <PrivateRoute>
                <SafeComponent><ProfilePage /></SafeComponent>
              </PrivateRoute>
            }
          />
          </Route>
        </Routes>
      </SafeComponent>
    </ErrorBoundary>
  );
}

export default App;