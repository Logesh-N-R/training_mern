
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
  Play,
  Send,
  BookOpen,
  User,
  Trophy,
  Star
} from 'lucide-react';
import { ApiService } from '@/services/api';
import { TestForm } from '@/components/test-form';

interface TestSession {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
}

interface TestQuestion {
  _id: string;
  sessionId: string;
  questionNumber: number;
  category: string;
  question: string;
  type: 'multiple-choice' | 'single-choice' | 'text-input' | 'essay' | 'true-false';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

interface TestAttempt {
  _id: string;
  sessionId: string;
  traineeId: string;
  startedAt: string;
  submittedAt?: string;
  status: 'in-progress' | 'submitted' | 'evaluated' | 'expired';
  answers: TestAnswer[];
  timeSpent: number;
}

interface TestAnswer {
  questionId: string;
  questionNumber: number;
  answer: string | number | string[];
  timeSpent: number;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
}

interface TestEvaluation {
  _id: string;
  attemptId: string;
  sessionId: string;
  traineeId: string;
  evaluatorId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  overallFeedback: string;
  questionFeedback?: string[];
  createdAt: string;
}

interface TestStatus {
  session: TestSession;
  questions: TestQuestion[];
  attempt?: TestAttempt;
  evaluation?: TestEvaluation;
  status: 'not_started' | 'in_progress' | 'submitted' | 'evaluated';
  canTakeTest: boolean;
  canViewResults: boolean;
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

