import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ScrollToTop from './components/layout/ScrollToTop';
import { FullPageLoader } from './components/ui/Spinner';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Track = lazy(() => import('./pages/Track'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MySubmission = lazy(() => import('./pages/MySubmission'));
const Submit = lazy(() => import('./pages/Submit'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const PublicPortal = lazy(() => import('./pages/PublicPortal'));
const PublicSubmission = lazy(() => import('./pages/PublicSubmission'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const { t } = useTranslation();

  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <Suspense fallback={<FullPageLoader label={t('common.loading')} />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="track" element={<Track />} />
              <Route path="portal" element={<PublicPortal />} />
              <Route path="portal/:trackingNumber" element={<PublicSubmission />} />

              <Route
                path="dashboard"
                element={
                  <ProtectedRoute roles={['citizen']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/submissions/:id"
                element={
                  <ProtectedRoute roles={['citizen']}>
                    <MySubmission />
                  </ProtectedRoute>
                }
              />
              <Route
                path="submit"
                element={
                  <ProtectedRoute roles={['citizen']}>
                    <Submit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={['district_head', 'sector_head', 'super_admin']}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="super-admin"
                element={
                  <ProtectedRoute roles={['super_admin']}>
                    <SuperAdmin />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
