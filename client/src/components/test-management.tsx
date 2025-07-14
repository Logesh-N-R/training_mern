import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [testStatuses, setTestStatuses] = useState<TestStatus[]>([]);

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

  // Mutation for creating/updating test attempts
  const submitTestMutation = useMutation({
    mutationFn: (data: any) => ApiService.post('/api/test-attempts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-attempts/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
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
  useEffect(() => {
    if (!sessions.length) {
      setTestStatuses([]);
      return;
    }

    const processTestStatuses = async () => {
      const statuses: TestStatus[] = [];
      const processedSessionIds = new Set();

      for (const session of sessions) {
        // Prevent duplicates
        if (processedSessionIds.has(session._id)) {
          continue;
        }
        processedSessionIds.add(session._id);

        // Skip non-active sessions for trainees
        if (userRole === 'trainee' && session.status !== 'active') {
          continue;
        }

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
            // Check if test is still available (within time window)
            const now = new Date();
            const testDate = new Date(session.date);
            const [startHour, startMinute] = session.startTime.split(':').map(Number);
            const [endHour, endMinute] = session.endTime.split(':').map(Number);

            const startTime = new Date(testDate);
            startTime.setHours(startHour, startMinute, 0, 0);

            const endTime = new Date(testDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            // For trainees, only allow taking test if within time window
            if (userRole === 'trainee') {
              canTakeTest = now >= startTime && now <= endTime;
            } else {
              canTakeTest = true; // Admins can always take tests
            }
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

    submitTestMutation.mutate(attemptData);
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
            <div className="space-y-4">
              {testStatuses.map((testStatus) => (
                <Card key={testStatus.session._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {testStatus.session.title}
                        </h3>
                        {testStatus.session.description && (
                          <p className="text-sm text-slate-600 mb-3">
                            {testStatus.session.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(testStatus.session.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTime(testStatus.session.startTime)} - {formatTime(testStatus.session.endTime)}
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {testStatus.questions.length} questions
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {testStatus.session.duration} minutes
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getStatusColor(testStatus.status)} flex items-center gap-1`}>
                          {getStatusIcon(testStatus.status)}
                          {testStatus.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {testStatus.evaluation && (
                          <div className="text-right">
                            <div className="text-lg font-semibold text-slate-900">
                              {testStatus.evaluation.percentage}%
                            </div>
                            <Badge className={`${getGradeColor(testStatus.evaluation.grade)} text-xs`}>
                              {testStatus.evaluation.grade}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {testStatus.attempt?.submittedAt && (
                      <div className="flex items-center mb-4 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                        Submitted: {new Date(testStatus.attempt.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}

                    {userRole === 'trainee' && (
                      <div className="flex space-x-3">
                        {testStatus.canTakeTest && (
                          <Button
                            onClick={() => handleStartTest(testStatus)}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {testStatus.status === 'not_started' ? 'Start Test' : 'Continue Test'}
                          </Button>
                        )}
                        {testStatus.canViewResults && (
                          <Button
                            variant="outline"
                            onClick={() => handleViewResults(testStatus)}
                            className="flex-1"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Results
                          </Button>
                        )}
                      </div>
                    )}

                    {userRole !== 'trainee' && (
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => handleViewResults(testStatus)}
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
            <DialogDescription>
              {isViewMode ? 'Review your test submission and results' : 'Complete the test within the time limit'}
            </DialogDescription>
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