  // Fetch test sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['/api/test-sessions'],
    queryFn: () => ApiService.get('/api/test-sessions'),
  });

  // Fetch test attempts for trainee
  const { data: attempts = [], isLoading: loadingAttempts } = useQuery({
    queryKey: ['/api/test-attempts/my'],
    queryFn: () => ApiService.get('/api/test-attempts/my'),
    enabled: userRole === 'trainee',
  });

  // Fetch test evaluations for trainee
  const { data: evaluations = [] } = useQuery({
    queryKey: ['/api/test-evaluations/my'],
    queryFn: () => ApiService.get('/api/test-evaluations/my'),
    enabled: userRole === 'trainee',
  });

  // Mutation for creating test attempts
  const createAttemptMutation = useMutation({
    mutationFn: (data: any) => ApiService.post('/api/test-attempts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-attempts/my'] });
      toast({
        title: "Success",
        description: "Test submitted successfully!",
      });
      setIsTestModalOpen(false);
      setSelectedTest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit test",
        variant: "destructive",
      });
    },
  });

  // Process test statuses
  const [testStatuses, setTestStatuses] = useState<TestStatus[]>([]);

  useEffect(() => {
    const processTestStatuses = async () => {
      if (!sessions.length) return;

      const statuses: TestStatus[] = [];

      for (const session of sessions) {
        // Skip non-active sessions for trainees
        if (userRole === 'trainee' && session.status !== 'active') continue;

        try {
          // Fetch questions for this session
          const questions = await ApiService.get(`/api/test-questions/${session._id}`);
          
          // Find attempt for this session
          const attempt = attempts.find((a: TestAttempt) => a.sessionId === session._id);
          
          // Find evaluation for this attempt
          const evaluation = attempt ? evaluations.find((e: TestEvaluation) => e.attemptId === attempt._id) : undefined;

          // Determine status
          let status: 'not_started' | 'in_progress' | 'submitted' | 'evaluated' = 'not_started';
          let canTakeTest = false;
          let canViewResults = false;

          if (attempt) {
            if (evaluation) {
              status = 'evaluated';
              canViewResults = true;
            } else if (attempt.status === 'submitted') {
              status = 'submitted';
              canViewResults = true;
            } else if (attempt.status === 'in-progress') {
              status = 'in_progress';
              canTakeTest = true;
              canViewResults = true;
            }
          } else {
            canTakeTest = true;
          }

          // Check if test is still available (within time window)
          const now = new Date();
          const testDate = new Date(session.date);
          const [startHour, startMinute] = session.startTime.split(':').map(Number);
          const [endHour, endMinute] = session.endTime.split(':').map(Number);
          
          const startTime = new Date(testDate);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          const endTime = new Date(testDate);
          endTime.setHours(endHour, endMinute, 0, 0);

          // For trainees, disable taking test if outside time window
          if (userRole === 'trainee' && (now < startTime || now > endTime) && !attempt) {
            canTakeTest = false;
          }

          statuses.push({
            session,
            questions,
            attempt,
            evaluation,
            status,
            canTakeTest,
            canViewResults,
          });
        } catch (error) {
          console.error(`Error processing session ${session._id}:`, error);
        }
      }

      setTestStatuses(statuses);
    };

    processTestStatuses();
  }, [sessions, attempts, evaluations, userRole]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
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
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'submitted':
        return <Send className="w-4 h-4" />;
      case 'evaluated':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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

  const handleStartTest = (testStatus: TestStatus) => {
    setSelectedTest(testStatus);
    setIsViewMode(false);
    setIsTestModalOpen(true);
  };

  const handleViewResults = (testStatus: TestStatus) => {
    setSelectedTest(testStatus);
    setIsViewMode(true);
    setIsTestModalOpen(true);
  };

  const handleTestSubmit = async (answers: TestAnswer[], timeSpent: number) => {
    if (!selectedTest) return;

    const attemptData = {
      sessionId: selectedTest.session._id,
      answers,
      timeSpent,
    };

    createAttemptMutation.mutate(attemptData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loadingSessions || (userRole === 'trainee' && loadingAttempts)) {
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
            {userRole === 'trainee' ? 'Available Tests' : 'Test Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testStatuses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No tests available</p>
              <p className="text-sm text-slate-500 mt-2">
                {userRole === 'trainee' 
                  ? 'Tests will appear here when they are posted' 
                  : 'Create test sessions to get started'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Test Session</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Date & Time</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Duration</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Questions</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Score</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {testStatuses.map((testStatus) => (
                      <tr key={testStatus.session._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-slate-900">
                              {testStatus.session.title}
                            </span>
                            {testStatus.session.description && (
                              <p className="text-xs text-slate-500 mt-1">
                                {testStatus.session.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            <div>
                              <span className="text-slate-900 block">
                                {formatDate(testStatus.session.date)}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatTime(testStatus.session.startTime)} - {formatTime(testStatus.session.endTime)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="text-slate-600">
                              {testStatus.session.duration} min
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-600">
                            {testStatus.questions.length} questions
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getStatusColor(testStatus.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(testStatus.status)}
                            {testStatus.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {testStatus.evaluation ? (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">
                                {testStatus.evaluation.percentage}%
                              </span>
                              <Badge className={`${getGradeColor(testStatus.evaluation.grade)} text-xs`}>
                                {testStatus.evaluation.grade}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            {userRole === 'trainee' && (
                              <>
                                {testStatus.canTakeTest && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-blue-700"
                                    onClick={() => handleStartTest(testStatus)}
                                  >
                                    <Play className="w-4 h-4 mr-1" />
                                    {testStatus.status === 'not_started' ? 'Start' : 'Continue'}
                                  </Button>
                                )}
                                {testStatus.canViewResults && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-600 hover:text-slate-800"
                                    onClick={() => handleViewResults(testStatus)}
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
                  <Card key={testStatus.session._id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">
                            {testStatus.session.title}
                          </h3>
                          {testStatus.session.description && (
                            <p className="text-xs text-slate-500 mt-1">
                              {testStatus.session.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {formatDate(testStatus.session.date)}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {formatTime(testStatus.session.startTime)} - {formatTime(testStatus.session.endTime)} ({testStatus.session.duration} min)
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
                          <p className="text-sm text-slate-900">{testStatus.questions.length}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Score</p>
                          {testStatus.evaluation ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium text-slate-900">
                                {testStatus.evaluation.percentage}%
                              </span>
                              <Badge className={`${getGradeColor(testStatus.evaluation.grade)} text-xs`}>
                                {testStatus.evaluation.grade}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </div>
                      </div>

                      {testStatus.attempt?.submittedAt && (
                        <div className="flex items-center mb-4">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                          <span className="text-xs text-slate-600">
                            Submitted: {new Date(testStatus.attempt.submittedAt).toLocaleDateString('en-US', {
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
                          {testStatus.canTakeTest && (
                            <Button
                              className="w-full"
                              onClick={() => handleStartTest(testStatus)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {testStatus.status === 'not_started' ? 'Start Test' : 'Continue Test'}
                            </Button>
                          )}
                          {testStatus.canViewResults && (
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={() => handleViewResults(testStatus)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Results
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
              {selectedTest?.session.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <TestForm 
              session={selectedTest.session}
              questions={selectedTest.questions}
              existingAttempt={selectedTest.attempt}
              existingEvaluation={selectedTest.evaluation}
              onSubmit={handleTestSubmit}
              viewOnly={isViewMode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
