
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api';
import { questionFormSchema, type QuestionFormData } from '@shared/schema';
import { Plus, Trash2, Upload, Calendar } from 'lucide-react';

interface TopicSection {
  topic: string;
  questions: Array<{
    question: string;
    type: 'text' | 'multiple-choice' | 'choose-best' | 'true-false' | 'fill-blank';
    options: string[];
    correctAnswer: string | number;
    explanation: string;
  }>;
}

export function QuestionUploader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topicSections, setTopicSections] = useState<TopicSection[]>([
    { 
      topic: '', 
      questions: [{ 
        question: '', 
        type: 'text', 
        options: [''], 
        correctAnswer: '', 
        explanation: '' 
      }] 
    }
  ]);

  const { data: existingQuestions = [] } = useQuery({
    queryKey: ['/api/questions'],
    queryFn: () => ApiService.get('/api/questions'),
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      sessionTitle: '',
      questions: [],
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
      setTopicSections([{ 
        topic: '', 
        questions: [{ 
          question: '', 
          type: 'text', 
          options: [''], 
          correctAnswer: '', 
          explanation: '' 
        }] 
      }]);
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

  const addTopicSection = () => {
    setTopicSections([...topicSections, { 
      topic: '', 
      questions: [{ 
        question: '', 
        type: 'text', 
        options: [''], 
        correctAnswer: '', 
        explanation: '' 
      }] 
    }]);
  };

  const removeTopicSection = (topicIndex: number) => {
    if (topicSections.length > 1) {
      const newSections = topicSections.filter((_, i) => i !== topicIndex);
      setTopicSections(newSections);
      updateFormQuestions(newSections);
    }
  };

  const addQuestionToTopic = (topicIndex: number) => {
    const newSections = [...topicSections];
    newSections[topicIndex].questions.push({
      question: '',
      type: 'text',
      options: [''],
      correctAnswer: '',
      explanation: ''
    });
    setTopicSections(newSections);
    updateFormQuestions(newSections);
  };

  const removeQuestionFromTopic = (topicIndex: number, questionIndex: number) => {
    const newSections = [...topicSections];
    if (newSections[topicIndex].questions.length > 1) {
      newSections[topicIndex].questions = newSections[topicIndex].questions.filter((_, i) => i !== questionIndex);
      setTopicSections(newSections);
      updateFormQuestions(newSections);
    }
  };

  const updateTopic = (topicIndex: number, value: string) => {
    const newSections = [...topicSections];
    newSections[topicIndex].topic = value;
    setTopicSections(newSections);
    updateFormQuestions(newSections);
  };

  const updateQuestion = (topicIndex: number, questionIndex: number, field: string, value: any) => {
    const newSections = [...topicSections];
    newSections[topicIndex].questions[questionIndex] = {
      ...newSections[topicIndex].questions[questionIndex],
      [field]: value
    };
    setTopicSections(newSections);
    updateFormQuestions(newSections);
  };

  const addOption = (topicIndex: number, questionIndex: number) => {
    const newSections = [...topicSections];
    newSections[topicIndex].questions[questionIndex].options.push('');
    setTopicSections(newSections);
    updateFormQuestions(newSections);
  };

  const removeOption = (topicIndex: number, questionIndex: number, optionIndex: number) => {
    const newSections = [...topicSections];
    if (newSections[topicIndex].questions[questionIndex].options.length > 2) {
      newSections[topicIndex].questions[questionIndex].options = 
        newSections[topicIndex].questions[questionIndex].options.filter((_, i) => i !== optionIndex);
      setTopicSections(newSections);
      updateFormQuestions(newSections);
    }
  };

  const updateOption = (topicIndex: number, questionIndex: number, optionIndex: number, value: string) => {
    const newSections = [...topicSections];
    newSections[topicIndex].questions[questionIndex].options[optionIndex] = value;
    setTopicSections(newSections);
    updateFormQuestions(newSections);
  };

  const updateFormQuestions = (sections: TopicSection[]) => {
    const allQuestions = sections.flatMap(section =>
      section.questions
        .filter(q => q.question.trim())
        .map(question => ({
          topic: section.topic,
          question: question.question,
          type: question.type,
          options: question.type === 'text' || question.type === 'fill-blank' ? undefined : question.options.filter(opt => opt.trim()),
          correctAnswer: question.correctAnswer || undefined,
          explanation: question.explanation || undefined
        }))
    );
    setValue('questions', allQuestions);
  };

  const onSubmit = (data: QuestionFormData) => {
    const allQuestions = topicSections.flatMap(section =>
      section.questions
        .filter(q => q.question.trim())
        .map(question => ({
          topic: section.topic.trim(),
          question: question.question.trim(),
          type: question.type,
          options: question.type === 'text' || question.type === 'fill-blank' ? undefined : question.options.filter(opt => opt.trim()),
          correctAnswer: question.correctAnswer || undefined,
          explanation: question.explanation || undefined
        }))
    ).filter(q => q.topic && q.question);

    if (allQuestions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one complete question with a topic',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate({
      ...data,
      questions: allQuestions,
    });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text Answer';
      case 'multiple-choice': return 'Multiple Choice';
      case 'choose-best': return 'Choose Best Answer';
      case 'true-false': return 'True/False';
      case 'fill-blank': return 'Fill in the Blank';
      default: return 'Text Answer';
    }
  };

  const needsOptions = (type: string) => {
    return ['multiple-choice', 'choose-best', 'true-false'].includes(type);
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
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <Label className="text-sm md:text-base">Topics & Questions</Label>
              <Button
                type="button"
                onClick={addTopicSection}
                variant="outline"
                size="sm"
                className="flex items-center self-start md:self-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Topic
              </Button>
            </div>

            <div className="space-y-6">
              {topicSections.map((topicSection, topicIndex) => (
                <div key={topicIndex} className="border rounded-lg p-3 md:p-4 space-y-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-700 text-sm md:text-base">Topic {topicIndex + 1}</h4>
                    {topicSections.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTopicSection(topicIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 p-1 md:p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`topic-${topicIndex}`}>Topic Name</Label>
                    <Input
                      id={`topic-${topicIndex}`}
                      placeholder="e.g., React Hooks, JavaScript Fundamentals"
                      value={topicSection.topic}
                      onChange={(e) => updateTopic(topicIndex, e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Questions for this Topic</Label>
                      <Button
                        type="button"
                        onClick={() => addQuestionToTopic(topicIndex)}
                        variant="outline"
                        size="sm"
                        className="flex items-center text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Question
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {topicSection.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Question {questionIndex + 1}</Label>
                            {topicSection.questions.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeQuestionFromTopic(topicIndex, questionIndex)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div>
                            <Label htmlFor={`question-type-${topicIndex}-${questionIndex}`}>Question Type</Label>
                            <Select
                              value={question.type}
                              onValueChange={(value) => updateQuestion(topicIndex, questionIndex, 'type', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text Answer</SelectItem>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="choose-best">Choose Best Answer</SelectItem>
                                <SelectItem value="true-false">True/False</SelectItem>
                                <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`question-${topicIndex}-${questionIndex}`}>Question Text</Label>
                            <Textarea
                              id={`question-${topicIndex}-${questionIndex}`}
                              placeholder="Enter your question here..."
                              value={question.question}
                              onChange={(e) => updateQuestion(topicIndex, questionIndex, 'question', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>

                          {question.type === 'true-false' && (
                            <div className="space-y-2">
                              <Label>Options (Auto-generated for True/False)</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input value="True" disabled />
                                <Input value="False" disabled />
                              </div>
                              <div>
                                <Label>Correct Answer</Label>
                                <Select
                                  value={question.correctAnswer.toString()}
                                  onValueChange={(value) => updateQuestion(topicIndex, questionIndex, 'correctAnswer', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="True">True</SelectItem>
                                    <SelectItem value="False">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {needsOptions(question.type) && question.type !== 'true-false' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Answer Options</Label>
                                <Button
                                  type="button"
                                  onClick={() => addOption(topicIndex, questionIndex)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2">
                                    <Input
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option}
                                      onChange={(e) => updateOption(topicIndex, questionIndex, optionIndex, e.target.value)}
                                    />
                                    {question.options.length > 2 && (
                                      <Button
                                        type="button"
                                        onClick={() => removeOption(topicIndex, questionIndex, optionIndex)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <Label>Correct Answer</Label>
                                <Select
                                  value={question.correctAnswer.toString()}
                                  onValueChange={(value) => updateQuestion(topicIndex, questionIndex, 'correctAnswer', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {question.options.filter(opt => opt.trim()).map((option, idx) => (
                                      <SelectItem key={idx} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {(question.type === 'text' || question.type === 'fill-blank') && (
                            <div>
                              <Label htmlFor={`correct-answer-${topicIndex}-${questionIndex}`}>
                                {question.type === 'fill-blank' ? 'Correct Answer/Keywords' : 'Sample Answer (Optional)'}
                              </Label>
                              <Textarea
                                id={`correct-answer-${topicIndex}-${questionIndex}`}
                                placeholder={question.type === 'fill-blank' ? 'Enter the correct answer or keywords' : 'Enter a sample answer for reference'}
                                value={question.correctAnswer.toString()}
                                onChange={(e) => updateQuestion(topicIndex, questionIndex, 'correctAnswer', e.target.value)}
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor={`explanation-${topicIndex}-${questionIndex}`}>Explanation (Optional)</Label>
                            <Textarea
                              id={`explanation-${topicIndex}-${questionIndex}`}
                              placeholder="Provide an explanation for the correct answer..."
                              value={question.explanation}
                              onChange={(e) => updateQuestion(topicIndex, questionIndex, 'explanation', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm text-slate-700">{q.topic}</div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {getQuestionTypeLabel(q.type)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">{q.question}</div>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((option: string, optIdx: number) => (
                              <div key={optIdx} className="text-xs text-slate-500 ml-4">
                                • {option}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.correctAnswer && (
                          <div className="text-xs text-green-600 mt-1 font-medium">
                            Correct: {q.correctAnswer}
                          </div>
                        )}
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
