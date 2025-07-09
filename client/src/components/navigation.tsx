
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LogOut, 
  Menu, 
  X, 
  Users, 
  ClipboardCheck, 
  MessageCircle, 
  BarChart3, 
  Clock, 
  LayoutDashboard,
  Settings,
  UserCheck,
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useLocation } from 'wouter';

export function Navigation() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isSuperAdmin = user.role === 'superadmin';

  const menuItems = [
    {
      section: 'Dashboard',
      items: [
        { 
          name: 'Dashboard', 
          icon: LayoutDashboard, 
          path: user.role === 'trainee' ? '/trainee-dashboard' : user.role === 'admin' ? '/admin-dashboard' : '/superadmin-panel',
          roles: ['trainee', 'admin', 'superadmin'] 
        },
      ]
    },
    {
      section: 'Training Management',
      items: [
        { 
          name: 'User Management', 
          icon: Users, 
          path: '/user-management',
          roles: ['admin', 'superadmin'] 
        },
        { 
          name: 'Test Performance', 
          icon: TrendingUp, 
          path: '/test-performance',
          roles: ['admin', 'superadmin'] 
        },
        { 
          name: 'Test Submissions', 
          icon: ClipboardCheck, 
          path: '/test-submissions',
          roles: ['admin', 'superadmin'] 
        },
        { 
          name: 'Past Submissions', 
          icon: Clock, 
          path: '/past-submissions',
          roles: ['trainee'] 
        },
      ]
    },
    {
      section: 'Community',
      items: [
        { 
          name: 'Q&A Community', 
          icon: MessageCircle, 
          path: '/qa-community',
          roles: ['trainee', 'admin', 'superadmin'] 
        },
      ]
    },
    {
      section: 'System',
      items: [
        { 
          name: 'System Statistics', 
          icon: BarChart3, 
          path: '/system-stats',
          roles: ['superadmin'] 
        },
        { 
          name: 'Recent Activity', 
          icon: Activity, 
          path: '/recent-activity',
          roles: ['admin', 'superadmin'] 
        },
      ]
    }
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    if (path === '/trainee-dashboard' && location === '/') return true;
    if (path === '/admin-dashboard' && location === '/') return true;
    if (path === '/superadmin-panel' && location === '/') return true;
    return location === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">Training App</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {menuItems.map((section) => (
              <div key={section.section} className="flex items-center space-x-1">
                {section.items
                  .filter(item => item.roles.includes(user.role))
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.name}
                        variant={isActiveRoute(item.path) ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleNavigation(item.path)}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden xl:inline">{item.name}</span>
                      </Button>
                    );
                  })}
                {section.section !== 'System' && (
                  <div className="w-px h-6 bg-slate-200 mx-2" />
                )}
              </div>
            ))}
          </div>

          {/* User Menu and Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {/* Welcome Message - Hidden on small screens */}
            <div className="hidden md:block">
              <span className="text-sm text-slate-600">
                Welcome, <span className="font-medium text-slate-900">{user.name}</span>
              </span>
            </div>

            {/* User Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">Logout</span>
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4">
            <div className="space-y-4">
              {menuItems.map((section) => {
                const visibleItems = section.items.filter(item => item.roles.includes(user.role));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.section}>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                      {section.section}
                    </h3>
                    <div className="space-y-1">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.name}
                            variant={isActiveRoute(item.path) ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleNavigation(item.path)}
                            className="w-full justify-start"
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
