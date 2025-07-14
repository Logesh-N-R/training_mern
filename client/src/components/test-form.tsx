
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Clock, Send, CheckCircle, AlertCircle, Trophy, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface TestAnswer {
  questionId: string;
  questionNumber: number;
  answer: string | number | string[];
  timeSpent: number;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
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

interface TestFormProps {
  session: TestSession;
  questions: TestQuestion[];
  existingAttempt?: TestAttempt;
  existingEvaluation?: TestEvaluation;
  onSubmit: (answers: TestAnswer[], timeSpent: number) => void;
  viewOnly?: boolean;
}

export function TestForm({ 
  session, 
  questions, 
  existingAttempt, 
  existingEvaluation, 
  onSubmit, 
  viewOnly = false 
}: TestFormProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(session.duration * 60); // Convert minutes to seconds
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});

  // Initialize form with existing attempt data
  useEffect(() => {
    if (existingAttempt) {
      const attemptAnswers: Record<string, string> = {};
      let totalTimeSpent = 0;
      const questionTimes: Record<string, number> = {};

      existingAttempt.answers.forEach((answer) => {
        attemptAnswers[answer.questionId] = String(answer.answer);
        questionTimes[answer.questionId] = answer.timeSpent;
        totalTimeSpent += answer.timeSpent;
      });

      setAnswers(attemptAnswers);
      setTimeSpent(totalTimeSpent);
      setQuestionTimeSpent(questionTimes);

      // Adjust remaining time if continuing an in-progress test
      if (existingAttempt.status === 'in-progress') {
        const elapsed = Math.floor((new Date().getTime() - new Date(existingAttempt.startedAt).getTime()) / 1000);
        setTimeRemaining(Math.max(0, session.duration * 60 - elapsed));
      }
    }
  }, [existingAttempt, session.duration]);

  // Timer effect (disabled in view-only mode or for completed tests)
  useEffect(() => {
    if (viewOnly || existingAttempt?.status === 'submitted' || existingAttempt?.status === 'evaluated') {
      return;
    }

    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
        setTimeSpent(prev => prev + 1);
        
        // Track time spent on current question
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion) {
          setQuestionTimeSpent(prev => ({
            ...prev,
            [currentQuestion._id]: (prev[currentQuestion._id] || 0) + 1
          }));
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isSubmitting) {
      handleAutoSubmit();
    }
  }, [timeRemaining, currentQuestionIndex, questions, viewOnly, existingAttempt, isSubmitting]);

  const handleAutoSubmit = useCallback(() => {
    if (!viewOnly && !isSubmitting) {
      toast({
        title: "Time's Up!",
        description: "Your test has been automatically submitted.",
        variant: "destructive",
      });
      handleSubmit(true);
    }
  }, [viewOnly, isSubmitting]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (viewOnly || existingAttempt?.status === 'submitted' || existingAttempt?.status === 'evaluated') {
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting || viewOnly) return;

    setIsSubmitting(true);

    try {
      const testAnswers: TestAnswer[] = questions.map((question) => ({
        questionId: question._id,
        questionNumber: question.questionNumber,
        answer: answers[question._id] || '',
        timeSpent: questionTimeSpent[question._id] || 0,
      }));

      await onSubmit(testAnswers, timeSpent);

      if (!isAutoSubmit) {
        toast({
          title: "Success",
          description: "Your test has been submitted successfully!",
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
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

  const renderQuestion = (question: TestQuestion, index: number) => {
    const currentAnswer = answers[question._id] || '';
    const isCompleted = existingAttempt?.status === 'submitted' || existingAttempt?.status === 'evaluated';
    const canEdit = !viewOnly && !isCompleted;

    // Show correct answer and explanation in view mode for evaluated tests
    const showCorrectAnswer = viewOnly && existingEvaluation && question.correctAnswer;
    const isCorrect = existingEvaluation ? currentAnswer === question.correctAnswer : false;

    return (
      <Card key={question._id} className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">{question.category}</Badge>
                <Badge className={getDifficultyColor(question.difficulty)} variant="secondary">
                  {question.difficulty}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {question.type.replace('-', ' ')}
                </Badge>
                <span className="text-sm text-slate-500">
                  {question.points} points
                </span>
              </div>
              <CardTitle className="text-lg font-medium">
                {index + 1}. {question.question}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {currentAnswer && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {existingEvaluation && (
                <div className="flex items-center space-x-1">
                  {isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {existingEvaluation.questionFeedback?.[index] ? 
                      `${Math.round((question.points / existingEvaluation.maxScore) * existingEvaluation.totalScore)}/${question.points}` : 
                      isCorrect ? `${question.points}/${question.points}` : `0/${question.points}`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Answer Input */}
            {question.type === 'multiple-choice' || question.type === 'single-choice' ? (
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) => canEdit && handleAnswerChange(question._id, value)}
                className="space-y-2"
                disabled={!canEdit}
              >
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`q${question._id}-${optionIndex}`} 
                      disabled={!canEdit}
                    />
                    <Label 
                      htmlFor={`q${question._id}-${optionIndex}`} 
                      className={`flex-1 ${canEdit ? 'cursor-pointer' : 'cursor-default'} ${
                        showCorrectAnswer && option === question.correctAnswer ? 'text-green-600 font-medium' : ''
                      } ${
                        showCorrectAnswer && currentAnswer === option && option !== question.correctAnswer ? 'text-red-600' : ''
                      }`}
                    >
                      {option}
                      {showCorrectAnswer && option === question.correctAnswer && (
                        <Badge className="ml-2 bg-green-100 text-green-800">Correct</Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : question.type === 'true-false' ? (
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) => canEdit && handleAnswerChange(question._id, value)}
                className="space-y-2"
                disabled={!canEdit}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="True" id={`q${question._id}-true`} disabled={!canEdit} />
                  <Label 
                    htmlFor={`q${question._id}-true`} 
                    className={`${canEdit ? 'cursor-pointer' : 'cursor-default'} ${
                      showCorrectAnswer && 'True' === question.correctAnswer ? 'text-green-600 font-medium' : ''
                    }`}
                  >
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="False" id={`q${question._id}-false`} disabled={!canEdit} />
                  <Label 
                    htmlFor={`q${question._id}-false`} 
                    className={`${canEdit ? 'cursor-pointer' : 'cursor-default'} ${
                      showCorrectAnswer && 'False' === question.correctAnswer ? 'text-green-600 font-medium' : ''
                    }`}
                  >
                    False
                  </Label>
                </div>
              </RadioGroup>
            ) : question.type === 'essay' || question.type === 'text-input' ? (
              <Textarea
                value={currentAnswer}
                onChange={(e) => canEdit && handleAnswerChange(question._id, e.target.value)}
                placeholder="Enter your answer..."
                className="min-h-[100px] resize-none"
                disabled={!canEdit}
              />
            ) : (
              <Input
                value={currentAnswer}
                onChange={(e) => canEdit && handleAnswerChange(question._id, e.target.value)}
                placeholder="Enter your answer..."
                disabled={!canEdit}
              />
            )}

            {/* Show explanation in view mode */}
            {showCorrectAnswer && question.explanation && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Explanation:</strong> {question.explanation}
                </AlertDescription>
              </Alert>
            )}

            {/* Show individual feedback if available */}
            {existingEvaluation?.questionFeedback?.[index] && (
              <Alert>
                <Star className="h-4 w-4" />
                <AlertDescription>
                  <strong>Feedback:</strong> {existingEvaluation.questionFeedback[index]}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const answeredQuestions = Object.keys(answers).filter(key => answers[key]?.trim()).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-slate-800">
                {session.title}
              </CardTitle>
              <p className="text-slate-600 mt-1">
                {session.description}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Date: {new Date(session.date).toLocaleDateString()} • 
                Duration: {session.duration} minutes • 
                {totalQuestions} questions
              </p>
            </div>
            <div className="text-right">
              {!viewOnly && !existingAttempt?.submittedAt && (
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <Badge variant={existingAttempt?.status === 'submitted' || existingAttempt?.status === 'evaluated' ? "default" : "secondary"}>
                {existingAttempt?.status === 'submitted' ? 'Submitted' :
                 existingAttempt?.status === 'evaluated' ? 'Evaluated' : 
                 'In Progress'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Progress</span>
            <span className="text-sm font-medium">{answeredQuestions}/{totalQuestions} Questions</span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Evaluation Results */}
      {existingEvaluation && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Trophy className="w-5 h-5 mr-2" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {existingEvaluation.percentage}%
                </div>
                <div className="text-sm text-slate-600">Score</div>
              </div>
              <div className="text-center">
                <Badge className={`${getGradeColor(existingEvaluation.grade)} text-lg px-3 py-1`}>
                  {existingEvaluation.grade}
                </Badge>
                <div className="text-sm text-slate-600 mt-1">Grade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {existingEvaluation.totalScore}
                </div>
                <div className="text-sm text-slate-600">
                  out of {existingEvaluation.maxScore}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-slate-900">
                  {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                </div>
                <div className="text-sm text-slate-600">Time Taken</div>
              </div>
            </div>
            {existingEvaluation.overallFeedback && (
              <Alert>
                <Star className="h-4 w-4" />
                <AlertDescription>
                  <strong>Overall Feedback:</strong> {existingEvaluation.overallFeedback}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Submit Button */}
      {!viewOnly && !existingAttempt?.submittedAt && (
        <Card>
          <CardContent className="pt-6">
            {timeRemaining < 300 && timeRemaining > 0 && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warning: Less than 5 minutes remaining! Your test will auto-submit when time runs out.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <Button 
                onClick={() => handleSubmit()} 
                disabled={isSubmitting || answeredQuestions === 0}
                className="w-full max-w-md"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Test ({answeredQuestions}/{totalQuestions} answered)
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-slate-500 mt-3">
              Make sure to review your answers before submitting. You cannot change them once submitted.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completion Status */}
      {(existingAttempt?.submittedAt || viewOnly) && (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {viewOnly 
                  ? "This is a read-only view of your submitted test."
                  : "Your test has been submitted successfully! You can no longer make changes."
                }
                {existingAttempt?.submittedAt && (
                  <span className="block mt-1 text-sm">
                    Submitted on: {new Date(existingAttempt.submittedAt).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TestForm;
