import { z } from 'zod';
import { ObjectId } from 'mongodb';

// MongoDB Document Interfaces
export interface User {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'trainee' | 'admin' | 'superadmin';
  createdAt: Date;
}

export interface Question {
  _id?: ObjectId;
  id?: string;
  date: string;
  sessionTitle: string;
  questions: Array<{topic: string, question: string}>;
  createdBy: ObjectId;
  createdAt: Date;
}

export interface Submission {
  _id?: ObjectId;
  id?: string;
  userId: ObjectId;
  questionSetId: ObjectId;
  date: string;
  sessionTitle: string;
  questionAnswers: Array<{
    topic: string,
    question: string,
    answer: string,
    score?: number,
    feedback?: string
  }>;
  overallUnderstanding: string;
  status: string;
  remarks?: string;
  submittedAt: Date;
  evaluation?: {
    totalScore: number,
    maxScore: number,
    percentage: number,
    grade: string,
    evaluatedBy: string,
    evaluatedAt: string,
    overallFeedback?: string
  };
}

// Insert types (without _id)
export type InsertUser = Omit<User, '_id' | 'id'>;
export type InsertQuestion = Omit<Question, '_id' | 'id'>;
export type InsertSubmission = Omit<Submission, '_id' | 'id'>;

// Zod validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const questionFormSchema = z.object({
  date: z.string().min(1),
  sessionTitle: z.string().min(1),
  questions: z.array(z.object({
    topic: z.string().min(1),
    question: z.string().min(1)
  })).min(1),
});

export const testFormSchema = z.object({
  date: z.string().min(1),
  sessionTitle: z.string().min(1),
  questionAnswers: z.array(z.object({
    topic: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1)
  })).min(1),
  overallUnderstanding: z.string().min(1),
  remarks: z.string().optional(),
});

export const evaluationSchema = z.object({
  questionAnswers: z.array(z.object({
    topic: z.string(),
    question: z.string(),
    answer: z.string(),
    score: z.number().min(0).max(100),
    feedback: z.string().optional()
  })),
  overallFeedback: z.string().optional(),
});

export const updateSubmissionSchema = z.object({
  status: z.string().optional(),
  remarks: z.string().optional(),
  evaluation: z.object({
    totalScore: z.number(),
    maxScore: z.number(),
    percentage: z.number(),
    grade: z.string(),
    evaluatedBy: z.string(),
    evaluatedAt: z.string(),
    overallFeedback: z.string().optional()
  }).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['trainee', 'admin', 'superadmin']),
});

// Types
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type QuestionFormData = z.infer<typeof questionFormSchema>;
export type TestFormData = z.infer<typeof testFormSchema>;
export type EvaluationData = z.infer<typeof evaluationSchema>;
export type UpdateSubmissionData = z.infer<typeof updateSubmissionSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  QUESTIONS: 'questions',
  SUBMISSIONS: 'submissions',
} as const;