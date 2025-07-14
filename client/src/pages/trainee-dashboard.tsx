
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useAuthRedirect } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { QAModule } from '@/components/qa-module';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Play,
  Eye,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  BarChart3,
  User,
  Sparkles
} from 'lucide-react';
import { ApiService } from '@/services/api';
import { TestSession, TestAttempt, TestEvaluation } from '@shared/schema';

export default function TraineeDashboard() {
  const { user, isLoading } = useAuthRedirect();
  const [activeSection, setActiveSection] = useState("tests");
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<TestEvaluation | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail.section || "tests");
    };

    window.addEventListener('navigation-section-change', handleSectionChange as EventListener);
    return () => window.removeEventListener('navigation-section-change', handleSectionChange as EventListener);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-3 text-teal-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'trainee') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/test-sessions'],
    queryFn: () => ApiService.get('/api/test-sessions'),
  });

  const { data: myAttempts = [] } = useQuery({
    queryKey: ['/api/test-attempts/my'],
    queryFn: () => ApiService.get('/api/test-attempts/my'),
  });

  const { data: myEvaluations = [] } = useQuery({
    queryKey: ['/api/test-evaluations/my'],
    queryFn: () => ApiService.get('/api/test-evaluations/my'),
  });

  // Filter active sessions that trainee can take
  const availableSessions = sessions.filter((session: TestSession) => {
    // Only show sessions that don't have attempts yet
    const hasAttempt = myAttempts.some((a: TestAttempt) => a.sessionId.toString() === session._id?.toString());
    return session.status === 'active' && !hasAttempt;
  });
  
  // Get sessions with attempts
  const sessionsWithAttempts = sessions.map((session: TestSession) => {
    const attempt = myAttempts.find((a: TestAttempt) => {
      const sessionId = typeof a.sessionId === 'string' ? a.sessionId : a.sessionId.toString();
      const currentSessionId = typeof session._id === 'string' ? session._id : session._id?.toString();
      return sessionId === currentSessionId;
    });
    const evaluation = attempt ? myEvaluations.find((e: TestEvaluation) => {
      const attemptId = typeof e.attemptId === 'string' ? e.attemptId : e.attemptId.toString();
      const currentAttemptId = typeof attempt._id === 'string' ? attempt._id : attempt._id?.toString();
      return attemptId === currentAttemptId;
    }) : null;
    
    let status = 'available';
    if (evaluation) {
      status = 'evaluated';
    } else if (attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated')) {
      status = 'submitted';
    } else if (attempt) {
      status = 'in-progress';
    }
    
    return {
      session,
      attempt,
      evaluation,
      status
    };
  });

  // Statistics
  const totalAttempts = myAttempts.length;
  const submittedAttempts = myAttempts.filter(a => a.status === 'submitted' || a.status === 'evaluated').length;
  const evaluatedAttempts = myEvaluations.length;
  const averageScore = evaluatedAttempts > 0 
    ? Math.round(myEvaluations.reduce((sum: number, e: TestEvaluation) => sum + e.percentage, 0) / evaluatedAttempts)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'evaluated':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Play className="w-3 h-3" />;
      case 'in-progress':
        return <Clock className="w-3 h-3" />;
      case 'submitted':
        return <CheckCircle className="w-3 h-3" />;
      case 'evaluated':
        return <Trophy className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'B+':
      case 'B':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'C+':
      case 'C':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'D':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleStartTest = (session: TestSession) => {
    // This would open the test taking interface
    console.log('Starting test for session:', session.title);
  };

  const handleViewEvaluation = (evaluation: TestEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEvaluationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name}!</h1>
              <p className="text-teal-700">Ready to continue your learning journey?</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-teal-200 rounded-full">
                  <BookOpen className="text-teal-700 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-teal-900">{totalAttempts}</h3>
                  <p className="text-teal-700 font-medium">Total Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-emerald-200 rounded-full">
                  <CheckCircle className="text-emerald-700 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-emerald-900">{submittedAttempts}</h3>
                  <p className="text-emerald-700 font-medium">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-200 rounded-full">
                  <Trophy className="text-amber-700 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-amber-900">{evaluatedAttempts}</h3>
                  <p className="text-amber-700 font-medium">Evaluated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-200 rounded-full">
                  <TrendingUp className="text-purple-700 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-purple-900">{averageScore}%</h3>
                  <p className="text-purple-700 font-medium">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests Module */}
        {activeSection === "tests" && (
          <div className="space-y-8">
            {/* Available Tests */}
            <Card className="border-teal-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200">
                <CardTitle className="flex items-center text-teal-900">
                  <Target className="w-5 h-5 mr-2 text-teal-600" />
                  Available Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {availableSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-teal-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-teal-900 mb-2">No Active Tests</h3>
                    <p className="text-teal-600">Check back later for new test sessions</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableSessions.map((session: TestSession) => (
                        <Card key={session._id?.toString()} className="border-2 border-teal-100 hover:border-teal-300 transition-all duration-200 bg-gradient-to-br from-white to-teal-50">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold text-slate-900 text-lg mb-2">{session.title}</h3>
                                {session.description && (
                                  <p className="text-slate-600 text-sm">{session.description}</p>
                                )}
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center text-slate-600">
                                  <Calendar className="w-4 h-4 mr-2 text-teal-500" />
                                  {new Date(session.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-slate-600">
                                  <Clock className="w-4 h-4 mr-2 text-teal-500" />
                                  {session.duration} minutes
                                </div>
                                <div className="flex items-center text-slate-600">
                                  <Target className="w-4 h-4 mr-2 text-teal-500" />
                                  {session.startTime} - {session.endTime}
                                </div>
                              </div>

                              <Button
                                onClick={() => handleStartTest(session)}
                                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Test
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test History */}
            <Card className="border-emerald-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
                <CardTitle className="flex items-center text-emerald-900">
                  <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
                  My Test History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {sessionsWithAttempts.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-emerald-900 mb-2">No Test History</h3>
                    <p className="text-emerald-600">Your completed tests will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionsWithAttempts
                      .filter(item => item.attempt)
                      .sort((a, b) => new Date(b.attempt!.startedAt).getTime() - new Date(a.attempt!.startedAt).getTime())
                      .map((item) => (
                        <Card key={item.session._id?.toString()} className="border border-slate-200 hover:border-emerald-300 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-slate-900">{item.session.title}</h3>
                                  <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                                    {getStatusIcon(item.status)}
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-slate-500">Date Taken</p>
                                    <p className="font-medium text-slate-900">
                                      {new Date(item.attempt!.startedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Time Spent</p>
                                    <p className="font-medium text-slate-900">{item.attempt!.timeSpent} min</p>
                                  </div>
                                  {item.evaluation && (
                                    <>
                                      <div>
                                        <p className="text-slate-500">Score</p>
                                        <p className="font-bold text-emerald-700">{item.evaluation.percentage}%</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">Grade</p>
                                        <Badge className={getGradeColor(item.evaluation.grade)}>
                                          {item.evaluation.grade}
                                        </Badge>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {item.evaluation && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewEvaluation(item.evaluation!)}
                                  className="ml-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Q&A Module */}
        {activeSection === "qa" && (
          <div className="mt-6">
            <QAModule currentUser={user} />
          </div>
        )}

        {/* Performance Module */}
        {activeSection === "performance" && (
          <Card className="border-purple-200 bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
              <CardTitle className="flex items-center text-purple-900">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-purple-900 mb-2">Performance Analytics</h3>
                <p className="text-purple-600">Detailed performance analytics coming soon!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evaluation Details Modal */}
        <Dialog open={isEvaluationModalOpen} onOpenChange={setIsEvaluationModalOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-emerald-900">
                <Trophy className="w-5 h-5 mr-2" />
                Test Evaluation Details
              </DialogTitle>
            </DialogHeader>
            {selectedEvaluation && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700">Overall Score</p>
                    <p className="text-3xl font-bold text-emerald-900">{selectedEvaluation.percentage}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700">Grade</p>
                    <Badge className={`text-lg px-3 py-1 ${getGradeColor(selectedEvaluation.grade)}`}>
                      {selectedEvaluation.grade}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700">Points Earned</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {selectedEvaluation.totalPoints}/{selectedEvaluation.maxPoints}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700">Evaluated Date</p>
                    <p className="text-sm font-medium text-emerald-900">
                      {new Date(selectedEvaluation.evaluatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedEvaluation.overallFeedback && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-900 mb-2">Overall Feedback</h4>
                    <p className="text-slate-700">{selectedEvaluation.overallFeedback}</p>
                  </div>
                )}

                {selectedEvaluation.strengths.length > 0 && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-900 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                      {selectedEvaluation.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedEvaluation.improvements.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-900 mb-2">Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {selectedEvaluation.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Question-wise Performance</h4>
                  <div className="space-y-3">
                    {selectedEvaluation.questionEvaluations.map((qe, index) => (
                      <Card key={index} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-slate-900">Question {qe.questionNumber}</h5>
                            <div className="text-right">
                              <span className={`font-bold ${qe.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                {qe.pointsAwarded}/{qe.maxPoints} points
                              </span>
                              {qe.isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600 ml-2 inline" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 ml-2 inline" />
                              )}
                            </div>
                          </div>
                          {qe.feedback && (
                            <p className="text-slate-700 text-sm mt-2">{qe.feedback}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
