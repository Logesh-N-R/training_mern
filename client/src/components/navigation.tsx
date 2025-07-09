import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Users, ClipboardList, BarChart3 } from "lucide-react";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "trainee":
        return [
          { href: "/test", label: "Test", icon: ClipboardList },
          //{ href: "/test/history", label: "History", icon: BarChart3 },
        ];
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
          //{ href: "/admin/questions", label: "Questions", icon: ClipboardList },
          //{ href: "/admin/trainees", label: "Trainees", icon: Users },
        ];
      case "superadmin":
        return [
          { href: "/superadmin", label: "Dashboard", icon: BarChart3 },
          {
            href: "/admin/dashboard",
            label: "Admin View",
            icon: ClipboardList,
          },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-slate-900">
                Daily Training Test App
              </h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {getNavItems().map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-slate-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      location === item.href ? "text-primary" : ""
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">Welcome, {user.name}</span>
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
        </div>
      </div>
    </header>
  );
}
