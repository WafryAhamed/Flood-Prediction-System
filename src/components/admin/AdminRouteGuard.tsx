import { Navigate, Outlet } from 'react-router-dom';

export function AdminRouteGuard() {
  const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
