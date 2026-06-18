import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps a route element, requiring an authenticated user. If `roles` is
 * given, the user's role must be in that list, otherwise they're sent
 * to their own dashboard instead of the page they tried to load.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
