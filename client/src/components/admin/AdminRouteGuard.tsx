import { Navigate, Outlet } from 'react-router-dom';

/**
 * Decode a JWT payload without verifying the signature (client-side only).
 * Signature verification happens on the backend; here we only check expiry.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

function isTokenValid(): boolean {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  // Check expiry
  const exp = payload.exp as number | undefined;
  if (!exp) return false;
  if (Date.now() / 1000 > exp) {
    // Token expired — clear auth state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_role');
    return false;
  }

  return true;
}

export function AdminRouteGuard() {
  if (!isTokenValid()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
