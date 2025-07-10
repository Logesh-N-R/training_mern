import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { toast } from '@/hooks/use-toast';
import { TestForm } from '@/components/test-form';
import { QAModule } from '@/components/qa-module';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Calendar, Clock, FileSpreadsheet, Eye, User, Star, BookOpen, GraduationCap, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { ApiService } from '@/services/api';
import { Submission } from '@shared/schema';
import * as XLSX from 'xlsx';
import { TestManagement } from '@/components/test-management';

export default function TraineeDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useAuthRedirect();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("qa");

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions/my'],
    queryFn: () => ApiService.get('/api/submissions/my'),
  });

  const { data: questionSets = [], isLoading: loadingQuestionSets } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => ApiService.get('/api/questions'),
  });

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail.section || "test");
    };

    window.addEventListener('navigation-section-change', handleSectionChange as EventListener);
    return () => window.removeEventListener('navigation-section-change', handleSectionChange as EventListener);
  }, []);

  // All hooks must be called before any conditional returns
  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role !== 'trainee') {
    return null;
  }

  const userSubmissions = submissions.filter((s: Submission) => s.userId === user.id);
  const completedSubmissions = userSubmissions.filter((s: Submission) => s.status === 'Completed');
  const evaluatedSubmissions = userSubmissions.filter((s: Submission) => s.evaluation);

  const averageScore = evaluatedSubmissions.length > 0 
    ? Math.round(evaluatedSubmissions.reduce((sum: number, s: Submission) => sum + (s.evaluation?.percentage || 0), 0) / evaluatedSubmissions.length)
    : 0;

  const handleViewFeedback = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsFeedbackModalOpen(true);
  };

  const exportSubmissions = () => {
    const exportData = userSubmissions.map((submission: Submission) => ({
      'Date': new Date(submission.submittedAt).toLocaleDateString(),
      'Session': submission.sessionTitle,
      'Status': submission.status,
      'Understanding': submission.overallUnderstanding,
      'Score': submission.evaluation?.percentage || 'Not Evaluated',
      'Grade': submission.evaluation?.grade || 'Not Evaluated',
      'Remarks': submission.remarks || 'None'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Submissions');

    const fileName = `my_test_submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Trainee Dashboard</h2>
        </div>

        {/* Tests Module */}
        {activeSection === "test" && (
          <div id="test">
            {/* Test Management */}
            <TestManagement userRole={user?.role || 'trainee'} />
          </div>
        )}

        {/* Q&A Module */}
        {activeSection === "qa" && (
          <div id="qa" className="mt-6">
            <QAModule currentUser={user} />
          </div>
        )}

        {/* History & Progress Module */}
        {activeSection === "history" && (
          <div id="history" className="space-y-6">
            {/* Progress Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <BookOpen className="text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{userSubmissions.length}</h3>
                      <p className="text-slate-600">Total Tests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{completedSubmissions.length}</h3>
                      <p className="text-slate-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Star className="text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{evaluatedSubmissions.length}</h3>
                      <p className="text-slate-600">Evaluated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <TrendingUp className="text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-slate-900">{averageScore}%</h3>
                      <p className="text-slate-600">Avg Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submission History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    My Test History
                  </CardTitle>
                  <Button
                    onClick={exportSubmissions}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export History
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSubmissions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading submissions...</p>
                  </div>
                ) : userSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No test submissions yet</p>
                    <p className="text-sm text-slate-500 mt-2">Complete your first test to see your history here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Session</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Understanding</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Score</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Grade</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {userSubmissions
                          .sort((a: Submission, b: Submission) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                          .map((submission: Submission) => (
                          <tr key={submission.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-slate-900">{submission.sessionTitle}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(submission.status)}>
                                {submission.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{submission.overallUnderstanding}</td>
                            <td className="px-4 py-3">
                              {submission.evaluation ? (
                                <span className="font-medium text-slate-900">
                                  {submission.evaluation.percentage}%
                                </span>
                              ) : (
                                <span className="text-slate-400">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {submission.evaluation ? (
                                <Badge className={getGradeColor(submission.evaluation.grade)}>
                                  {submission.evaluation.grade}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {submission.evaluation ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-blue-700"
                                  onClick={() => handleViewFeedback(submission)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Feedback
                                </Button>
                              ) : (
                                <span className="text-slate-400 text-sm">No feedback yet</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Others Module */}
        {activeSection === "others" && (
          <div id="others">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Additional Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Profile Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-600">Name: {user.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2 text-slate-500">@</span>
                        <span className="text-slate-600">Email: {user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-600">Role: Trainee</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={exportSubmissions}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export All Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.dispatchEvent(new CustomEvent('navigation-section-change', { detail: { section: 'history' } }))}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Progress Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Modal */}
        <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detailed Feedback</DialogTitle>
            </DialogHeader>
            {selectedSubmission && selectedSubmission.evaluation && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Overall Score</label>
                    <p className="text-2xl font-bold text-slate-900">{selectedSubmission.evaluation.percentage}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Grade</label>
                    <Badge className={`text-lg px-3 py-1 ${getGradeColor(selectedSubmission.evaluation.grade)}`}>
                      {selectedSubmission.evaluation.grade}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Understanding Level</label>
                    <p className="text-lg font-medium text-slate-900">{selectedSubmission.overallUnderstanding}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Question-wise Feedback</h4>
                  <div className="space-y-4">
                    {selectedSubmission.evaluation.questionFeedback?.map((feedback: any, index: number) => (
                      <Card key={index} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-slate-900">Question {index + 1}</h5>
                            <div className="text-right">
                              <span className="font-medium text-slate-900">{feedback.score}/5</span>
                              <p className="text-sm text-slate-600">points</p>
                            </div>
                          </div>
                          {feedback.feedback && (
                            <p className="text-slate-700 text-sm mt-2">{feedback.feedback}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedSubmission.evaluation.overallFeedback && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Overall Feedback</h4>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-slate-700">{selectedSubmission.evaluation.overallFeedback}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}