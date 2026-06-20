import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.authLoading);

  // Wait for auth to initialize before deciding
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Restoring session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
