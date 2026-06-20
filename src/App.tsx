import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { ToastContainer } from './components/ui/ToastContainer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const initTheme = useUIStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    // Initialize auth session on every mount (page refresh)
    useAuthStore.getState().initAuth();
  }, [initTheme]);

  useKeyboardShortcuts();

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
