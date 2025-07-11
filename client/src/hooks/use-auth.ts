import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

// Re-export useAuth from context
export const useAuth = useAuthContext;

export function useAuthRedirect() {
  const { user, isLoading } = useAuthContext();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Store the current location to redirect back after login
      localStorage.setItem('redirectAfterLogin', location);
      navigate('/login');
    }
  }, [user, isLoading, navigate, location]);

  return { user, isLoading };
}

export function useRoleRedirect() {
  const { user, isLoading } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'trainee':
          navigate('/test');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'superadmin':
          navigate('/superadmin');
          break;
      }
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
}