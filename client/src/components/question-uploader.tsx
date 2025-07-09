import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { ApiService } from '@/services/api';

const questionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  sessionTitle: z.string().min(1, 'Session title is required'),
  questions: z.array(z.object({
    topic: z.string().min(1, 'Topic is required'),
    question: z.string().min(1, 'Question is required'),
  })).min(1, 'At least one question is required'),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

export function QuestionUploader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      date: '',
      sessionTitle: '',
      questions: [{ topic: '', question: '' }],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const questions = watch('questions');

  const uploadMutation = useMutation({
    mutationFn: (data: QuestionFormData) => ApiService.post('/api/questions', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Questions uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload questions",
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    const currentQuestions = watch('questions');
    setValue('questions', [...currentQuestions, { topic: '', question: '' }]);
  };

  const removeQuestion = (index: number) => {
    const currentQuestions = watch('questions');
    if (currentQuestions.length > 1) {
      setValue('questions', currentQuestions.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (data: QuestionFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Test Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="sessionTitle">Session Title</Label>
              <Input
                id="sessionTitle"
                placeholder="e.g., React Hooks Deep Dive"
                {...register('sessionTitle')}
              />
              {errors.sessionTitle && (
                <p className="text-red-500 text-sm mt-1">{errors.sessionTitle.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900">Questions</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className="text-primary hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>

            {questions.map((_, index) => (
              <Card key={index} className="border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Question {index + 1}</span>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Input
                        placeholder="Topic (e.g., API Structure)"
                        {...register(`questions.${index}.topic`)}
                      />
                      {errors.questions?.[index]?.topic && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.questions[index]?.topic?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Textarea
                        placeholder="Enter your question here..."
                        rows={2}
                        className="resize-none"
                        {...register(`questions.${index}.question`)}
                      />
                      {errors.questions?.[index]?.question && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.questions[index]?.question?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={uploadMutation.isPending}
              className="bg-primary hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Questions'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
