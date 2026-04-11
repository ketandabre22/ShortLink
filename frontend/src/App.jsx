import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SocialAuthCallbackPage from './pages/SocialAuthCallbackPage.jsx';
import DashboardOverviewPage from './pages/DashboardOverviewPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

function LegacyAnalyticsRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/analytics/${id}`} replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<SocialAuthCallbackPage />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardOverviewPage />} />
          <Route path="links" element={<DashboardPage />} />
          <Route path="analytics/:id" element={<AnalyticsPage />} />
        </Route>

        <Route path="/analytics/:id" element={<LegacyAnalyticsRedirect />} />
        <Route path="*" element={<p className="text-slate-500">Page not found.</p>} />
      </Routes>
    </Layout>
  );
}
