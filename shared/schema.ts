
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

export interface TestSession {
  _id?: ObjectId;
  id?: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestQuestion {
  _id?: ObjectId;
  id?: string;
  sessionId: ObjectId;
  questionNumber: number;
  category: string;
  question: string;
  type: 'multiple-choice' | 'single-choice' | 'text-input' | 'essay' | 'true-false';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
}

export interface TestAttempt {
  _id?: ObjectId;
  id?: string;
  sessionId: ObjectId;
  traineeId: ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  status: 'in-progress' | 'submitted' | 'evaluated' | 'expired';
  answers: TestAnswer[];
  timeSpent: number; // in minutes
  ipAddress?: string;
  userAgent?: string;
}

export interface TestAnswer {
  questionId: ObjectId;
  questionNumber: number;
  answer: string | number | string[];
  timeSpent: number; // in seconds
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
}

export interface TestEvaluation {
  _id?: ObjectId;
  id?: string;
  attemptId: ObjectId;
  sessionId: ObjectId;
  traineeId: ObjectId;
  evaluatorId: ObjectId;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  overallFeedback: string;
  questionFeedback?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Insert types (without _id)
export type InsertUser = Omit<User, '_id' | 'id'>;
export type InsertTestSession = Omit<TestSession, '_id' | 'id'>;
export type InsertTestQuestion = Omit<TestQuestion, '_id' | 'id'>;
export type InsertTestAttempt = Omit<TestAttempt, '_id' | 'id'>;
export type InsertTestEvaluation = Omit<TestEvaluation, '_id' | 'id'>;

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

export const testSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  duration: z.number().min(1),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
});

export const testQuestionSchema = z.object({
  sessionId: z.string().min(1),
  questionNumber: z.number().min(1),
  category: z.string().min(1),
  question: z.string().min(1),
  type: z.enum(['multiple-choice', 'single-choice', 'text-input', 'essay', 'true-false']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]).optional(),
  points: z.number().min(1).default(10),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).default([]),
});

export const testAttemptSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string(),
    questionNumber: z.number(),
    answer: z.union([z.string(), z.number(), z.array(z.string())]),
    timeSpent: z.number().min(0),
  })),
  timeSpent: z.number().min(0),
});

export const testEvaluationSchema = z.object({
  attemptId: z.string().min(1),
  totalScore: z.number().min(0),
  maxScore: z.number().min(1),
  percentage: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  overallFeedback: z.string().optional(),
  questionFeedback: z.array(z.string()).optional(),
});

export const questionFormSchema = z.object({
  date: z.string().min(1),
  sessionTitle: z.string().min(1),
  questions: z.array(z.object({
    topic: z.string().min(1),
    question: z.string().min(1),
    type: z.enum(['text', 'multiple-choice', 'choose-best', 'true-false', 'fill-blank']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number()]).optional(),
    explanation: z.string().optional(),
  })).min(1),
});

// Types
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type TestSessionData = z.infer<typeof testSessionSchema>;
export type TestQuestionData = z.infer<typeof testQuestionSchema>;
export type TestAttemptData = z.infer<typeof testAttemptSchema>;
export type TestEvaluationData = z.infer<typeof testEvaluationSchema>;
export type QuestionFormData = z.infer<typeof questionFormSchema>;

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TEST_SESSIONS: 'test_sessions',
  TEST_QUESTIONS: 'test_questions', 
  TEST_ATTEMPTS: 'test_attempts',
  TEST_EVALUATIONS: 'test_evaluations',
  QA_QUESTIONS: 'qa_questions',
} as const;
