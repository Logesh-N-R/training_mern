import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api';
import { questionFormSchema, type QuestionFormData } from '@shared/schema';
import { Plus, Trash2, Upload, Calendar } from 'lucide-react';

export function QuestionUploader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState([{ topic: '', question: '' }]);

  const { data: existingQuestions = [] } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => ApiService.get('/api/questions'),
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      sessionTitle: '',
      questions: [{ topic: '', question: '' }],
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const uploadMutation = useMutation({
    mutationFn: (data: QuestionFormData) => ApiService.post('/api/questions', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Questions uploaded successfully',
      });
      form.reset();
      setQuestions([{ topic: '', question: '' }]);
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload questions',
        variant: 'destructive',
      });
    },
  });

  const addQuestion = () => {
    const newQuestions = [...questions, { topic: '', question: '' }];
    setQuestions(newQuestions);
    setValue('questions', newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
      setValue('questions', newQuestions);
    }
  };

  const updateQuestion = (index: number, field: 'topic' | 'question', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
    setValue('questions', newQuestions);
  };

  const onSubmit = (data: QuestionFormData) => {
    // Filter out empty questions
    const validQuestions = data.questions.filter(q => q.topic.trim() && q.question.trim());

    if (validQuestions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one complete question',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate({
      ...data,
      questions: validQuestions,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Questions for Daily Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Test Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className="mt-1"
              />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sessionTitle">Session Title</Label>
              <Input
                id="sessionTitle"
                placeholder="e.g., React Fundamentals Day 1"
                {...register('sessionTitle')}
                className="mt-1"
              />
              {errors.sessionTitle && (
                <p className="text-sm text-red-600 mt-1">{errors.sessionTitle.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Questions</Label>
              <Button
                type="button"
                onClick={addQuestion}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions?.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-700">Question {index + 1}</h4>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`topic-${index}`}>Topic</Label>
                    <Input
                      id={`topic-${index}`}
                      placeholder="e.g., React Hooks"
                      value={question.topic}
                      onChange={(e) => updateQuestion(index, 'topic', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`question-${index}`}>Question</Label>
                    <Textarea
                      id={`question-${index}`}
                      placeholder="Enter your question here..."
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>

            {errors.questions && (
              <p className="text-sm text-red-600 mt-2">{errors.questions.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Questions'}
          </Button>
        </form>

        {/* Existing Questions for Today */}
        {existingQuestions && existingQuestions.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-medium text-slate-900 mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Existing Questions
            </h3>
            <div className="space-y-4">
              {existingQuestions.map((questionSet: any, setIndex: number) => (
                <div key={questionSet._id || setIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900">{questionSet.sessionTitle}</h4>
                      <p className="text-sm text-slate-600">
                        Date: {new Date(questionSet.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {questionSet.questions?.map((q: any, qIndex: number) => (
                      <div key={qIndex} className="bg-slate-50 p-3 rounded">
                        <div className="font-medium text-sm text-slate-700">{q.topic}</div>
                        <div className="text-sm text-slate-600 mt-1">{q.question}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}