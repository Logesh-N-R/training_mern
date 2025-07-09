import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Send, Save } from 'lucide-react';
import { ApiService } from '@/services/api';
import { Question } from '@shared/schema';

const testFormSchema = z.object({
  questionAnswers: z.array(z.object({
    topic: z.string(),
    question: z.string(),
    answer: z.string().min(1, 'Answer is required'),
  })),
  overallUnderstanding: z.string().min(1, 'Please select understanding level'),
  status: z.string().min(1, 'Please select status'),
  remarks: z.string().optional(),
});

type TestFormData = z.infer<typeof testFormSchema>;

export function TestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: questionSets, isLoading } = useQuery({
    queryKey: ['/api/questions/today'],
    queryFn: () => ApiService.get('/api/questions/today'),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['/api/submissions/my'],
    queryFn: () => ApiService.get('/api/submissions/my'),
  });

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      questionAnswers: [],
      overallUnderstanding: '',
      status: '',
      remarks: '',
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const todayDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Aggregate all questions from different question sets
  const allQuestions = React.useMemo(() => {
    if (!questionSets) return [];
    return questionSets.reduce((acc: any, set: any) => {
      return acc.concat(set.questions.map((q: any) => ({ ...q, sessionTitle: set.sessionTitle })));
    }, []);
  }, [questionSets]);

  const sessionTitles = React.useMemo(() => {
    if (!questionSets) return '';
    return questionSets.map((set: any) => set.sessionTitle).join(', ');
  }, [questionSets]);

  const firstQuestionSetId = React.useMemo(() => {
    if (!questionSets || questionSets.length === 0) return undefined;
    return questionSets[0].id || questionSets[0]._id;
  }, [questionSets]);


  // Check if user has already submitted for today and if it's been evaluated
  const todaySubmission = submissions.find((submission: any) =>
    submission.date === new Date().toISOString().split('T')[0]
  );
  const alreadySubmitted = todaySubmission && todaySubmission.evaluation;

  React.useEffect(() => {
    if (allQuestions.length > 0) {
      form.reset({
        questionAnswers: allQuestions.map(q => ({
          topic: q.topic,
          question: q.question,
          answer: ''
        })),
        overallUnderstanding: '',
        status: '',
        remarks: ''
      });
    }
  }, [allQuestions, form]);



  const submitMutation = useMutation({
    mutationFn: (data: TestFormData) => {
      return ApiService.post('/api/submissions', {
        ...data,
        questionSetId: firstQuestionSetId,
        date: new Date().toISOString().split('T')[0],
        sessionTitle: sessionTitles,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions/my'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit test",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TestFormData) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading today's test...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!questionSets || questionSets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No test available for today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alreadySubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-slate-600">You have already submitted today's test</p>
            <p className="text-sm text-slate-500 mt-2">Check your submissions below for results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Test</CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Calendar className="w-4 h-4 mr-1" />
            {todayDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
         
      </CardContent>
    </Card>
  );
}