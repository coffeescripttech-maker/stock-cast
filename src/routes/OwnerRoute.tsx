import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function OwnerRoute() {
  const role = useAuthStore((s) => s.currentUser?.role);

  if (role !== 'owner') {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
