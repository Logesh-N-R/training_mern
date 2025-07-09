import { useQuery } from '@tanstack/react-query';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { UserManagement } from '@/components/user-management';
import { SubmissionManagement } from '@/components/submission-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Activity, Database } from 'lucide-react';
import { ApiService } from '@/services/api';
import { User, Submission } from '@shared/schema';

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

  // Recent activity simulation
  const recentActivity = [
    { description: 'New user registration: jane.smith@example.com', timestamp: '2 hours ago' },
    { description: 'Test submitted by john.doe@example.com', timestamp: '4 hours ago' },
    { description: 'New questions uploaded by admin', timestamp: '6 hours ago' },
  ];

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
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
