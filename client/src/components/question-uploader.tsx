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
import { Upload, Plus, Trash2, PlusCircle } from 'lucide-react';
import { ApiService } from '@/services/api';

const questionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  sessionTitle: z.string().min(1, 'Session title is required'),
  topics: z.array(z.object({
    topicName: z.string().min(1, 'Topic name is required'),
    questions: z.array(z.object({
      question: z.string().min(1, 'Question is required'),
    })).min(1, 'At least one question is required per topic'),
  })).min(1, 'At least one topic is required'),
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
      topics: [{ topicName: '', questions: [{ question: '' }] }],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const topics = watch('topics');

  const uploadMutation = useMutation({
    mutationFn: (data: QuestionFormData) => {
      // Transform data to match the expected API format
      const transformedData = {
        date: data.date,
        sessionTitle: data.sessionTitle,
        questions: data.topics.flatMap(topic => 
          topic.questions.map(q => ({
            topic: topic.topicName,
            question: q.question
          }))
        )
      };
      return ApiService.post('/api/questions', transformedData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Questions uploaded successfully. Other admins can also add questions for the same date.",
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

  const addTopic = () => {
    const currentTopics = watch('topics');
    setValue('topics', [...currentTopics, { topicName: '', questions: [{ question: '' }] }]);
  };

  const removeTopic = (index: number) => {
    const currentTopics = watch('topics');
    if (currentTopics.length > 1) {
      setValue('topics', currentTopics.filter((_, i) => i !== index));
    }
  };

  const addQuestion = (topicIndex: number) => {
    const currentTopics = watch('topics');
    const updatedTopics = [...currentTopics];
    updatedTopics[topicIndex].questions.push({ question: '' });
    setValue('topics', updatedTopics);
  };

  const removeQuestion = (topicIndex: number, questionIndex: number) => {
    const currentTopics = watch('topics');
    const updatedTopics = [...currentTopics];
    if (updatedTopics[topicIndex].questions.length > 1) {
      updatedTopics[topicIndex].questions.splice(questionIndex, 1);
      setValue('topics', updatedTopics);
    }
  };

  const onSubmit = (data: QuestionFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Questions</CardTitle>
        <p className="text-sm text-slate-600">
          Multiple admins can add questions for the same date. All questions will be included in the trainee's test.
        </p>
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
              <h4 className="font-medium text-slate-900">Topics & Questions</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopic}
                className="text-primary hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Topic
              </Button>
            </div>

            {topics.map((topic, topicIndex) => (
              <Card key={topicIndex} className="border-2 border-slate-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-800">Topic {topicIndex + 1}</span>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(topicIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`topic-${topicIndex}`}>Topic Name</Label>
                    <Input
                      id={`topic-${topicIndex}`}
                      placeholder="e.g., API Structure, React Hooks, etc."
                      {...register(`topics.${topicIndex}.topicName`)}
                    />
                    {errors.topics?.[topicIndex]?.topicName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.topics[topicIndex]?.topicName?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Questions for this topic</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addQuestion(topicIndex)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add Question
                      </Button>
                    </div>

                    {topic.questions.map((_, questionIndex) => (
                      <Card key={questionIndex} className="border border-slate-200 bg-slate-50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">
                              Question {questionIndex + 1}
                            </span>
                            {topic.questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(topicIndex, questionIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Textarea
                            placeholder="Enter your question here..."
                            rows={3}
                            className="resize-none bg-white"
                            {...register(`topics.${topicIndex}.questions.${questionIndex}.question`)}
                          />
                          {errors.topics?.[topicIndex]?.questions?.[questionIndex]?.question && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.topics[topicIndex]?.questions?.[questionIndex]?.question?.message}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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
```

```
The code changes address a potential error where the questions array is undefined, preventing proper rendering and functionality.
```

```replit_final_file
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
import { Upload, Plus, Trash2, PlusCircle } from 'lucide-react';
import { ApiService } from '@/services/api';

const questionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  sessionTitle: z.string().min(1, 'Session title is required'),
  topics: z.array(z.object({
    topicName: z.string().min(1, 'Topic name is required'),
    questions: z.array(z.object({
      question: z.string().min(1, 'Question is required'),
    })).min(1, 'At least one question is required per topic'),
  })).min(1, 'At least one topic is required'),
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
      topics: [{ topicName: '', questions: [{ question: '' }] }],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const topics = watch('topics');

  const uploadMutation = useMutation({
    mutationFn: (data: QuestionFormData) => {
      // Transform data to match the expected API format
      const transformedData = {
        date: data.date,
        sessionTitle: data.sessionTitle,
        questions: data.topics.flatMap(topic => 
          topic.questions.map(q => ({
            topic: topic.topicName,
            question: q.question
          }))
        )
      };
      return ApiService.post('/api/questions', transformedData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Questions uploaded successfully. Other admins can also add questions for the same date.",
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

  const addTopic = () => {
    const currentTopics = watch('topics');
    setValue('topics', [...currentTopics, { topicName: '', questions: [{ question: '' }] }]);
  };

  const removeTopic = (index: number) => {
    const currentTopics = watch('topics');
    if (currentTopics.length > 1) {
      setValue('topics', currentTopics.filter((_, i) => i !== index));
    }
  };

  const addQuestion = (topicIndex: number) => {
    const currentTopics = watch('topics');
    const updatedTopics = [...currentTopics];
    updatedTopics[topicIndex].questions.push({ question: '' });
    setValue('topics', updatedTopics);
  };

  const removeQuestion = (topicIndex: number, questionIndex: number) => {
    const currentTopics = watch('topics');
    const updatedTopics = [...currentTopics];
    if (updatedTopics[topicIndex].questions.length > 1) {
      updatedTopics[topicIndex].questions.splice(questionIndex, 1);
      setValue('topics', updatedTopics);
    }
  };

  const onSubmit = (data: QuestionFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Questions</CardTitle>
        <p className="text-sm text-slate-600">
          Multiple admins can add questions for the same date. All questions will be included in the trainee's test.
        </p>
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
              <h4 className="font-medium text-slate-900">Topics & Questions</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopic}
                className="text-primary hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Topic
              </Button>
            </div>

            {topics.map((topic, topicIndex) => (
              <Card key={topicIndex} className="border-2 border-slate-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-800">Topic {topicIndex + 1}</span>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(topicIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`topic-${topicIndex}`}>Topic Name</Label>
                    <Input
                      id={`topic-${topicIndex}`}
                      placeholder="e.g., API Structure, React Hooks, etc."
                      {...register(`topics.${topicIndex}.topicName`)}
                    />
                    {errors.topics?.[topicIndex]?.topicName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.topics[topicIndex]?.topicName?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Questions for this topic</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addQuestion(topicIndex)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add Question
                      </Button>
                    </div>

                    {topic.questions.map((_, questionIndex) => (
                      <Card key={questionIndex} className="border border-slate-200 bg-slate-50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">
                              Question {questionIndex + 1}
                            </span>
                            {topic.questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(topicIndex, questionIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Textarea
                            placeholder="Enter your question here..."
                            rows={3}
                            className="resize-none bg-white"
                            {...register(`topics.${topicIndex}.questions.${questionIndex}.question`)}
                          />
                          {errors.topics?.[topicIndex]?.questions?.[questionIndex]?.question && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.topics[topicIndex]?.questions?.[questionIndex]?.question?.message}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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
```import { useState } from 'react';
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
import { Upload, Plus, Trash2, PlusCircle } from 'lucide-react';
import { ApiService } from '@/services/api';

const questionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  sessionTitle: z.string().min(1, 'Session title is required'),
  topics: z.array(z.object({
    topicName: z.string().min(1, 'Topic name is required'),
    questions: z.array(z.object({
      question: z.string().min(1, 'Question is required'),
    })).min(1, 'At least one question is required per topic'),
  })).min(1, 'At least one topic is required'),
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
      topics: [{ topicName: '', questions: [{ question: '' }] }],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const topics = watch('topics');

  const uploadMutation = useMutation({
    mutationFn: (data: QuestionFormData) => {
      // Transform data to match the expected API format
      const transformedData = {
        date: data.date,
        sessionTitle: data.sessionTitle,
        questions: data.topics.flatMap(topic => 
          topic.questions.map(q => ({
            topic: topic.topicName,
            question: q.question
          }))
        )
      };
      return ApiService.post('/api/questions', transformedData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Questions uploaded successfully. Other admins can also add questions for the same date.",
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

  const addTopic = () => {
    const currentTopics = watch('topics');
    setValue('topics', [...currentTopics, { topicName: '', questions: [{ question: '' }] }]);
  };

  const removeTopic = (index: number) => {
    const currentTopics = watch('topics');
    if (currentTopics.length > 1) {
      setValue('topics', currentTopics.filter((_, i) => i !== index));
    }
  };

  const addQuestion = (topicIndex: number) => {
    const currentTopics = watch('topics');
    const updatedTopics = [...currentTopics];
    updatedTopics[topicIndex].questions.push({ question: '' });
    setValue('topics', updatedTopics);
  };

  const removeQuestion = (topicIndex: number, questionIndex: number) => {
    const currentTopics = watch('topics');
    const updatedTopics = [...currentTopics];
    if (updatedTopics[topicIndex].questions.length > 1) {
      updatedTopics[topicIndex].questions.splice(questionIndex, 1);
      setValue('topics', updatedTopics);
    }
  };

  const onSubmit = (data: QuestionFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Questions</CardTitle>
        <p className="text-sm text-slate-600">
          Multiple admins can add questions for the same date. All questions will be included in the trainee's test.
        </p>
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
              <h4 className="font-medium text-slate-900">Topics & Questions</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopic}
                className="text-primary hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Topic
              </Button>
            </div>

            {topics.map((topic, topicIndex) => (
              <Card key={topicIndex} className="border-2 border-slate-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-800">Topic {topicIndex + 1}</span>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(topicIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`topic-${topicIndex}`}>Topic Name</Label>
                    <Input
                      id={`topic-${topicIndex}`}
                      placeholder="e.g., API Structure, React Hooks, etc."
                      {...register(`topics.${topicIndex}.topicName`)}
                    />
                    {errors.topics?.[topicIndex]?.topicName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.topics[topicIndex]?.topicName?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Questions for this topic</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addQuestion(topicIndex)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add Question
                      </Button>
                    </div>

                    {topic.questions.map((_, questionIndex) => (
                      <Card key={questionIndex} className="border border-slate-200 bg-slate-50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">
                              Question {questionIndex + 1}
                            </span>
                            {topic.questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(topicIndex, questionIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Textarea
                            placeholder="Enter your question here..."
                            rows={3}
                            className="resize-none bg-white"
                            {...register(`topics.${topicIndex}.questions.${questionIndex}.question`)}
                          />
                          {errors.topics?.[topicIndex]?.questions?.[questionIndex]?.question && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.topics[topicIndex]?.questions?.[questionIndex]?.question?.message}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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