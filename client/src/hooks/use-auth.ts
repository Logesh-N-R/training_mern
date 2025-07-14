import { useAuth as useAuthContext } from '@/context/AuthContext';

// Re-export useAuth from context
export const useAuth = useAuthContext;

// Hook for checking role without redirects
export function useRoleRedirect() {
  const { user, isLoading } = useAuthContext();
  return { user, isLoading };
}

// Hook for checking auth without redirects
export function useAuthRedirect() {
  const { user, isLoading } = useAuthContext();
  return { user, isLoading };
}