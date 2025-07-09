
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Calendar,
  Search,
  Eye,
  BarChart3,
  Award,
  Clock,
  User,
  BookOpen
} from 'lucide-react';
import { ApiService } from '@/services/api';
import { Submission, User as UserType } from '@shared/schema';

interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalTests: number;
  completedTests: number;
  evaluatedTests: number;
  averageScore: number;
  averageGrade: string;
  lastSubmission: string;
  submissions: Submission[];
}

interface UserTestsDashboardProps {
  userRole?: string;
}

export function UserTestsDashboard({ userRole }: UserTestsDashboardProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalTests');
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => ApiService.get('/api/submissions'),
  });

  const apiEndpoint = userRole === 'superadmin' ? '/api/users' : '/api/trainees';
  
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: [apiEndpoint],
    queryFn: () => ApiService.get(apiEndpoint),
  });

  const userStats = useMemo(() => {
    if (!submissions.length || !users.length) return [];

    const statsMap = new Map<string, UserStats>();

    // Initialize stats for all users
    users.forEach((user: UserType) => {
      if (user.role === 'trainee') {
        statsMap.set(user._id || user.id || '', {
          userId: user._id || user.id || '',
          userName: user.name,
          userEmail: user.email,
          totalTests: 0,
          completedTests: 0,
          evaluatedTests: 0,
          averageScore: 0,
          averageGrade: 'N/A',
          lastSubmission: 'Never',
          submissions: [],
        });
      }
    });

    // Aggregate submission data
    submissions.forEach((submission: any) => {
      const userId = submission.userId;
      const stats = statsMap.get(userId);
      
      if (stats) {
        stats.submissions.push(submission);
        stats.totalTests++;
        
        if (submission.status === 'Completed') {
          stats.completedTests++;
        }
        
        if (submission.evaluation) {
          stats.evaluatedTests++;
        }
        
        // Update last submission date
        const submissionDate = new Date(submission.submittedAt);
        if (stats.lastSubmission === 'Never' || submissionDate > new Date(stats.lastSubmission)) {
          stats.lastSubmission = submission.submittedAt;
        }
      }
    });

    // Calculate averages
    statsMap.forEach((stats) => {
      if (stats.evaluatedTests > 0) {
        const evaluatedSubmissions = stats.submissions.filter(s => s.evaluation);
        const totalScore = evaluatedSubmissions.reduce((sum, s) => sum + (s.evaluation?.percentage || 0), 0);
        stats.averageScore = Math.round(totalScore / evaluatedSubmissions.length);
        
        // Calculate average grade
        const grades = evaluatedSubmissions.map(s => s.evaluation?.grade || 'F');
        const gradePoints = grades.map(grade => {
          switch (grade) {
            case 'A+': return 4.3;
            case 'A': return 4.0;
            case 'B+': return 3.3;
            case 'B': return 3.0;
            case 'C+': return 2.3;
            case 'C': return 2.0;
            case 'D': return 1.0;
            default: return 0.0;
          }
        });
        
        const avgGradePoint = gradePoints.reduce((sum, point) => sum + point, 0) / gradePoints.length;
        if (avgGradePoint >= 4.0) stats.averageGrade = 'A';
        else if (avgGradePoint >= 3.3) stats.averageGrade = 'B+';
        else if (avgGradePoint >= 3.0) stats.averageGrade = 'B';
        else if (avgGradePoint >= 2.3) stats.averageGrade = 'C+';
        else if (avgGradePoint >= 2.0) stats.averageGrade = 'C';
        else if (avgGradePoint >= 1.0) stats.averageGrade = 'D';
        else stats.averageGrade = 'F';
      }
    });

    return Array.from(statsMap.values());
  }, [submissions, users]);

  const filteredAndSortedStats = useMemo(() => {
    let filtered = userStats.filter(stats =>
      stats.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stats.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'totalTests':
          return b.totalTests - a.totalTests;
        case 'averageScore':
          return b.averageScore - a.averageScore;
        case 'lastSubmission':
          if (a.lastSubmission === 'Never') return 1;
          if (b.lastSubmission === 'Never') return -1;
          return new Date(b.lastSubmission).getTime() - new Date(a.lastSubmission).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [userStats, searchTerm, sortBy]);

  const overallStats = useMemo(() => {
    const totalUsers = userStats.length;
    const activeUsers = userStats.filter(s => s.totalTests > 0).length;
    const totalSubmissions = userStats.reduce((sum, s) => sum + s.totalTests, 0);
    const totalEvaluated = userStats.reduce((sum, s) => sum + s.evaluatedTests, 0);
    const overallAverage = userStats.length > 0 
      ? Math.round(userStats.reduce((sum, s) => sum + s.averageScore, 0) / userStats.filter(s => s.averageScore > 0).length || 0)
      : 0;

    return {
      totalUsers,
      activeUsers,
      totalSubmissions,
      totalEvaluated,
      overallAverage,
    };
  }, [userStats]);

  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return dateString;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const handleViewDetails = (userStats: UserStats) => {
    setSelectedUser(userStats);
    setIsDetailModalOpen(true);
  };

  if (loadingSubmissions || loadingUsers) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-900">{overallStats.totalUsers}</h3>
                <p className="text-slate-600">Total Trainees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-900">{overallStats.activeUsers}</h3>
                <p className="text-slate-600">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <ClipboardCheck className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-900">{overallStats.totalSubmissions}</h3>
                <p className="text-slate-600">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Award className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-900">{overallStats.totalEvaluated}</h3>
                <p className="text-slate-600">Evaluated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <BarChart3 className="text-indigo-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-slate-900">{overallStats.overallAverage}%</h3>
                <p className="text-slate-600">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Tests Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              User Test Performance Dashboard
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="totalTests">Total Tests</SelectItem>
                  <SelectItem value="averageScore">Average Score</SelectItem>
                  <SelectItem value="lastSubmission">Last Submission</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedStats.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">User</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Total Tests</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Completed</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Evaluated</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Avg Score</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Avg Grade</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Last Submission</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAndSortedStats.map((userStat) => (
                    <tr key={userStat.userId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="p-2 bg-slate-100 rounded-full mr-3">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{userStat.userName}</div>
                            <div className="text-sm text-slate-600">{userStat.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{userStat.totalTests}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-green-600">{userStat.completedTests}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">{userStat.evaluatedTests}</span>
                      </td>
                      <td className="px-4 py-3">
                        {userStat.averageScore > 0 ? (
                          <span className="font-medium text-slate-900">{userStat.averageScore}%</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {userStat.averageGrade !== 'N/A' ? (
                          <Badge className={getGradeColor(userStat.averageGrade)}>
                            {userStat.averageGrade}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-slate-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(userStat.lastSubmission)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-blue-700"
                          onClick={() => handleViewDetails(userStat)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {selectedUser?.userName} - Test History
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-700">Total Tests</label>
                  <p className="text-2xl font-bold text-slate-900">{selectedUser.totalTests}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Completed</label>
                  <p className="text-2xl font-bold text-green-600">{selectedUser.completedTests}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Average Score</label>
                  <p className="text-2xl font-bold text-slate-900">{selectedUser.averageScore}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Average Grade</label>
                  <Badge className={`text-lg px-3 py-1 ${getGradeColor(selectedUser.averageGrade)}`}>
                    {selectedUser.averageGrade}
                  </Badge>
                </div>
              </div>

              {/* Submission History */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Submission History</h4>
                {selectedUser.submissions.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.submissions
                      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                      .map((submission, index) => (
                      <Card key={index} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium text-slate-900">{submission.sessionTitle}</h5>
                              <p className="text-sm text-slate-600">
                                {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              {submission.evaluation ? (
                                <div>
                                  <Badge className={getGradeColor(submission.evaluation.grade)}>
                                    {submission.evaluation.grade}
                                  </Badge>
                                  <p className="text-sm text-slate-600 mt-1">
                                    {submission.evaluation.percentage}%
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline">Not Evaluated</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-slate-600">
                            Understanding: <span className="font-medium">{submission.overallUnderstanding}</span>
                          </div>
                          {submission.remarks && (
                            <div className="text-sm text-slate-600 mt-1">
                              Remarks: <span className="italic">{submission.remarks}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
