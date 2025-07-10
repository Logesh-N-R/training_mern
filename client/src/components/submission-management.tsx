import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Trash2, Search, Calendar, User, Clock, Star, GraduationCap, FileSpreadsheet } from 'lucide-react';
import { ApiService } from '@/services/api';
import { Submission, User as UserType } from '@shared/schema';
import { SubmissionEvaluation } from '@/components/submission-evaluation';
import * as XLSX from 'xlsx';

const updateSubmissionSchema = z.object({
  overallUnderstanding: z.string().min(1, 'Understanding level is required'),
  status: z.string().min(1, 'Status is required'),
  remarks: z.string().optional(),
});

type UpdateSubmissionData = z.infer<typeof updateSubmissionSchema>;

interface SubmissionManagementProps {
  userRole: 'admin' | 'superadmin';
}

export function SubmissionManagement({ userRole }: SubmissionManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
    queryFn: () => ApiService.get('/api/submissions'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => ApiService.get('/api/users'),
    enabled: userRole === 'superadmin',
  });

  const { data: trainees = [] } = useQuery({
    queryKey: ['/api/trainees'],
    queryFn: () => ApiService.get('/api/trainees'),
    enabled: userRole === 'admin',
  });

  const form = useForm<UpdateSubmissionData>({
    resolver: zodResolver(updateSubmissionSchema),
    defaultValues: {
      overallUnderstanding: '',
      status: '',
      remarks: '',
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: (data: { id: string; updates: UpdateSubmissionData }) =>
      ApiService.put(`/api/submissions/${data.id}`, data.updates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      setIsEditModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update submission",
        variant: "destructive",
      });
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (submissionId: string) => ApiService.delete(`/api/submissions/${submissionId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete submission",
        variant: "destructive",
      });
    },
  });

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
  };

  const handleEditSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    form.setValue('overallUnderstanding', submission.overallUnderstanding);
    form.setValue('status', submission.status);
    form.setValue('remarks', submission.remarks || '');
    setIsEditModalOpen(true);
  };

  const handleDeleteSubmission = (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      deleteSubmissionMutation.mutate(submissionId);
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

  const onSubmit = (data: UpdateSubmissionData) => {
    if (selectedSubmission) {
      updateSubmissionMutation.mutate({
        id: selectedSubmission.id,
        updates: data,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'evaluated':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'not started':
        return 'bg-gray-100 text-gray-800';
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

  const getUserName = (userId: string) => {
    const allUsers = userRole === 'superadmin' ? users : trainees;
    const user = allUsers.find((u: UserType) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const filteredSubmissions = submissions.filter((submission: Submission) => {
    // Only show submitted or evaluated submissions for evaluation
    const isEvaluable = submission.status === 'submitted' || submission.status === 'evaluated' || submission.evaluation;
    
    const userName = getUserName(submission.userId).toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) ||
                         submission.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesDate = dateFilter === 'all' || submission.date === dateFilter;

    return isEvaluable && matchesSearch && matchesStatus && matchesDate;
  });

  const uniqueDates = [...new Set(submissions.map((s: Submission) => s.date))].sort().reverse();

    const handleEvaluateSubmission = (submission: Submission) => {
      setSelectedSubmission(submission);
      setIsEvaluationModalOpen(true);
    };

    const exportToExcel = () => {
      const exportData = filteredSubmissions.map((submission: Submission) => ({
        'Trainee': getUserName(submission.userId),
        'Session': submission.sessionTitle,
        'Date': new Date(submission.date).toLocaleDateString(),
        'Understanding': submission.overallUnderstanding,
        'Score': submission.evaluation ? `${submission.evaluation.totalScore}/${submission.evaluation.maxScore} (${submission.evaluation.percentage}%)` : 'Not evaluated',
        'Grade': submission.evaluation ? submission.evaluation.grade : '-',
        'Status': submission.status,
        'Submitted At': new Date(submission.submittedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        'Remarks': submission.remarks || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Submissions');

      const fileName = `test_submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Test Submission Management
          </CardTitle>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or session..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="not started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingSubmissions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No submissions found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Trainee</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Session</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Understanding</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Grade</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSubmissions.map((submission: Submission) => (
                    <tr key={submission.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="text-slate-900">{getUserName(submission.userId)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-900">{submission.sessionTitle}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="text-slate-600">
                            {new Date(submission.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
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
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-blue-700"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {(userRole === 'admin' || userRole === 'superadmin') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleEvaluateSubmission(submission)}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              {submission.evaluation ? 'Re-evaluate' : 'Evaluate'}
                            </Button>
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
              {filteredSubmissions.map((submission: Submission) => (
                <Card key={submission.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="p-2 bg-slate-100 rounded-full mr-3 flex-shrink-0">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-slate-900 truncate">{getUserName(submission.userId)}</h3>
                          <p className="text-sm text-slate-600 truncate">{submission.sessionTitle}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-blue-700 p-2"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(userRole === 'admin' || userRole === 'superadmin') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 p-2"
                            onClick={() => handleEvaluateSubmission(submission)}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Date</p>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {new Date(submission.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Understanding</p>
                        <Badge className={`text-xs ${getUnderstandingColor(submission.overallUnderstanding)}`}>
                          {submission.overallUnderstanding}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Score</p>
                        {submission.evaluation ? (
                          <div>
                            <span className="font-medium text-slate-900 text-sm">
                              {submission.evaluation.totalScore}/{submission.evaluation.maxScore}
                            </span>
                            <span className="text-slate-600 text-xs ml-1">
                              ({submission.evaluation.percentage}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Not evaluated</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Grade</p>
                        {submission.evaluation ? (
                          <Badge className={`text-xs ${getGradeColor(submission.evaluation.grade)}`}>
                            {submission.evaluation.grade}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* View Submission Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Trainee</label>
                    <p className="text-slate-900">
                      {users.find((u: UserType) => u.id === selectedSubmission.userId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Session</label>
                    <p className="text-slate-900">{selectedSubmission.sessionTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Date</label>
                    <p className="text-slate-900">{new Date(selectedSubmission.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Understanding</label>
                    <p className="text-slate-900">{selectedSubmission.overallUnderstanding}</p>
                  </div>
                </div>

                {/* Evaluation Summary */}
                {selectedSubmission.evaluation && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Evaluation Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Score</label>
                        <p className="text-lg font-bold text-slate-900">
                          {selectedSubmission.evaluation.totalScore}/{selectedSubmission.evaluation.maxScore}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Percentage</label>
                        <p className="text-lg font-bold text-slate-900">{selectedSubmission.evaluation.percentage}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Grade</label>
                        <Badge className={getGradeColor(selectedSubmission.evaluation.grade)}>
                          {selectedSubmission.evaluation.grade}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Evaluated By</label>
                        <p className="text-slate-900">{selectedSubmission.evaluation.evaluatedBy}</p>
                      </div>
                    </div>
                    {selectedSubmission.evaluation.overallFeedback && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-slate-700">Overall Feedback</label>
                        <p className="text-slate-900 mt-1">{selectedSubmission.evaluation.overallFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700">Questions & Answers</label>
                  <div className="space-y-3 mt-2">
                    {selectedSubmission.questionAnswers.map((qa, index) => (
                      <div className="p-4 border border-slate-200 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-slate-700">{qa.topic}</p>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {qa.type === 'text' ? 'Text' : 
                                 qa.type === 'multiple-choice' ? 'Multiple Choice' :
                                 qa.type === 'choose-best' ? 'Choose Best' :
                                 qa.type === 'true-false' ? 'True/False' :
                                 qa.type === 'fill-blank' ? 'Fill Blank' : 'Text'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{qa.question}</p>
                          </div>
                          {qa.score !== undefined && (
                            <Badge className={getGradeColor(qa.score >= 8 ? 'A' : qa.score >= 6 ? 'B' : 'C')}>
                              {qa.score}/10
                            </Badge>
                          )}
                        </div>

                        {qa.options && qa.options.length > 0 && (
                          <div className="mt-2">
                            <label className="text-xs font-medium text-slate-700">Options:</label>
                            <div className="mt-1 space-y-1">
                              {qa.options.map((option: string, optIdx: number) => (
                                <div key={optIdx} className="text-xs text-slate-600 ml-2">
                                  • {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {qa.correctAnswer && (
                          <div className="mt-2">
                            <label className="text-xs font-medium text-green-700">Correct Answer:</label>
                            <p className="text-green-800 text-sm mt-1 font-medium">{qa.correctAnswer}</p>
                          </div>
                        )}

                        <div className="mt-2">
                          <label className="text-xs font-medium text-slate-700">Student's Answer:</label>
                          <p className="text-slate-900 mt-1">{qa.answer}</p>
                        </div>
                        {qa.feedback && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded">
                            <label className="text-xs font-medium text-slate-700">Feedback:</label>
                            <p className="text-slate-900 text-sm mt-1">{qa.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSubmission.remarks && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Trainee Remarks</label>
                    <p className="text-slate-900">{selectedSubmission.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Submission Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Submission</DialogTitle>
            </DialogHeader>
            {selectedSubmission && (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="overallUnderstanding">Overall Understanding</Label>
                  <Select onValueChange={(value) => form.setValue('overallUnderstanding', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select understanding level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.overallUnderstanding && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.overallUnderstanding.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => form.setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.status.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    rows={3}
                    placeholder="Additional comments..."
                    className="resize-none"
                    {...form.register('remarks')}
                  />
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateSubmissionMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {updateSubmissionMutation.isPending ? 'Updating...' : 'Update Submission'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Evaluation Modal */}
        {selectedSubmission && (
          <SubmissionEvaluation
            submission={selectedSubmission}
            isOpen={isEvaluationModalOpen}
            onClose={() => setIsEvaluationModalOpen(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}