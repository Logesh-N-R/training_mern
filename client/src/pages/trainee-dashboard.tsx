import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { TestForm } from '@/components/test-form';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { ApiService } from '@/services/api';

export default function TraineeDashboard() {
  const { user } = useAuthRedirect();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/submissions/my'],
    queryFn: () => ApiService.get('/api/submissions/my'),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Trainee Dashboard</h2>
          <p className="text-slate-600">Complete your daily training test</p>
        </div>

        <TestForm />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="text-blue-600 text-lg md:text-xl" />
                </div>
                <div className="ml-3 md:ml-4">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">{submissions.length}</h3>
                  <p className="text-sm md:text-base text-slate-600">Total Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-green-100 rounded-full">
                  <Clock className="text-green-600 text-lg md:text-xl" />
                </div>
                <div className="ml-3 md:ml-4">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                    {submissions.filter((s: any) => s.evaluation).length}
                  </h3>
                  <p className="text-sm md:text-base text-slate-600">Evaluated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                  <Calendar className="text-purple-600 text-lg md:text-xl" />
                </div>
                <div className="ml-3 md:ml-4">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                    {submissions.filter((s: any) => s.evaluation).length > 0 
                      ? Math.round(submissions.filter((s: any) => s.evaluation).reduce((sum: number, s: any) => sum + (s.evaluation?.percentage || 0), 0) / submissions.filter((s: any) => s.evaluation).length)
                      : 0}%
                  </h3>
                  <p className="text-sm md:text-base text-slate-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}