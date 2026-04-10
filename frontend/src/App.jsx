import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardOverviewPage from './pages/DashboardOverviewPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        <Route path="/analytics/:id" element={<Navigate to="/dashboard/links" replace />} />
        <Route path="*" element={<p className="text-slate-500">Page not found.</p>} />
      </Routes>
    </Layout>
  );
}
