
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
import { MessageCircle, Send, Shield, User, Clock, Plus, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
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

  const onSubmitQuestion = (data: { title: string; content: string }) => {
    askQuestionMutation.mutate(data);
  };

  const handleAnswerSubmit = (questionId: string) => {
    if (!answerContent.trim()) return;
    answerQuestionMutation.mutate({ questionId, content: answerContent });
  };

  // Mobile Question Detail View
  if (isMobile && selectedQuestion) {
    return (
      <Card className="h-[calc(100vh-200px)] flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b bg-primary text-white">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedQuestion(null)}
              className="text-white hover:bg-white/20 p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{selectedQuestion.title}</h3>
              <p className="text-xs text-white/80">
                by {selectedQuestion.askedBy.name}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="p-4 space-y-4">
            {/* Original Question */}
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary text-white">
                  {selectedQuestion.askedBy.name?.split(' ').map(n => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-slate-100 rounded-2xl rounded-tl-md p-3">
                  <p className="text-sm text-slate-800">{selectedQuestion.content}</p>
                </div>
                <div className="flex items-center mt-1 text-xs text-slate-500">
                  <span>{formatDate(selectedQuestion.createdAt)}</span>
                  <Badge className={`ml-2 text-xs ${getRoleColor(selectedQuestion.askedBy.role)}`}>
                    {selectedQuestion.askedBy.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Answers */}
            {selectedQuestion.answers?.map((answer: Answer) => {
              const isOwnMessage = answer.answeredBy.id === currentUser?.id;
              const isAdminAnswer = answer.answeredBy.role === 'admin' || answer.answeredBy.role === 'superadmin';

              return (
                <div
                  key={answer._id}
                  className={`flex space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs ${isAdminAnswer ? 'bg-red-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {answer.answeredBy.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`rounded-2xl p-3 ${
                        isOwnMessage
                          ? 'bg-primary text-white rounded-tr-md'
                          : isAdminAnswer
                          ? 'bg-red-50 border border-red-200 rounded-tl-md'
                          : 'bg-slate-100 rounded-tl-md'
                      }`}
                    >
                      <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-slate-800'}`}>
                        {answer.content}
                      </p>
                    </div>
                    <div className={`flex items-center mt-1 text-xs text-slate-500 ${isOwnMessage ? 'justify-end' : ''}`}>
                      <span>{formatDate(answer.createdAt)}</span>
                      {!isOwnMessage && (
                        <>
                          <span className="mx-1">•</span>
                          <Badge className={`text-xs ${getRoleColor(answer.answeredBy.role)}`}>
                            {answer.answeredBy.role}
                          </Badge>
                          {isAdminAnswer && (
                            <Badge className="ml-1 bg-yellow-100 text-yellow-800 text-xs">
                              Official
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t bg-white p-3">
          <div className="flex items-end space-x-2">
            <Textarea
              placeholder="Type your answer..."
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] rounded-full border-slate-300 focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnswerSubmit(selectedQuestion._id);
                }
              }}
            />
            <Button
              onClick={() => handleAnswerSubmit(selectedQuestion._id)}
              disabled={!answerContent.trim() || answerQuestionMutation.isPending}
              size="sm"
              className="rounded-full w-10 h-10 p-0 bg-primary hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Main Q&A View
  return (
    <Card className={isMobile ? "h-[calc(100vh-200px)] flex flex-col" : ""}>
      <CardHeader className={`${isMobile ? 'flex-shrink-0 border-b bg-primary text-white' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center ${isMobile ? 'text-white' : ''}`}>
            <MessageCircle className="w-5 h-5 mr-2" />
            Q&A Community
          </CardTitle>
          <Button
            onClick={() => setIsAskingQuestion(true)}
            size="sm"
            className={`${isMobile ? 'bg-white text-primary hover:bg-slate-100' : 'bg-primary hover:bg-blue-700'}`}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isMobile ? '' : 'Ask Question'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className={`${isMobile ? 'flex-1 overflow-y-auto p-0' : ''}`}>
        {/* Ask Question Form */}
        {isAskingQuestion && (
          <div className={`${isMobile ? 'fixed inset-0 z-50 bg-white' : 'mb-6'}`}>
            <Card className={`${isMobile ? 'h-full rounded-none' : 'border-2 border-blue-200'}`}>
              <CardHeader className={`${isMobile ? 'bg-primary text-white' : ''}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`${isMobile ? 'text-lg text-white' : 'text-lg'}`}>
                    Ask a Question
                  </CardTitle>
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAskingQuestion(false)}
                      className="text-white hover:bg-white/20"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className={`${isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
                <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Question title..."
                      {...questionForm.register('title', { required: true })}
                      className={`${isMobile ? 'h-12' : ''}`}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Describe your question in detail..."
                      rows={isMobile ? 6 : 4}
                      {...questionForm.register('content', { required: true })}
                    />
                  </div>
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} space-${isMobile ? 'y' : 'x'}-2`}>
                    <Button
                      type="submit"
                      disabled={askQuestionMutation.isPending}
                      className={`bg-primary hover:bg-blue-700 ${isMobile ? 'h-12' : ''}`}
                    >
                      {askQuestionMutation.isPending ? 'Posting...' : 'Post Question'}
                    </Button>
                    {!isMobile && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAskingQuestion(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions List */}
        <div className={`${isMobile ? 'p-0' : ''}`}>
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
            <div className={`${isMobile ? 'divide-y divide-slate-200' : 'space-y-4'}`}>
              {questions.map((question: Question) => (
                <div
                  key={question._id}
                  className={`${
                    isMobile
                      ? 'p-4 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors'
                      : ''
                  }`}
                  onClick={() => isMobile && setSelectedQuestion(question)}
                >
                  {isMobile ? (
                    // Mobile List Item
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-white">
                          {question.askedBy.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900 truncate pr-2">
                            {question.title}
                          </h4>
                          <div className="flex items-center text-xs text-slate-500 flex-shrink-0">
                            <span>{formatDate(question.createdAt)}</span>
                            {question.answers?.length > 0 && (
                              <span className="ml-2 bg-primary text-white rounded-full px-2 py-0.5 text-xs">
                                {question.answers.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-1">
                          {question.content}
                        </p>
                        <div className="flex items-center mt-2 text-xs">
                          <span className="text-slate-500">{question.askedBy.name}</span>
                          <Badge className={`ml-2 text-xs ${getRoleColor(question.askedBy.role)}`}>
                            {question.askedBy.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Desktop Card View
                    <Card className="border border-slate-200">
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
                                <span className="font-medium text-sm">{question.askedBy.name}</span>
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
                                    <span className="font-medium text-sm">{answer.answeredBy.name}</span>
                                    <Badge className={getRoleColor(answer.answeredBy.role)}>
                                      <Shield className="w-3 h-3 mr-1" />
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
