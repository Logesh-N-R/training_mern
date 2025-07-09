import { Router, Route, Switch } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/login';
import Register from '@/pages/register';
import AdminDashboard from '@/pages/admin-dashboard';
import SuperAdminPanel from '@/pages/superadmin-panel';
import TraineeDashboard from '@/pages/trainee-dashboard';
import NotFound from '@/pages/not-found';
import { Navigation } from '@/components/navigation';
import { UserManagement } from '@/components/user-management';
import { UserTestsDashboard } from '@/components/user-tests-dashboard';
import { SubmissionManagement } from '@/components/submission-management';
import { QAModule } from '@/components/qa-module';
import { RecentActivity } from '@/components/recent-activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileSpreadsheet } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function Router() {
  const { user } = useAuth();
  const submissions = []; //Dummy data just to avoid error

  const exportToExcel = () => {
    //Dummy function just to avoid error
  };
  return (
    <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/admin-dashboard">
            {user?.role === 'admin' || user?.role === 'superadmin' ? <AdminDashboard /> : <Navigate to="/login" />}
          </Route>
          <Route path="/superadmin-panel">
            {user?.role === 'superadmin' ? <SuperAdminPanel /> : <Navigate to="/login" />}
          </Route>
          <Route path="/trainee-dashboard">
            {user?.role === 'trainee' ? <TraineeDashboard /> : <Navigate to="/login" />}
          </Route>

          {/* Individual Menu Pages */}
          <Route path="/user-management">
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <UserManagement userRole={user.role} />
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/test-performance">
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <UserTestsDashboard userRole={user.role} />
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/test-submissions">
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <SubmissionManagement userRole={user.role === 'superadmin' ? 'superadmin' : 'admin'} />
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/past-submissions">
            {user?.role === 'trainee' ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Card className="mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Clock className="w-5 h-5 mr-2" />
                          Past Submissions
                        </CardTitle>
                        {submissions?.length > 0 && (
                          <Button
                            onClick={exportToExcel}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export Excel
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Past Submissions Content - Will be moved here */}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/qa-community">
            {user ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <QAModule currentUser={user} />
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/system-stats">
            {user?.role === 'superadmin' ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* System Statistics Cards */}
                  </div>
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/recent-activity">
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <RecentActivity />
                </div>
              </div>
            ) : <Navigate to="/login" />}
          </Route>

          <Route path="/">
            {user ? (
              user.role === 'trainee' ? <Navigate to="/trainee-dashboard" /> :
              user.role === 'admin' ? <Navigate to="/admin-dashboard" /> :
              user.role === 'superadmin' ? <Navigate to="/superadmin-panel" /> :
              <NotFound />
            ) : (
              <Navigate to="/login" />
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;