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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Star, CheckCircle, XCircle } from 'lucide-react';
import { ApiService } from '@/services/api';
import { Submission } from '@shared/schema';

const evaluationSchema = z.object({
  questionAnswers: z.array(z.object({
    score: z.number().min(0).max(10),
    feedback: z.string().optional(),
  })),
  overallFeedback: z.string().optional(),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface SubmissionEvaluationProps {
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmissionEvaluation({ submission, isOpen, onClose }: SubmissionEvaluationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      questionAnswers: submission.questionAnswers.map(qa => ({
        score: qa.score || 0,
        feedback: qa.feedback || '',
      })),
      overallFeedback: submission.evaluation?.overallFeedback || '',
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const questionAnswers = watch('questionAnswers');

  const evaluateMutation = useMutation({
    mutationFn: (data: EvaluationFormData) => {
      const totalScore = data.questionAnswers.reduce((sum, qa) => sum + qa.score, 0);
      const maxScore = submission.questionAnswers.length * 10;
      const percentage = Math.round((totalScore / maxScore) * 100);

      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 85) grade = 'A';
      else if (percentage >= 80) grade = 'B+';
      else if (percentage >= 75) grade = 'B';
      else if (percentage >= 70) grade = 'C+';
      else if (percentage >= 65) grade = 'C';
      else if (percentage >= 60) grade = 'D';

      const evaluationData = {
        questionAnswers: submission.questionAnswers.map((qa, index) => ({
          ...qa,
          score: data.questionAnswers[index].score,
          feedback: data.questionAnswers[index].feedback,
        })),
        evaluation: {
          totalScore,
          maxScore,
          percentage,
          grade,
          evaluatedBy: 'Current Admin', // This would be the logged-in admin's name
          evaluatedAt: new Date().toISOString(),
          overallFeedback: data.overallFeedback,
        },
        status: 'Evaluated',
      };

      return ApiService.put(`/api/submissions/${submission.id}`, evaluationData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission evaluated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to evaluate submission",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EvaluationFormData) => {
    evaluateMutation.mutate(data);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentTotalScore = questionAnswers.reduce((sum, qa) => sum + qa.score, 0);
  const maxScore = submission.questionAnswers.length * 10;
  const currentPercentage = Math.round((currentTotalScore / maxScore) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Evaluate Submission - {submission.sessionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-slate-700">Date</Label>
              <p className="text-slate-900">{new Date(submission.date).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Understanding Level</Label>
              <p className="text-slate-900">{submission.overallUnderstanding}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Current Score</Label>
              <p className={`font-bold ${getScoreColor(currentTotalScore)}`}>
                {currentTotalScore}/{maxScore} ({currentPercentage}%)
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Question Evaluations */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Question Evaluations</h4>
              {submission.questionAnswers.map((qa, index) => (
                <Card key={index} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900">{qa.topic}</h4>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {qa.type === 'text' ? 'Text Answer' : 
                               qa.type === 'multiple-choice' ? 'Multiple Choice' :
                               qa.type === 'choose-best' ? 'Choose Best' :
                               qa.type === 'true-false' ? 'True/False' :
                               qa.type === 'fill-blank' ? 'Fill Blank' : 'Text Answer'}
                            </span>
                          </div>
                          <p className="text-slate-700 text-sm mt-1">{qa.question}</p>
                        </div>

                        {qa.options && qa.options.length > 0 && (
                          <div className="mb-3">
                            <Label className="text-sm font-medium text-slate-700">Available Options:</Label>
                            <div className="mt-1 space-y-1">
                              {qa.options.map((option: string, optIdx: number) => (
                                <div key={optIdx} className="text-xs text-slate-600 ml-2">
                                  • {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {qa.correctAnswer && (
                          <div className="mb-3">
                            <Label className="text-sm font-medium text-green-700">Correct Answer:</Label>
                            <div className="mt-1 p-2 bg-green-50 rounded border border-green-200">
                              <p className="text-green-800 text-sm">{qa.correctAnswer}</p>
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <Label className="text-sm font-medium text-slate-700">Student's Answer:</Label>
                          <div className="mt-1 p-3 bg-slate-50 rounded border">
                            <p className="text-slate-900">{qa.answer}</p>
                          </div>
                        </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`score-${index}`}>Score (0-10)</Label>
                          <Input
                            id={`score-${index}`}
                            type="number"
                            min="0"
                            max="10"
                            {...register(`questionAnswers.${index}.score`, { valueAsNumber: true })}
                          />
                          {errors.questionAnswers?.[index]?.score && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.questionAnswers[index]?.score?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`feedback-${index}`}>Feedback (Optional)</Label>
                          <Textarea
                            id={`feedback-${index}`}
                            placeholder="Provide feedback for this answer..."
                            rows={2}
                            className="resize-none"
                            {...register(`questionAnswers.${index}.feedback`)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Overall Feedback */}
            <div>
              <Label htmlFor="overallFeedback">Overall Feedback</Label>
              <Textarea
                id="overallFeedback"
                placeholder="Provide overall feedback for this submission..."
                rows={4}
                className="resize-none"
                {...register('overallFeedback')}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={evaluateMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}