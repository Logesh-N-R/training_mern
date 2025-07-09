import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api';
import { MessageCircle, Send, Shield, User, Clock } from 'lucide-react';

interface Question {
  _id: string;
  title: string;
  content: string;
  askedBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  answers: Answer[];
}

interface Answer {
  _id: string;
  content: string;
  answeredBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface QAModuleProps {
  currentUser: any;
}

export function QAModule({ currentUser }: QAModuleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [answerContent, setAnswerContent] = useState('');

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/qa/questions'],
    queryFn: () => ApiService.get('/api/qa/questions'),
  });

  const questionForm = useForm({
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const askQuestionMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => 
      ApiService.post('/api/qa/questions', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Question posted successfully',
      });
      questionForm.reset();
      setIsAskingQuestion(false);
      queryClient.invalidateQueries({ queryKey: ['/api/qa/questions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to post question',
        variant: 'destructive',
      });
    },
  });

  const answerQuestionMutation = useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      ApiService.post(`/api/qa/questions/${questionId}/answers`, { content }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Answer posted successfully',
      });
      setAnswerContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/qa/questions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to post answer',
        variant: 'destructive',
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'trainee':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' || role === 'superadmin' ? Shield : User;
  };

  const onSubmitQuestion = (data: { title: string; content: string }) => {
    askQuestionMutation.mutate(data);
  };

  const handleAnswerSubmit = (questionId: string) => {
    if (!answerContent.trim()) return;
    answerQuestionMutation.mutate({ questionId, content: answerContent });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Q&A Community
          </CardTitle>
          <Button
            onClick={() => setIsAskingQuestion(true)}
            size="sm"
            className="bg-primary hover:bg-blue-700"
          >
            Ask Question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Ask Question Form */}
        {isAskingQuestion && (
          <Card className="mb-6 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Ask a Question</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-4">
                <div>
                  <Input
                    placeholder="Question title..."
                    {...questionForm.register('title', { required: true })}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Describe your question in detail..."
                    rows={4}
                    {...questionForm.register('content', { required: true })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={askQuestionMutation.isPending}
                    className="bg-primary hover:bg-blue-700"
                  >
                    {askQuestionMutation.isPending ? 'Posting...' : 'Post Question'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAskingQuestion(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No questions yet</p>
            <p className="text-sm text-slate-500 mt-2">Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question: Question) => (
              <Card key={question._id} className="border border-slate-200">
                <CardContent className="p-4">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {question.askedBy.name ? question.askedBy.name.split(' ').map(n => n[0]).join('') : ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{question.askedBy.name || 'Anonymous'}</span>
                          <Badge className={getRoleColor(question.askedBy.role)}>
                            {question.askedBy.role}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(question.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">{question.title}</h4>
                    <p className="text-slate-700 text-sm">{question.content}</p>
                  </div>

                  {/* Answers */}
                  {question.answers && question.answers.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <h5 className="font-medium text-slate-700 text-sm">
                        Answers ({question.answers.length})
                      </h5>
                      {question.answers.map((answer: Answer) => {
                        const isAdminAnswer = answer.answeredBy.role === 'admin' || answer.answeredBy.role === 'superadmin';
                        const RoleIcon = getRoleIcon(answer.answeredBy.role);

                        return (
                          <div
                            key={answer._id}
                            className={`p-3 rounded-lg border-l-4 ${
                              isAdminAnswer 
                                ? 'bg-red-50 border-l-red-400' 
                                : 'bg-slate-50 border-l-slate-400'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {answer.answeredBy.name ? answer.answeredBy.name.split(' ').map(n => n[0]).join('') : ''}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{answer.answeredBy.name || 'Anonymous'}</span>
                              <Badge className={getRoleColor(answer.answeredBy.role)}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {answer.answeredBy.role}
                              </Badge>
                              {isAdminAnswer && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  Official Response
                                </Badge>
                              )}
                              <span className="text-xs text-slate-500 ml-auto">
                                {formatDate(answer.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-700 text-sm">{answer.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer Form */}
                  <div className="border-t pt-3">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Write your answer..."
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleAnswerSubmit(question._id)}
                        disabled={!answerContent.trim() || answerQuestionMutation.isPending}
                        size="sm"
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}