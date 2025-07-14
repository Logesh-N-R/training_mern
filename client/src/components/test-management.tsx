import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Edit, 
  Play,
  Save,
  Send,
  BookOpen,
  User
} from 'lucide-react';
import { ApiService } from '@/services/api';
import { TestForm } from '@/components/test-form';

interface TestQuestion {
  _id: string;
  date: string;
  sessionTitle: string;
  questions: any[];
  createdBy: string;
}

interface Submission {
  _id: string;
  questionSetId: string;
  date: string;
  sessionTitle: string;
  status: 'posted' | 'saved' | 'submitted' | 'evaluated';
  submittedAt?: string;
  evaluation?: any;
}

interface TestStatus {
  question: TestQuestion;
  submission?: Submission;
  status: 'not_started' | 'saved' | 'submitted' | 'evaluated';
  canEdit: boolean;
}

interface TestManagementProps {
  userRole: string;
}

export function TestManagement({ userRole }: TestManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTest, setSelectedTest] = useState<TestStatus | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => ApiService.get('/api/questions'),
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: userRole === 'trainee' ? ['/api/test-attempts/my'] : ['/api/test-attempts'],
    queryFn: () => ApiService.get(userRole === 'trainee' ? '/api/test-attempts/my' : '/api/test-attempts'),
  });

  // Process test statuses
  const testStatuses: TestStatus[] = questions.map((question: TestQuestion) => {
    const attempt = submissions.find((a: any) => 
          a.sessionId === question._id || 
          (question.sessionTitle && a.sessionTitle?.includes(question.sessionTitle))
        );

        let status = 'not_started';
        let canEdit = false;
        let submissionId = null;
        let score = null;
        let evaluation = null;

        if (attempt) {
          submissionId = attempt._id;
          if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
            status = attempt.status === 'evaluated' ? 'evaluated' : 'submitted';
            // Check if there's an evaluation for this attempt
            if (attempt.evaluation) {
              evaluation = attempt.evaluation;
              score = `${evaluation.percentage}% (${evaluation.grade})`;
            }
          } else if (attempt.status === 'in-progress') {
            status = 'saved';
            canEdit = true;
          }
        }

    return {
      question,
      submission: attempt,
      status,
      canEdit
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'saved':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'evaluated':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <AlertCircle className="w-4 h-4" />;
      case 'saved':
        return <Save className="w-4 h-4" />;
      case 'submitted':
        return <Send className="w-4 h-4" />;
      case 'evaluated':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleStartTest = (testStatus: TestStatus) => {
    setSelectedTest(testStatus);
    setIsViewMode(false);
    setIsTestModalOpen(true);
  };

  const handleViewTest = (testStatus: TestStatus) => {
    setSelectedTest(testStatus);
    setIsViewMode(true);
    setIsTestModalOpen(true);
  };

  const handleTestComplete = () => {
    setIsTestModalOpen(false);
    setSelectedTest(null);
    setIsViewMode(false);
    queryClient.invalidateQueries({ queryKey: ['/api/test-attempts/my'] });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loadingQuestions || (userRole === 'trainee' && isLoading)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading tests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Daily Training Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testStatuses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No tests available</p>
              <p className="text-sm text-slate-500 mt-2">Tests will appear here when they are posted</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Session Title</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Questions</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Score</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {testStatuses.map((testStatus) => (
                      <tr key={testStatus.question._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="text-slate-900">
                            {testStatus.question?.date ? formatDate(testStatus.question.date) : 'N/A'}
                          </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {testStatus.question.sessionTitle}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-600">
                            {testStatus.question.questions.length} questions
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getStatusColor(testStatus.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(testStatus.status)}
                            {testStatus.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {testStatus.submission?.evaluation ? (
                            <span className="font-medium text-slate-900">
                              {testStatus.submission.evaluation.percentage}%
                              <span className="text-slate-600 text-xs ml-1">
                                ({testStatus.submission.evaluation.grade})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            {userRole === 'trainee' && (
                              <>
                                {testStatus.status === 'not_started' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-blue-700"
                                    onClick={() => handleStartTest(testStatus)}
                                  >
                                    <Play className="w-4 h-4 mr-1" />
                                    Start
                                  </Button>
                                ) : testStatus.canEdit ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-blue-700"
                                    onClick={() => handleStartTest(testStatus)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Continue
                                  </Button>
                                ) : null}

                                {testStatus.submission && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-600 hover:text-slate-800"
                                    onClick={() => handleViewTest(testStatus)}
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {testStatuses.map((testStatus) => (
                  <Card key={testStatus.question._id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">
                            {testStatus.question.sessionTitle}
                          </h3>
                          <div className="flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {testStatus.question?.date ? formatDate(testStatus.question.date) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(testStatus.status)} flex items-center gap-1 ml-2 flex-shrink-0`}>
                          {getStatusIcon(testStatus.status)}
                          <span className="text-xs">
                            {testStatus.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Questions</p>
                          <p className="text-sm text-slate-900">{testStatus.question.questions.length}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Score</p>
                          {testStatus.submission?.evaluation ? (
                            <div>
                              <span className="text-sm font-medium text-slate-900">
                                {testStatus.submission.evaluation.percentage}%
                              </span>
                              <span className="text-xs text-slate-600 ml-1">
                                ({testStatus.submission.evaluation.grade})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </div>
                      </div>

                      {testStatus.submission?.submittedAt && (
                        <div className="flex items-center mb-4">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          <span className="text-xs text-slate-600">
                            Submitted: {new Date(testStatus.submission.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}

                      {userRole === 'trainee' && (
                        <div className="space-y-2">
                          {testStatus.status === 'not_started' ? (
                            <Button
                              className="w-full"
                              onClick={() => handleStartTest(testStatus)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Test
                            </Button>
                          ) : testStatus.canEdit ? (
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => handleStartTest(testStatus)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Continue Test
                            </Button>
                          ) : null}

                          {testStatus.submission && (
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => handleViewTest(testStatus)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Test
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Modal */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {selectedTest?.question.sessionTitle}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <TestForm 
              questionSet={{
                _id: selectedTest.question._id,
                date: selectedTest.question.date,
                sessionTitle: selectedTest.question.sessionTitle,
                questions: selectedTest.question.questions,
                createdBy: selectedTest.question.createdBy
              }}
              onSubmit={handleTestComplete}
              existingSubmission={selectedTest.submission}
              viewOnly={isViewMode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}