import { useQuery } from '@tanstack/react-query';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { UserManagement } from '@/components/user-management';
import { SubmissionManagement } from '@/components/submission-management';
import { UserTestsDashboard } from '@/components/user-tests-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Activity, Database } from 'lucide-react';
import { ApiService } from '@/services/api';
import { User, Submission } from '@shared/schema';
import React, { useState } from 'react';

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

  // Calculate recent activity from real data
  const recentActivity = useMemo(() => {
    const activities: Array<{ description: string; timestamp: string; date: Date }> = [];
    
    // Add recent user registrations
    users.forEach((user: User) => {
      if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
        
        if (diffHours <= 168) { // Show activity from last week
          let timeString = '';
          if (diffHours < 1) timeString = 'Less than an hour ago';
          else if (diffHours < 24) timeString = `${diffHours} hours ago`;
          else timeString = `${Math.floor(diffHours / 24)} days ago`;
          
          activities.push({
            description: `New user registration: ${user.email}`,
            timestamp: timeString,
            date: createdDate
          });
        }
      }
    });
    
    // Add recent submissions
    submissions.forEach((submission: Submission) => {
      if (submission.submittedAt) {
        const submittedDate = new Date(submission.submittedAt);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60));
        
        if (diffHours <= 168) { // Show activity from last week
          let timeString = '';
          if (diffHours < 1) timeString = 'Less than an hour ago';
          else if (diffHours < 24) timeString = `${diffHours} hours ago`;
          else timeString = `${Math.floor(diffHours / 24)} days ago`;
          
          const user = users.find((u: User) => u._id === submission.userId || u.id === submission.userId);
          activities.push({
            description: `Test submitted by ${user?.email || 'Unknown user'}`,
            timestamp: timeString,
            date: submittedDate
          });
        }
      }
    });
    
    // Sort by date (most recent first) and take only the last 10
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)
      .map(({ description, timestamp }) => ({ description, timestamp }));
  }, [users, submissions]);

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

        {/* User Tests Dashboard */}
        <div className="mt-6">
          <UserTestsDashboard userRole={user?.role} />
        </div>

        {/* Submission Management */}
        <div className="mt-6">
          <SubmissionManagement userRole="superadmin" />
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4">
                    <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{activity.description}</p>
                        <p className="text-xs text-slate-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}