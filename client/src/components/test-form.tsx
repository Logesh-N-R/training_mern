
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Question {
  topic: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'choose-best' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswer?: string;
}

interface QuestionSet {
  _id: string;
  date: string;
  sessionTitle: string;
  questions: Question[];
}

interface TestFormProps {
  questionSet: QuestionSet;
  onSubmit: (submission: any) => void;
  existingSubmission?: any;
}

export default function TestForm({ questionSet, onSubmit, existingSubmission }: TestFormProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [overallUnderstanding, setOverallUnderstanding] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAutoSubmit = useCallback(() => {
    setStatus('Completed');
    setIsCompleted(true);
    handleSubmit(true);
  }, []);

  // Initialize form with existing submission data if available
  useEffect(() => {
    if (existingSubmission) {
      const submissionAnswers: Record<number, string> = {};
      existingSubmission.questionAnswers?.forEach((qa: any, index: number) => {
        submissionAnswers[index] = qa.answer;
      });
      setAnswers(submissionAnswers);
      setOverallUnderstanding(existingSubmission.overallUnderstanding || '');
      setStatus(existingSubmission.status || 'In Progress');
      setRemarks(existingSubmission.remarks || '');
      setIsCompleted(existingSubmission.status === 'Completed');
    }
  }, [existingSubmission]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isCompleted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, isCompleted, handleAutoSubmit]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const questionAnswers = questionSet.questions.map((question, index) => ({
        question: question.question,
        type: question.type,
        topic: question.topic,
        answer: answers[index] || '',
        options: question.options || []
      }));

      const submission = {
        questionSetId: questionSet._id,
        date: questionSet.date,
        sessionTitle: questionSet.sessionTitle,
        questionAnswers,
        overallUnderstanding,
        status: isAutoSubmit ? 'Completed' : status,
        remarks
      };

      await onSubmit(submission);
      
      if (!isAutoSubmit) {
        toast({
          title: "Success",
          description: "Your test has been submitted successfully!",
        });
      }
      
      setIsCompleted(true);
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
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers[index] || '';

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="space-y-2"
          >
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`q${index}-${optionIndex}`} />
                <Label htmlFor={`q${index}-${optionIndex}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'choose-best':
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="space-y-2"
          >
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`q${index}-${optionIndex}`} />
                <Label htmlFor={`q${index}-${optionIndex}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="True" id={`q${index}-true`} />
              <Label htmlFor={`q${index}-true`} className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="False" id={`q${index}-false`} />
              <Label htmlFor={`q${index}-false`} className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'fill-blank':
      case 'text':
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Enter your answer..."
            className="min-h-[100px] resize-none"
          />
        );

      default:
        return (
          <Input
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  const answeredQuestions = Object.keys(answers).filter(key => answers[parseInt(key)]?.trim()).length;
  const totalQuestions = questionSet.questions.length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-slate-800">
                {questionSet.sessionTitle}
              </CardTitle>
              <p className="text-slate-600 mt-1">
                Date: {new Date(questionSet.date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {isCompleted ? "Completed" : "In Progress"}
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {questionSet.questions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">{question.topic}</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {question.type.replace('-', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-medium">
                    {index + 1}. {question.question}
                  </CardTitle>
                </div>
                {answers[index] && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderQuestion(question, index)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="understanding">Rate your overall understanding of today's session</Label>
            <Select value={overallUnderstanding} onValueChange={setOverallUnderstanding}>
              <SelectTrigger>
                <SelectValue placeholder="Select understanding level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Below Average">Below Average</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={isCompleted}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="remarks">Additional Comments</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional comments or feedback..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          {timeRemaining < 300 && !isCompleted && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Less than 5 minutes remaining! Your test will auto-submit when time runs out.
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={() => handleSubmit()} 
            disabled={isSubmitting || isCompleted || !overallUnderstanding}
            className="w-full"
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
                {isCompleted ? 'Test Completed' : 'Submit Test'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
