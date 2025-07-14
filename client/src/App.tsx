
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Login from "@/pages/login";
import Register from "@/pages/register";
import TraineeDashboard from "@/pages/trainee-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import SuperAdminPanel from "@/pages/superadmin-panel";

const AppContent = React.memo(() => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = React.useState<'login' | 'register' | 'dashboard'>('login');

  // Clear any URL routing on app load
  React.useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Auto-navigate based on user state
  React.useEffect(() => {
    if (!isLoading) {
      if (user) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('login');
      }
    }
  }, [user, isLoading]);

  const handleNavigateToRegister = () => setCurrentView('register');
  const handleNavigateToLogin = () => setCurrentView('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const renderCurrentView = () => {
    if (!user) {
      switch (currentView) {
        case 'register':
          return <Register onNavigateToLogin={handleNavigateToLogin} />;
        case 'login':
        default:
          return <Login onNavigateToRegister={handleNavigateToRegister} />;
      }
    }

    // User is logged in, show appropriate dashboard
    switch (user.role) {
      case 'trainee':
        return <TraineeDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'superadmin':
        return <SuperAdminPanel />;
      default:
        return <TraineeDashboard />;
    }
  };

  return renderCurrentView();
});

AppContent.displayName = 'AppContent';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
