import { useQuery } from '@tanstack/react-query';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { UserManagement } from '@/components/user-management';
import { QuestionUploader } from '@/components/question-uploader';
import { SubmissionManagement } from '@/components/submission-management';
import { UserTestsDashboard } from '@/components/user-tests-dashboard';
import { RecentActivity } from '@/components/recent-activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, Activity, Database, Settings, ClipboardList, HelpCircle, BarChart3 } from 'lucide-react';
import { ApiService } from '@/services/api';
import { User, Submission } from '@shared/schema';
import React, { useState, useMemo, useEffect } from 'react';
import { QAModule } from '@/components/qa-module';

export default function SuperAdminPanel() {
  const { user } = useAuthRedirect();
  const [activeSection, setActiveSection] = useState("qa");

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail.section || "dashboard");
    };

    window.addEventListener('navigation-section-change', handleSectionChange as EventListener);
    return () => window.removeEventListener('navigation-section-change', handleSectionChange as EventListener);
  }, []);

  if (!user || user.role !== 'superadmin') {
    return <div>Access denied</div>;
  }

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
    totalQuestions: 0,
    totalSubmissions: 0
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => ApiService.get('/api/users'),
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => ApiService.get('/api/submissions'),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => ApiService.get('/api/questions'),
  });

  useEffect(() => {
    if (users.length > 0) {
      const admins = users.filter((u: User) => u.role === 'admin');
      const superAdmins = users.filter((u: User) => u.role === 'superadmin');
      const totalQuestions = questions.reduce((total: number, q: any) => total + (q.questions?.length || 0), 0);

      setSystemStats({
        totalUsers: users.length,
        totalAdmins: admins.length,
        totalSuperAdmins: superAdmins.length,
        totalQuestions,
        totalSubmissions: submissions.length
      });
    }
  }, [users, submissions, questions]);

  const systemStatsMemo = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmins = users.filter((u: User) => u.role === 'admin').length;
    const totalTrainees = users.filter((u: User) => u.role === 'trainee').length;
    const totalSuperAdmins = users.filter((u: User) => u.role === 'superadmin').length;
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter((s: Submission) => s.status === 'Completed').length;
    const evaluatedSubmissions = submissions.filter((s: Submission) => s.evaluation).length;
    const totalQuestions = questions.reduce((total: number, q: any) => total + (q.questions?.length || 0), 0);

    return {
      totalUsers,
      totalAdmins,
      totalTrainees,
      totalSuperAdmins,
      totalSubmissions,
      completedSubmissions,
      evaluatedSubmissions,
      totalQuestions,
    };
  }, [users, submissions, questions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          {/* Navigation handled by Navigation component */}
        </div>

        {/* Tests Module */}
        {activeSection === "tests" && (
          <div id="tests" className="space-y-6">
            {/* Test Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <ClipboardList className="text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.totalSubmissions}</h3>
                      <p className="text-slate-600">Total Submissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <BarChart3 className="text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.completedSubmissions}</h3>
                      <p className="text-slate-600">Completed Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Shield className="text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.evaluatedSubmissions}</h3>
                      <p className="text-slate-600">Evaluated Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Database className="text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.totalQuestions}</h3>
                      <p className="text-slate-600">Total Questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Management Sections */}
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Test Performance Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserTestsDashboard userRole={user?.role} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Submission Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionManagement userRole={user?.role} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* User Management Module */}
        {activeSection === "users" && (
          <div id="users" className="space-y-6">
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.totalUsers}</h3>
                      <p className="text-slate-600">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users className="text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.totalTrainees}</h3>
                      <p className="text-slate-600">Trainees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Shield className="text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.totalAdmins}</h3>
                      <p className="text-slate-600">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-full">
                      <Shield className="text-red-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{systemStatsMemo.totalSuperAdmins}</h3>
                      <p className="text-slate-600">Super Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Management Component */}
            <UserManagement />
          </div>
        )}

        {/* Q&A Module */}
        {activeSection === "qa" && (
          <div id="qa" className="mt-6">
            <QAModule currentUser={user} />
          </div>
        )}

         {/* Upload Questions Module */}
        {activeSection === "upload" && (
          <div id="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Upload Questions for Daily Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionUploader />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Others Module */}
        {activeSection === "others" && (
          <div id="others" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded">
                        <h4 className="font-medium text-slate-900">System Health</h4>
                        <p className="text-sm text-green-600">All systems operational</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <h4 className="font-medium text-slate-900">Database Status</h4>
                        <p className="text-sm text-green-600">Connected & Active</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900">Quick Actions</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => window.dispatchEvent(new CustomEvent('navigation-section-change', { detail: { section: 'users' } }))}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage Users
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => window.dispatchEvent(new CustomEvent('navigation-section-change', { detail: { section: 'tests' } }))}
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
                          View Test Analytics
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => window.dispatchEvent(new CustomEvent('navigation-section-change', { detail: { section: 'upload' } }))}
                        >
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Upload Questions
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent System Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivity userRole={user?.role} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Panel Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-900">Admin Dashboard Access</h3>
                    <p className="text-sm text-slate-600">Access admin-level features and controls</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/admin/dashboard'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Access Admin View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}