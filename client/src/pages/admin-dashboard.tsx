import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { QuestionUploader } from '@/components/question-uploader';
import { SubmissionManagement } from '@/components/submission-management';
import { QAModule } from '@/components/qa-module';
import { UserTestsDashboard } from '@/components/user-tests-dashboard';
import { RecentActivity } from '@/components/recent-activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, ClipboardCheck, Clock, HelpCircle, Search, Settings, BarChart3, Upload, CheckCircle, Activity } from 'lucide-react';
import { ApiService } from '@/services/api';
import { User, Submission } from '@shared/schema';

export default function AdminDashboard() {
  const { user, isLoading } = useAuthRedirect();
  const [selectedTrainee, setSelectedTrainee] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("qa");

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail.section || "dashboard");
    };

    window.addEventListener('navigation-section-change', handleSectionChange as EventListener);
    return () => window.removeEventListener('navigation-section-change', handleSectionChange as EventListener);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const { data: trainees = [], isLoading: loadingTrainees } = useQuery({
    queryKey: ['/api/trainees'],
    queryFn: () => ApiService.get('/api/trainees'),
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => ApiService.get('/api/submissions'),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => ApiService.get('/api/questions'),
  });

  const handleViewTrainee = (trainee: User) => {
    setSelectedTrainee(trainee);
    setIsViewModalOpen(true);
  };

  const handleEditTrainee = (trainee: User) => {
    setSelectedTrainee(trainee);
    setIsEditModalOpen(true);
  };


  const completedTests = submissions.filter((s: Submission) => s.status === 'Completed').length;
  const evaluatedTests = submissions.filter((s: Submission) => s.status === 'Evaluated').length;
  const pendingTests = submissions.filter((s: Submission) => s.status !== 'Completed' && s.status !== 'Evaluated').length;
  const totalQuestions = questions.reduce((total: number, q: any) => total + (q.questions?.length || 0), 0);

  // Calculate average grade
  const evaluatedSubmissions = submissions.filter((s: Submission) => s.evaluation);
  const averagePercentage = evaluatedSubmissions.length > 0 
    ? Math.round(evaluatedSubmissions.reduce((sum: number, s: Submission) => sum + (s.evaluation?.percentage || 0), 0) / evaluatedSubmissions.length)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
        </div>

        {/* Tests Module */}
        {activeSection === "tests" && (
          <div id="tests" className="space-y-6">
            {/* Test Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                      <Users className="text-blue-600 text-lg md:text-xl" />
                    </div>
                    <div className="ml-3 md:ml-4">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{trainees.length}</h3>
                      <p className="text-sm md:text-base text-slate-600">Total Trainees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                      <ClipboardCheck className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="ml-3 md:ml-4 min-w-0">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{completedTests}</h3>
                      <p className="text-sm md:text-base text-slate-600 truncate">Completed Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 bg-purple-100 rounded-full flex-shrink-0">
                      <CheckCircle className="text-purple-600 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="ml-3 md:ml-4 min-w-0">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{evaluatedTests}</h3>
                      <p className="text-sm md:text-base text-slate-600 truncate">Evaluated Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 bg-yellow-100 rounded-full">
                      <Clock className="text-yellow-600 text-lg md:text-xl" />
                    </div>
                    <div className="ml-3 md:ml-4">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{pendingTests}</h3>
                      <p className="text-sm md:text-base text-slate-600">Pending Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 bg-indigo-100 rounded-full">
                      <BarChart3 className="text-indigo-600 text-lg md:text-xl" />
                    </div>
                    <div className="ml-3 md:ml-4">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{averagePercentage}%</h3>
                      <p className="text-sm md:text-base text-slate-600">Average Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Management */}
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Manage Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionManagement userRole="admin" />
                </CardContent>
              </Card>
            </div>

            {/* User Tests Dashboard */}
            <UserTestsDashboard userRole={user?.role} />
          </div>
        )}

        {/* User Management Module */}
        {activeSection === "users" && (
          <div id="users" className="space-y-6">
            {/* Trainee Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Trainee Management
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search trainees..."
                        className="pl-10"
                      />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTrainees ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading trainees...</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Tests Completed</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Last Activity</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {trainees.map((trainee: User) => {
                            const traineeSubmissions = submissions.filter((s: Submission) => s.userId === trainee.id);
                            const completedCount = traineeSubmissions.filter((s: Submission) => s.status === 'Completed').length;
                            const lastActivity = traineeSubmissions.length > 0 
                              ? new Date(Math.max(...traineeSubmissions.map((s: Submission) => new Date(s.submittedAt).getTime())))
                              : null;

                            return (
                              <tr key={trainee.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-900">{trainee.name}</td>
                                <td className="px-4 py-3 text-slate-600">{trainee.email}</td>
                                <td className="px-4 py-3 text-slate-900">{completedCount}</td>
                                <td className="px-4 py-3 text-slate-600">
                                  {lastActivity ? lastActivity.toLocaleDateString() : 'No activity'}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-primary hover:text-blue-700"
                                      onClick={() => handleViewTrainee(trainee)}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-slate-600 hover:text-slate-800"
                                      onClick={() => handleEditTrainee(trainee)}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {trainees.map((trainee: User) => {
                        const traineeSubmissions = submissions.filter((s: Submission) => s.userId === trainee.id);
                        const completedCount = traineeSubmissions.filter((s: Submission) => s.status === 'Completed').length;
                        const lastActivity = traineeSubmissions.length > 0 
                          ? new Date(Math.max(...traineeSubmissions.map((s: Submission) => new Date(s.submittedAt).getTime())))
                          : null;

                        return (
                          <Card key={trainee.id} className="mobile-card">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <h3 className="font-medium text-slate-900">{trainee.name}</h3>
                                    <p className="text-sm text-slate-600 break-all">{trainee.email}</p>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-slate-500">Tests Completed:</span>
                                    <p className="font-medium text-slate-900">{completedCount}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Last Activity:</span>
                                    <p className="font-medium text-slate-900">
                                      {lastActivity ? lastActivity.toLocaleDateString() : 'No activity'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-primary hover:text-blue-700 flex-1 sm:flex-none"
                                    onClick={() => handleViewTrainee(trainee)}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-slate-600 hover:text-slate-800 flex-1 sm:flex-none"
                                    onClick={() => handleEditTrainee(trainee)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Questions Module */}
        {activeSection === "upload" && (
          <div id="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Questions for Daily Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionUploader />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Q&A Module */}
        {activeSection === "qa" && (
          <div id="qa" className="mt-6">
            <QAModule currentUser={user} />
          </div>
        )}

        {/* Others Module */}
        {activeSection === "others" && (
          <div id="others" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  System Overview & Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Quick Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                        <span className="text-slate-600">Total Questions</span>
                        <span className="font-medium text-slate-900">{totalQuestions}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                        <span className="text-slate-600">Active Sessions</span>
                        <span className="font-medium text-slate-900">{questions.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                        <span className="text-slate-600">Pending Evaluations</span>
                        <span className="font-medium text-slate-900">{pendingTests}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Recent Activity</h3>
                    <RecentActivity userRole={user?.role} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Trainee Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Trainee Details</DialogTitle>
            </DialogHeader>
            {selectedTrainee && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <p className="text-slate-900">{selectedTrainee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <p className="text-slate-900">{selectedTrainee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <p className="text-slate-900 capitalize">{selectedTrainee.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Created Date</label>
                  <p className="text-slate-900">{new Date(selectedTrainee.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tests Completed</label>
                  <p className="text-slate-900">
                    {submissions.filter((s: Submission) => s.userId === selectedTrainee.id && s.status === 'Completed').length}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Trainee Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Trainee</DialogTitle>
            </DialogHeader>
            {selectedTrainee && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <Input defaultValue={selectedTrainee.name} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <Input defaultValue={selectedTrainee.email} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <Select defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="bg-primary hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}