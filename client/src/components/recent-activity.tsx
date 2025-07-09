import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, User, Calendar, FileSpreadsheet } from 'lucide-react';
import { ApiService } from '@/services/api';
import { Submission, User as UserType } from '@shared/schema';
import * as XLSX from 'xlsx';

interface RecentActivityProps {
  userRole?: string;
}

export function RecentActivity({ userRole }: RecentActivityProps) {
  const usersEndpoint = userRole === 'superadmin' ? '/api/users' : '/api/trainees';

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: [usersEndpoint],
    queryFn: () => ApiService.get(usersEndpoint),
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => ApiService.get('/api/submissions'),
  });

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

  const exportToExcel = () => {
    const exportData = recentActivity.map((activity) => ({
      'Description': activity.description,
      'Timestamp': activity.timestamp
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recent Activity');

    const fileName = `recent_activity_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };


  if (loadingUsers || loadingSubmissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading activity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
          <Button
            onClick={exportToExcel}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
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
  );
}