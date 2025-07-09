import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { TestForm } from '@/components/test-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, CheckCircle, Eye, GraduationCap } from 'lucide-react';
import { ApiService } from '@/services/api';
import { Submission } from '@shared/schema';

export default function TraineeDashboard() {
  const { user } = useAuthRedirect();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
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

  const getUnderstandingColor = (understanding: string) => {
    switch (understanding.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
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

  const handleViewFeedback = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsFeedbackModalOpen(true);
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
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Past Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-slate-600">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Session</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Understanding</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Score</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Grade</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {submissions.map((submission: Submission) => (
                      <tr key={submission.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">{formatDate(submission.date)}</td>
                        <td className="px-4 py-3 text-slate-900">{submission.sessionTitle}</td>
                        <td className="px-4 py-3">
                          <Badge className={getUnderstandingColor(submission.overallUnderstanding)}>
                            {submission.overallUnderstanding}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {submission.evaluation ? (
                            <span className="font-medium text-slate-900">
                              {submission.evaluation.totalScore}/{submission.evaluation.maxScore}
                              <span className="text-slate-600 text-sm ml-1">
                                ({submission.evaluation.percentage}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">Not evaluated</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {submission.evaluation ? (
                            <Badge className={getGradeColor(submission.evaluation.grade)}>
                              {submission.evaluation.grade}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {submission.evaluation && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-blue-700"
                              onClick={() => handleViewFeedback(submission)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Feedback
                            </Button>
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

        {/* Feedback Modal */}
        <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Evaluation Feedback - {selectedSubmission?.sessionTitle}
              </DialogTitle>
            </DialogHeader>
            {selectedSubmission?.evaluation && (
              <div className="space-y-6">
                {/* Evaluation Summary */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-3">Overall Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Final Score</label>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedSubmission.evaluation.totalScore}/{selectedSubmission.evaluation.maxScore}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Percentage</label>
                      <p className="text-2xl font-bold text-slate-900">{selectedSubmission.evaluation.percentage}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Grade</label>
                      <Badge className={`text-lg px-3 py-1 ${getGradeColor(selectedSubmission.evaluation.grade)}`}>
                        {selectedSubmission.evaluation.grade}
                      </Badge>
                    </div>
                  </div>
                  {selectedSubmission.evaluation.overallFeedback && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700">Instructor's Overall Feedback</label>
                      <p className="text-slate-900 mt-1 p-3 bg-white rounded border">{selectedSubmission.evaluation.overallFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Question-by-Question Feedback */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Question-by-Question Feedback</h4>
                  <div className="space-y-4">
                    {selectedSubmission.questionAnswers.map((qa, index) => (
                      <Card key={index} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium text-slate-700">{qa.topic}</p>
                              <p className="text-sm text-slate-600">{qa.question}</p>
                            </div>
                            <Badge className={getGradeColor(qa.score && qa.score >= 8 ? 'A' : qa.score && qa.score >= 6 ? 'B' : 'C')}>
                              {qa.score || 0}/10
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-slate-700">Your Answer:</label>
                              <p className="text-slate-900 mt-1 p-2 bg-slate-50 rounded">{qa.answer}</p>
                            </div>
                            
                            {qa.feedback && (
                              <div>
                                <label className="text-xs font-medium text-slate-700">Instructor's Feedback:</label>
                                <p className="text-slate-900 mt-1 p-2 bg-blue-50 rounded border-l-4 border-blue-400">{qa.feedback}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-slate-600 text-center">
                  Evaluated on {new Date(selectedSubmission.evaluation.evaluatedAt).toLocaleDateString()} 
                  by {selectedSubmission.evaluation.evaluatedBy}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
