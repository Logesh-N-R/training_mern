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
import React, { useState, useMemo } from 'react';
import { QAModule } from '@/components/qa-module';

export default function SuperAdminPanel() {
  const { user } = useAuthRedirect();

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

        {/* User Management */}
        <UserManagement />

        {/* Submission Management */}
        <div className="mt-6">
          <SubmissionManagement userRole={user?.role} />
        </div>

        {/* Q&A Module */}
        <div className="mt-6">
          <QAModule currentUser={user} />
        </div>

        {/* User Tests Dashboard */}
        <div className="mt-6">
          <UserTestsDashboard userRole={user?.role} />
        </div>

        {/* System Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

          <RecentActivity userRole={user?.role} />
        </div>
      </div>
    </div>
  );
}