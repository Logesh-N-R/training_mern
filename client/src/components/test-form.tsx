import React from "react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Send, Save, GraduationCap } from "lucide-react";
import { ApiService } from "@/services/api";
import { Question } from "@shared/schema";

const testFormSchema = z.object({
  questionAnswers: z.array(
    z.object({
      topic: z.string(),
      question: z.string(),
      answer: z.string().min(1, "Answer is required"),
    }),
  ),
  overallUnderstanding: z.string().min(1, "Please select understanding level"),
  status: z.string().min(1, "Please select status"),
  remarks: z.string().optional(),
});

type TestFormData = z.infer<typeof testFormSchema>;

export function TestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: questionSets, isLoading } = useQuery({
    queryKey: ["/api/questions/today"],
    queryFn: () => ApiService.get("/api/questions/today"),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["/api/submissions/my"],
    queryFn: () => ApiService.get("/api/submissions/my"),
  });

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      questionAnswers: [],
      overallUnderstanding: "",
      status: "",
      remarks: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Aggregate all questions from different question sets
  const allQuestions = React.useMemo(() => {
    if (!questionSets) return [];
    return questionSets.reduce((acc: any, set: any) => {
      return acc.concat(
        set.questions.map((q: any) => ({
          ...q,
          sessionTitle: set.sessionTitle,
        })),
      );
    }, []);
  }, [questionSets]);

  const sessionTitles = React.useMemo(() => {
    if (!questionSets) return "";
    return questionSets.map((set: any) => set.sessionTitle).join(", ");
  }, [questionSets]);

  const firstQuestionSetId = React.useMemo(() => {
    if (!questionSets || questionSets.length === 0) return undefined;
    return questionSets[0].id || questionSets[0]._id;
  }, [questionSets]);

  // Check if user has already submitted for today and if it's been evaluated
  const todaySubmission = React.useMemo(() => {
    return submissions.find(
      (submission: any) =>
        submission.date === new Date().toISOString().split("T")[0],
    );
  }, [submissions]);

  const alreadySubmitted = React.useMemo(() => {
    return todaySubmission && todaySubmission.evaluation;
  }, [todaySubmission]);

  const todayDate = React.useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const submitMutation = useMutation({
    mutationFn: (data: TestFormData) => {
      return ApiService.post("/api/submissions", {
        ...data,
        questionSetId: firstQuestionSetId,
        date: new Date().toISOString().split("T")[0],
        sessionTitle: sessionTitles,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions/my"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit test",
        variant: "destructive",
      });
    },
  });

  React.useEffect(() => {
    if (allQuestions.length > 0) {
      form.reset({
        questionAnswers: allQuestions.map((q) => ({
          topic: q.topic,
          question: q.question,
          answer: "",
        })),
        overallUnderstanding: "",
        status: "",
        remarks: "",
      });
    }
  }, [allQuestions, form]);

  const onSubmit = async (data: TestFormData) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // All conditional returns moved to after hooks
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
            <p className="text-slate-600">
              You have already submitted today's test
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Check your submissions below for results
            </p>
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
        {/* Group questions by topic */}
        {React.useMemo(() => {
          const groupedQuestions = allQuestions.reduce(
            (acc: any, question: any, index: number) => {
              const topic = question.topic;
              if (!acc[topic]) {
                acc[topic] = [];
              }
              acc[topic].push({ ...question, originalIndex: index });
              return acc;
            },
            {},
          );

          return Object.entries(groupedQuestions).map(
            ([topic, questions]: [string, any]) => (
              <Card key={topic} className="mb-6 border-l-4 border-l-primary">
                <CardHeader className="pb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Badge
                      variant="outline"
                      className="mr-2 bg-primary/10 text-primary"
                    >
                      {topic}
                    </Badge>
                    <span className="text-sm text-slate-600 ml-auto">
                      {questions.length} question
                      {questions.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {questions.map((question: any, questionIndex: number) => (
                      <div
                        key={question.originalIndex}
                        className="p-4 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex items-start mb-3">
                          <Badge
                            variant="secondary"
                            className="mr-3 mt-1 bg-slate-200 text-slate-700"
                          >
                            Q{questionIndex + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-slate-900 font-medium mb-3">
                              {question.question}
                            </p>
                            <Textarea
                              rows={4}
                              placeholder="Enter your answer here..."
                              className="resize-none bg-white border-slate-300 focus:border-primary"
                              {...register(
                                `questionAnswers.${question.originalIndex}.answer`,
                              )}
                              onChange={(e) => {
                                setValue(
                                  `questionAnswers.${question.originalIndex}`,
                                  {
                                    topic: question.topic,
                                    question: question.question,
                                    answer: e.target.value,
                                  },
                                );
                              }}
                            />
                            {errors.questionAnswers?.[question.originalIndex]
                              ?.answer && (
                              <p className="text-red-500 text-sm mt-1">
                                {
                                  errors.questionAnswers[question.originalIndex]
                                    ?.answer?.message
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </form>
                </CardContent>
              </Card>
            ),
          );
        }, [allQuestions, register, setValue, errors])}

        {/* Submission Form Controls */}
        {allQuestions.length > 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Overall Understanding</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("overallUnderstanding", value)
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select understanding level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.overallUnderstanding && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.overallUnderstanding.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Test Status</Label>
                    <Select
                      onValueChange={(value) => setValue("status", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.status.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Additional Remarks</Label>
                  <Textarea
                    rows={3}
                    placeholder="Any additional comments or questions..."
                    className="resize-none bg-white"
                    {...register("remarks")}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}