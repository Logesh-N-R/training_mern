
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Users, ClipboardList, BarChart3, Menu, X, Upload, FileText, MessageSquare, Settings, HelpCircle, Activity, Shield, Database, UserCheck, Clock, Star, BookOpen, CheckCircle } from "lucide-react";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "trainee":
        return [
          { href: "/test", label: "Take Test", icon: ClipboardList },
          { href: "/test", label: "Test History", icon: Clock, section: "history" },
          { href: "/test", label: "View Feedback", icon: MessageSquare, section: "feedback" },
          { href: "/test", label: "Q&A Module", icon: HelpCircle, section: "qa" },
          { href: "/test", label: "Export Data", icon: FileText, section: "export" },
          { href: "/test", label: "Progress Tracking", icon: BarChart3, section: "progress" },
        ];
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
          { href: "/admin/dashboard", label: "Upload Questions", icon: Upload, section: "upload" },
          { href: "/admin/dashboard", label: "Manage Submissions", icon: CheckCircle, section: "submissions" },
          { href: "/admin/dashboard", label: "Evaluate Tests", icon: Star, section: "evaluate" },
          { href: "/admin/dashboard", label: "Trainee Management", icon: Users, section: "trainees" },
          { href: "/admin/dashboard", label: "Q&A Module", icon: HelpCircle, section: "qa" },
          { href: "/admin/dashboard", label: "User Tests", icon: ClipboardList, section: "usertests" },
          { href: "/admin/dashboard", label: "Recent Activity", icon: Activity, section: "activity" },
        ];
      case "superadmin":
        return [
          { href: "/superadmin", label: "Super Admin Panel", icon: Shield },
          { href: "/superadmin", label: "User Management", icon: Users, section: "users" },
          { href: "/superadmin", label: "Role Management", icon: UserCheck, section: "roles" },
          { href: "/superadmin", label: "System Analytics", icon: Database, section: "analytics" },
          { href: "/superadmin", label: "Submissions", icon: CheckCircle, section: "submissions" },
          { href: "/superadmin", label: "Q&A Module", icon: HelpCircle, section: "qa" },
          { href: "/superadmin", label: "User Tests", icon: ClipboardList, section: "usertests" },
          { href: "/superadmin", label: "Recent Activity", icon: Activity, section: "activity" },
          { href: "/admin/dashboard", label: "Admin View", icon: Settings },
        ];
      default:
        return [];
    }
  };

  const handleNavClick = (item: any) => {
    setIsMobileMenuOpen(false);
    
    // Handle section-specific navigation
    if (item.section && item.href === location) {
      // If we're already on the page, scroll to the section
      const element = document.getElementById(item.section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                Training Management System
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {getNavItems().map((item, index) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.section && location === item.href);
                
                return (
                  <Link
                    key={`${item.href}-${index}`}
                    href={item.href}
                    className={`text-slate-700 hover:text-primary px-2 py-2 rounded-md text-xs font-medium flex items-center transition-colors ${
                      isActive ? "text-primary bg-blue-50" : ""
                    }`}
                    onClick={() => handleNavClick(item)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
              <span className="text-sm text-slate-600 truncate max-w-32">
                {user.name}
              </span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="bg-primary text-white hover:bg-blue-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3">
            <div className="space-y-2">
              {getNavItems().map((item, index) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.section && location === item.href);
                
                return (
                  <Link
                    key={`mobile-${item.href}-${index}`}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "text-primary bg-blue-50"
                        : "text-slate-700 hover:text-primary hover:bg-slate-50"
                    }`}
                    onClick={() => handleNavClick(item)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                    <span className="text-sm text-slate-600">
                      {user.name}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="mx-3 bg-primary text-white hover:bg-blue-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
