import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useEffect } from 'react';

// Re-export useAuth from context
export const useAuth = useAuthContext;

// Hook for checking if user should be redirected (no longer handles URL)
export function useRoleRedirect() {
  const { user, isLoading } = useAuthContext();

  // This hook now just returns user state without URL manipulation
  // The App component handles navigation based on user role
  return { user, isLoading };
}

// Hook for checking auth status (no longer handles URL)
export function useAuthRedirect() {
  const { user, isLoading } = useAuthContext();

  // This hook now just returns user state without URL manipulation
  // The App component handles showing login/register based on auth state
  return { user, isLoading };
}