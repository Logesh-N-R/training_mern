import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';
import { ApiService } from '../services/api';
import { Clock, Save, Send, AlertCircle } from 'lucide-react';

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

interface TestAnswer {
  questionId: string;
  questionNumber: number;
  answer: string | number | string[];
  timeSpent: number;
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

interface TestFormProps {
  sessionId: string;
  existingAttempt?: TestAttempt;
  onClose: () => void;
  onSubmit: () => void;
}

export function TestForm({ sessionId, existingAttempt, onClose, onSubmit }: TestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Form state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, TestAnswer>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch questions for this session
  const { data: questions = [], isLoading } = useQuery({
    queryKey: [`/api/test-questions/${sessionId}`],
    queryFn: () => ApiService.get(`/api/test-questions/${sessionId}`),
  });

  // Initialize timer and answers from existing attempt
  useEffect(() => {
    if (existingAttempt) {
      setTimeElapsed(existingAttempt.timeSpent || 0);

      // Load existing answers
      const answerMap = new Map<string, TestAnswer>();
      existingAttempt.answers.forEach(answer => {
        answerMap.set(answer.questionId, answer);
      });
      setAnswers(answerMap);
    }
  }, [existingAttempt]);

  // Timer effect
  useEffect(() => {
    if (isSubmitting) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitting]);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: (data: any) => {
      if (existingAttempt) {
        return ApiService.put(`/api/test-attempts/${existingAttempt._id}`, data);
      } else {
        return ApiService.post('/api/test-attempts', {
          sessionId,
          ...data,
          status: 'in-progress',
        });
      }
    },
    onError: (error: any) => {
      console.error('Auto-save error:', error);
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      if (existingAttempt) {
        return ApiService.put(`/api/test-attempts/${existingAttempt._id}`, {
          ...data,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        });
      } else {
        return ApiService.post('/api/test-attempts', {
          sessionId,
          ...data,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test submitted successfully!",
      });
      onSubmit();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit test",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleAnswerChange = (questionId: string, questionNumber: number, answer: string | number | string[]) => {
    const now = Date.now();
    const timeSpentOnQuestion = Math.floor((now - questionStartTime) / 1000);

    const newAnswer: TestAnswer = {
      questionId,
      questionNumber,
      answer,
      timeSpent: timeSpentOnQuestion,
    };

    setAnswers(prev => new Map(prev.set(questionId, newAnswer)));
    setQuestionStartTime(now);

    // Auto-save after a delay
    setTimeout(() => {
      autoSave();
    }, 1000);
  };

  const autoSave = () => {
    const answersArray = Array.from(answers.values());
    autoSaveMutation.mutate({
      answers: answersArray,
      timeSpent: timeElapsed,
    });
  };

  const handleSubmit = () => {
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "No questions found for this test",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const answersArray = Array.from(answers.values());

    submitMutation.mutate({
      answers: answersArray,
      timeSpent: timeElapsed,
    });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = (question: TestQuestion) => {
    const currentAnswer = answers.get(question._id);

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={currentAnswer?.answer as string || ''}
            onValueChange={(value) => handleAnswerChange(question._id, question.questionNumber, value)}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={currentAnswer?.answer as string || ''}
            onValueChange={(value) => handleAnswerChange(question._id, question.questionNumber, value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'text-input':
        return (
          <Textarea
            value={currentAnswer?.answer as string || ''}
            onChange={(e) => handleAnswerChange(question._id, question.questionNumber, e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">No questions found for this test.</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredQuestions = Array.from(answers.keys()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Time: {formatTime(timeElapsed)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Answered: {answeredQuestions}/{questions.length}
          </div>
        </div>

        {autoSaveMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Save className="w-4 h-4 animate-pulse" />
            Saving...
          </div>
        )}
      </div>

      {/* Progress */}
      <Progress value={progress} className="w-full" />

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-start justify-between">
            <span>Question {currentQuestion.questionNumber}</span>
            <div className="text-sm text-muted-foreground">
              {currentQuestion.points} points • {currentQuestion.difficulty}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg">{currentQuestion.question}</div>

          {currentQuestion.category && (
            <div className="text-sm text-muted-foreground">
              Category: {currentQuestion.category}
            </div>
          )}

          <div className="mt-6">
            {renderQuestionInput(currentQuestion)}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answeredQuestions === 0}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => {
              const isAnswered = Array.from(answers.keys()).some(id => 
                questions[index] && questions[index]._id === id
              );
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    setQuestionStartTime(Date.now());
                  }}
                  className={`
                    h-8 w-8 rounded text-xs font-medium transition-colors
                    ${isCurrent 
                      ? 'bg-primary text-primary-foreground' 
                      : isAnswered 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}