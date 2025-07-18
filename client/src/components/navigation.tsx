import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  Users,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  Upload,
  Settings,
  HelpCircle,
  User,
  Moon,
  Sun,
} from "lucide-react";

export function Navigation() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "trainee":
        return [
          {
            label: "Ask doubt",
            icon: HelpCircle,
            section: "qa",
          },
          {
            label: "Tests",
            icon: ClipboardList,
            section: "test",
          },
          {
            label: "History & Progress",
            icon: BarChart3,
            section: "history",
          },
          { label: "Others", icon: Settings, section: "others" },
        ];
      case "admin":
        return [
          {
            label: "Ask doubt",
            icon: HelpCircle,
            section: "qa",
          },
          {
            label: "Tests",
            icon: ClipboardList,
            section: "tests",
          },
          {
            label: "Upload Questions",
            icon: Upload,
            section: "upload",
          },
          {
            label: "User Management",
            icon: Users,
            section: "users",
          },
          {
            label: "Others",
            icon: Settings,
            section: "others",
          },
        ];
      case "superadmin":
        return [
          {
            label: "Ask doubt",
            icon: HelpCircle,
            section: "qa",
          },
          {
            label: "Tests",
            icon: ClipboardList,
            section: "tests",
          },
          {
            label: "Upload Questions",
            icon: Upload,
            section: "upload",
          },
          {
            label: "User Management",
            icon: Users,
            section: "users",
          },
          {
            label: "Others",
            icon: Settings,
            section: "others",
          },
        ];
      default:
        return [];
    }
  };

  const handleNavClick = (item: any) => {
    setIsMobileMenuOpen(false);

    // Set active section for highlighting
    setActiveSection(item.section || "");

    // Emit custom event for section navigation
    window.dispatchEvent(
      new CustomEvent("navigation-section-change", {
        detail: { section: item.section || "" },
      }),
    );
  };

  const TrainQuestLogo = () => (
    <svg
      width="200"
      height="50"
      viewBox="0 0 280 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon (Book/Quest) */}
      <rect x="5" y="5" width="48" height="50" rx="8" fill="#4F46E5" />
      <path
        d="M15 25 H38 M15 33 H38"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="26.5" cy="19" r="2.5" fill="white" />

      {/* Text: TrainQuest */}
      <text
        x="65"
        y="38"
        fontFamily="'Segoe UI', sans-serif"
        fontSize="28"
        fontWeight="600"
        fill="#111827"
      >
        Train
        <tspan fill="#4F46E5">Quest</tspan>
      </text>
    </svg>
  );

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Password reset successfully",
      });

      // Reset form and close modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsResetPasswordOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrainQuestLogo />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {getNavItems().map((item, index) => {
                const Icon = item.icon;
                const isActive = activeSection === item.section;

                return (
                  <button
                    key={`nav-${item.section}-${index}`}
                    className={`text-slate-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                      isActive ? "text-primary bg-blue-50 shadow-sm" : ""
                    }`}
                    onClick={() => handleNavClick(item)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Profile Dropdown */}
          <div className="hidden md:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.profileImage || ""}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                        user.role === "superadmin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                    <span className="text-sm">Role</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">
                      User ID: {user.id}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleDarkMode}>
                  {isDarkMode ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
                <Dialog
                  open={isResetPasswordOpen}
                  onOpenChange={setIsResetPasswordOpen}
                >
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Reset Password</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsResetPasswordOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Resetting..." : "Reset Password"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                const isActive = activeSection === item.section;

                return (
                  <button
                    key={`mobile-nav-${item.section}-${index}`}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "text-primary bg-blue-50 shadow-sm"
                        : "text-slate-700 hover:text-primary hover:bg-slate-50"
                    }`}
                    onClick={() => handleNavClick(item)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                );
              })}

              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.profileImage || ""}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-900">
                          {user.name}
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "superadmin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 space-y-1">
                  <div className="px-3 py-2 text-xs text-slate-600">
                    User ID: {user.id}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      toggleDarkMode();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 mr-2" />
                    ) : (
                      <Moon className="w-4 h-4 mr-2" />
                    )}
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </Button>
                  <Dialog
                    open={isResetPasswordOpen}
                    onOpenChange={setIsResetPasswordOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Reset Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handleResetPassword}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="current-password-mobile">
                            Current Password
                          </Label>
                          <Input
                            id="current-password-mobile"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-password-mobile">
                            New Password
                          </Label>
                          <Input
                            id="new-password-mobile"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password-mobile">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirm-password-mobile"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsResetPasswordOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Resetting..." : "Reset Password"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}