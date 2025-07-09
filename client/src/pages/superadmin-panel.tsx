import { useQuery } from '@tanstack/react-query';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { UserManagement } from '@/components/user-management';
import { SubmissionManagement } from '@/components/submission-management';
import { UserTestsDashboard } from '@/components/user-tests-dashboard';
import { RecentActivity } from '@/components/recent-activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Activity, Database } from 'lucide-react';
import { ApiService } from '@/services/api';
import { User, Submission } from '@shared/schema';
import React, { useState, useMemo, useEffect } from 'react';
import { QAModule } from '@/components/qa-module';

export default function SuperAdminPanel() {
  const { user } = useAuthRedirect();
  const [activeSection, setActiveSection] = useState("panel");

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail.section || "panel");
    };

    window.addEventListener('navigation-section-change', handleSectionChange as EventListener);
    return () => window.removeEventListener('navigation-section-change', handleSectionChange as EventListener);
  }, []);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => ApiService.get('/api/users'),
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => ApiService.get('/api/submissions'),
  });

  if (!user || user.role !== 'superadmin') {
    return null;
  }

  const activeTrainees = users.filter((u: User) => u.role === 'trainee').length;
  const adminUsers = users.filter((u: User) => u.role === 'admin').length;
  const totalSubmissions = submissions.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Super Admin Panel</h2>
          <p className="text-slate-600">Manage users, roles, and system settings</p>
        </div>

        {/* Super Admin Panel Section */}
        {activeSection === "panel" && (
          <div id="panel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Users</span>
                      <span className="font-medium text-slate-900">{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Active Trainees</span>
                      <span className="font-medium text-slate-900">{activeTrainees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Admin Users</span>
                      <span className="font-medium text-slate-900">{adminUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Submissions</span>
                      <span className="font-medium text-slate-900">{totalSubmissions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-slate-600">Manage users, view submissions, and monitor system activity from the navigation menu.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-2 bg-blue-50 hover:bg-blue-100 rounded text-sm text-blue-700">View Users</button>
                      <button className="p-2 bg-green-50 hover:bg-green-100 rounded text-sm text-green-700">Check Submissions</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* User Management */}
        {activeSection === "users" && (
          <div id="users">
            <UserManagement />
          </div>
        )}

        {/* Submission Management */}
        {activeSection === "submissions" && (
          <div id="submissions" className="mt-6">
            <SubmissionManagement userRole={user?.role} />
          </div>
        )}

        {/* Q&A Module */}
        {activeSection === "qa" && (
          <div id="qa" className="mt-6">
            <QAModule currentUser={user} />
          </div>
        )}

        {/* User Tests Dashboard */}
        {activeSection === "usertests" && (
          <div id="usertests" className="mt-6">
            <UserTestsDashboard userRole={user?.role} />
          </div>
        )}

        {/* System Analytics */}
        {activeSection === "analytics" && (
          <div id="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed System Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Users</span>
                      <span className="font-medium text-slate-900">{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Active Trainees</span>
                      <span className="font-medium text-slate-900">{activeTrainees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Admin Users</span>
                      <span className="font-medium text-slate-900">{adminUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Submissions</span>
                      <span className="font-medium text-slate-900">{totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Average Completion Rate</span>
                      <span className="font-medium text-slate-900">
                        {submissions.length > 0 ? Math.round((submissions.filter((s: any) => s.status === 'Completed').length / submissions.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Completed Tests</span>
                      <span className="font-medium text-slate-900">{submissions.filter((s: any) => s.status === 'Completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Evaluated Tests</span>
                      <span className="font-medium text-slate-900">{submissions.filter((s: any) => s.evaluation).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Average Score</span>
                      <span className="font-medium text-slate-900">
                        {submissions.filter((s: any) => s.evaluation).length > 0 
                          ? Math.round(submissions.filter((s: any) => s.evaluation).reduce((sum: number, s: any) => sum + (s.evaluation?.percentage || 0), 0) / submissions.filter((s: any) => s.evaluation).length)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {activeSection === "activity" && (
          <div id="activity" className="mt-6">
            <RecentActivity userRole={user?.role} />
          </div>
        )}
      </div>
    </div>
  );
}