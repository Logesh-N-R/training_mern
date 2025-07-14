
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/use-auth';
import { ApiService } from '../services/api';
import { TestForm } from './test-form';
import { Play, Clock, CheckCircle, Trophy, Eye, Calendar, Users, Timer, Award } from 'lucide-react';

interface TestSession {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdBy: string;
  createdAt: string;
}

interface TestQuestion {
  _id: string;
  sessionId: string;
  questionNumber: number;
  category: string;
  question: string;
  type: 'multiple-choice' | 'text-input' | 'true-false';
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
  status: 'in-progress' | 'submitted' | 'evaluated';
  answers: TestAnswer[];
  timeSpent: number;
}

interface TestAnswer {
  questionId: string;
  questionNumber: number;
  answer: string | number | string[];
  timeSpent: number;
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
  createdAt: string;
}

interface TestWithStatus {
  session: TestSession;
  attempt?: TestAttempt;
  evaluation?: TestEvaluation;
  status: 'available' | 'in_progress' | 'submitted' | 'evaluated' | 'expired';
  canTake: boolean;
  canView: boolean;
  questionsCount: number;
}

export function TestManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTest, setSelectedTest] = useState<TestWithStatus | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  // Fetch test sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['/api/test-sessions'],
    queryFn: () => ApiService.get('/api/test-sessions'),
  });

  // Fetch user's attempts (trainee only)
  const { data: attempts = [], isLoading: loadingAttempts } = useQuery({
    queryKey: ['/api/test-attempts/my'],
    queryFn: () => ApiService.get('/api/test-attempts/my'),
    enabled: user?.role === 'trainee',
  });

  // Fetch user's evaluations (trainee only)
  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ['/api/test-evaluations/my'],
    queryFn: () => ApiService.get('/api/test-evaluations/my'),
    enabled: user?.role === 'trainee',
  });

  // Process test data with status
  const [testsWithStatus, setTestsWithStatus] = useState<TestWithStatus[]>([]);

  useEffect(() => {
    const processTests = async () => {
      if (!sessions.length) {
        setTestsWithStatus([]);
        return;
      }

      const processed: TestWithStatus[] = [];

      for (const session of sessions) {
        try {
          // Get questions count
          const questions = await ApiService.get(`/api/test-questions/${session._id}`);
          const questionsCount = questions.length;

          // Skip sessions without questions
          if (questionsCount === 0) continue;

          // Find user's attempt for this session
          const attempt = attempts.find((a: TestAttempt) => a.sessionId === session._id);
          
          // Find evaluation for this attempt
          const evaluation = attempt ? evaluations.find((e: TestEvaluation) => e.attemptId === attempt._id) : undefined;

          // Determine status and permissions
          let status: 'available' | 'in_progress' | 'submitted' | 'evaluated' | 'expired' = 'available';
          let canTake = false;
          let canView = false;

          // Check time window
          const now = new Date();
          const testDate = new Date(session.date);
          const [startHour, startMinute] = session.startTime.split(':').map(Number);
          const [endHour, endMinute] = session.endTime.split(':').map(Number);
          
          const startTime = new Date(testDate);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          const endTime = new Date(testDate);
          endTime.setHours(endHour, endMinute, 0, 0);

          const isWithinTimeWindow = now >= startTime && now <= endTime;
          const isExpired = now > endTime;

          if (user?.role === 'trainee') {
            if (evaluation) {
              status = 'evaluated';
              canView = true;
            } else if (attempt?.status === 'submitted') {
              status = 'submitted';
              canView = true;
            } else if (attempt?.status === 'in-progress') {
              status = 'in_progress';
              canTake = isWithinTimeWindow;
              canView = true;
            } else if (isExpired) {
              status = 'expired';
            } else if (isWithinTimeWindow && session.status === 'active') {
              status = 'available';
              canTake = true;
            }
          } else {
            // Admin can always view
            canView = true;
            if (evaluation) {
              status = 'evaluated';
            } else if (attempt?.status === 'submitted') {
              status = 'submitted';
            } else if (attempt?.status === 'in-progress') {
              status = 'in_progress';
            }
          }

          processed.push({
            session,
            attempt,
            evaluation,
            status,
            canTake,
            canView,
            questionsCount,
          });
        } catch (error) {
          console.error(`Error processing session ${session._id}:`, error);
        }
      }

      setTestsWithStatus(processed);
    };

    processTests();
  }, [sessions, attempts, evaluations, user?.role]);

  // Start test mutation
  const startTestMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // Create or update attempt
      return ApiService.post('/api/test-attempts', {
        sessionId,
        answers: [],
        timeSpent: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-attempts/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-evaluations/my'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start test",
        variant: "destructive",
      });
    },
  });

  const handleStartTest = (test: TestWithStatus) => {
    setSelectedTest(test);
    setIsTestModalOpen(true);
  };

  const handleViewResults = (test: TestWithStatus) => {
    setSelectedTest(test);
    setIsResultsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      available: { variant: 'default' as const, color: 'bg-emerald-100 text-emerald-800', icon: Play },
      in_progress: { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800', icon: Clock },
      submitted: { variant: 'outline' as const, color: 'bg-amber-100 text-amber-800', icon: CheckCircle },
      evaluated: { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: Trophy },
      expired: { variant: 'destructive' as const, color: 'bg-gray-100 text-gray-800', icon: Clock },
    };

    const config = variants[status as keyof typeof variants] || variants.available;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getTimeInfo = (session: TestSession) => {
    const testDate = new Date(session.date).toLocaleDateString();
    return `${testDate} • ${session.startTime} - ${session.endTime}`;
  };

  const getScoreInfo = (evaluation?: TestEvaluation) => {
    if (!evaluation) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        <Award className="w-4 h-4 text-amber-500" />
        <span className="font-medium">{evaluation.grade}</span>
        <span className="text-muted-foreground">
          {evaluation.totalScore}/{evaluation.maxScore} ({evaluation.percentage}%)
        </span>
      </div>
    );
  };

  if (loadingSessions || loadingAttempts || loadingEvaluations) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const filteredTests = user?.role === 'trainee' 
    ? testsWithStatus.filter(t => t.session.status === 'active' || t.attempt)
    : testsWithStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {user?.role === 'trainee' ? 'My Tests' : 'Test Management'}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === 'trainee' 
              ? 'Take tests and view your results'
              : 'Manage test sessions and monitor progress'
            }
          </p>
        </div>
      </div>

      {/* Statistics */}
      {user?.role === 'trainee' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-xl font-bold">{testsWithStatus.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">
                    {testsWithStatus.filter(t => t.status === 'submitted' || t.status === 'evaluated').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Evaluated</p>
                  <p className="text-xl font-bold">
                    {testsWithStatus.filter(t => t.status === 'evaluated').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-xl font-bold">
                    {evaluations.length > 0 
                      ? Math.round(evaluations.reduce((sum: number, e: TestEvaluation) => sum + e.percentage, 0) / evaluations.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {user?.role === 'trainee' ? 'No tests available at the moment.' : 'No test sessions found.'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTests.map((test) => (
            <Card key={test.session._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{test.session.title}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    
                    {test.session.description && (
                      <p className="text-muted-foreground mb-3">{test.session.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {getTimeInfo(test.session)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {test.session.duration} minutes
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {test.questionsCount} questions
                      </div>
                    </div>

                    {test.evaluation && getScoreInfo(test.evaluation)}
                  </div>

                  <div className="flex gap-2">
                    {test.canTake && (
                      <Button onClick={() => handleStartTest(test)} className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {test.status === 'in_progress' ? 'Continue' : 'Start Test'}
                      </Button>
                    )}
                    
                    {test.canView && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewResults(test)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Results
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Test Modal */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTest?.session.title}</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <TestForm
              sessionId={selectedTest.session._id}
              existingAttempt={selectedTest.attempt}
              onClose={() => {
                setIsTestModalOpen(false);
                setSelectedTest(null);
              }}
              onSubmit={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/test-attempts/my'] });
                queryClient.invalidateQueries({ queryKey: ['/api/test-evaluations/my'] });
                setIsTestModalOpen(false);
                setSelectedTest(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Results - {selectedTest?.session.title}</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-6">
              {/* Test Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(selectedTest.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="font-medium">
                    {selectedTest.attempt?.submittedAt 
                      ? new Date(selectedTest.attempt.submittedAt).toLocaleString()
                      : 'Not submitted'}
                  </p>
                </div>
              </div>

              {/* Evaluation Results */}
              {selectedTest.evaluation && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Evaluation Results</h4>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className="text-2xl font-bold">
                        {selectedTest.evaluation.totalScore}/{selectedTest.evaluation.maxScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Percentage</p>
                      <p className="text-2xl font-bold">{selectedTest.evaluation.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="text-2xl font-bold">{selectedTest.evaluation.grade}</p>
                    </div>
                  </div>
                  
                  {selectedTest.evaluation.overallFeedback && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Overall Feedback</p>
                      <p className="p-3 bg-muted rounded-lg">{selectedTest.evaluation.overallFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Answers */}
              {selectedTest.attempt?.answers && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Your Answers</h4>
                  <div className="space-y-3">
                    {selectedTest.attempt.answers.map((answer, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Question {answer.questionNumber}</p>
                        <p className="font-medium">
                          {Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
