import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FullPageLoader } from '../ui/Spinner';
import { homeForRole } from '../../utils/status';

export default function ProtectedRoute({ children, roles }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (booting) {
    return <FullPageLoader label={t('common.loading')} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
