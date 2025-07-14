
import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Re-export useAuth from context
export const useAuth = useAuthContext;

// Hook for redirecting authenticated users away from auth pages
export function useRoleRedirect() {
  const { user, isLoading } = useAuthContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role === 'superadmin') {
        setLocation('/superadmin/panel');
      } else if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (user.role === 'trainee') {
        setLocation('/trainee/dashboard');
      }
    }
  }, [user, isLoading, setLocation]);

  return { user, isLoading };
}

// Hook for redirecting unauthenticated users to login
export function useAuthRedirect() {
  const { user, isLoading } = useAuthContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  return { user, isLoading };
}
