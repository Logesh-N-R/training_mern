import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import {
  User,
  TestSession,
  TestQuestion,
  TestAttempt,
  TestEvaluation,
  PerformanceReport,
  InsertUser,
  InsertTestSession,
  InsertTestQuestion,
  InsertTestAttempt,
  InsertTestEvaluation,
  InsertPerformanceReport,
  COLLECTIONS,
} from "@shared/schema";

class Storage {
  // User methods
  async createUser(userData: InsertUser): Promise<User> {
    const db = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTIONS.USERS).insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async getUser(id: string): Promise<User | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(id) });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.USERS).findOne({ email });
  }

  async getAllUsers(): Promise<User[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.USERS).find({}).toArray();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result;
  }

  async deleteUser(id: string): Promise<boolean> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.USERS).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Test Session methods
  async createTestSession(sessionData: InsertTestSession): Promise<TestSession> {
    const db = await connectToDatabase();
    const session = {
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection(COLLECTIONS.TEST_SESSIONS).insertOne(session);
    return { ...session, _id: result.insertedId };
  }

  async getTestSession(id: string): Promise<TestSession | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_SESSIONS).findOne({ _id: new ObjectId(id) });
  }

  async getAllTestSessions(): Promise<TestSession[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_SESSIONS)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getActiveTestSessions(): Promise<TestSession[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_SESSIONS)
      .find({ status: 'active' })
      .sort({ date: 1 })
      .toArray();
  }

  async updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | null> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.TEST_SESSIONS).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result;
  }

  async deleteTestSession(id: string): Promise<boolean> {
    const db = await connectToDatabase();
    // Also delete related questions, attempts, and evaluations
    await db.collection(COLLECTIONS.TEST_QUESTIONS).deleteMany({ sessionId: new ObjectId(id) });
    await db.collection(COLLECTIONS.TEST_ATTEMPTS).deleteMany({ sessionId: new ObjectId(id) });
    await db.collection(COLLECTIONS.TEST_EVALUATIONS).deleteMany({ sessionId: new ObjectId(id) });

    const result = await db.collection(COLLECTIONS.TEST_SESSIONS).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Test Question methods
  async createTestQuestion(questionData: InsertTestQuestion): Promise<TestQuestion> {
    const db = await connectToDatabase();
    const question = {
      ...questionData,
      sessionId: new ObjectId(questionData.sessionId),
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTIONS.TEST_QUESTIONS).insertOne(question);
    return { ...question, _id: result.insertedId };
  }

  async getTestQuestionsBySession(sessionId: string): Promise<TestQuestion[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_QUESTIONS)
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ questionNumber: 1 })
      .toArray();
  }

  async updateTestQuestion(id: string, updates: Partial<TestQuestion>): Promise<TestQuestion | null> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.TEST_QUESTIONS).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result;
  }

  async deleteTestQuestion(id: string): Promise<boolean> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.TEST_QUESTIONS).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Test Attempt methods
  async createTestAttempt(attemptData: InsertTestAttempt): Promise<TestAttempt> {
    const db = await connectToDatabase();
    const attempt = {
      ...attemptData,
      sessionId: new ObjectId(attemptData.sessionId),
      traineeId: new ObjectId(attemptData.traineeId),
      answers: attemptData.answers.map(answer => ({
        ...answer,
        questionId: new ObjectId(answer.questionId),
      })),
    };

    const result = await db.collection(COLLECTIONS.TEST_ATTEMPTS).insertOne(attempt);
    return { ...attempt, _id: result.insertedId };
  }

  async getTestAttempt(id: string): Promise<TestAttempt | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_ATTEMPTS).findOne({ _id: new ObjectId(id) });
  }

  async getTestAttemptsByTrainee(traineeId: string): Promise<TestAttempt[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_ATTEMPTS)
      .find({ traineeId: new ObjectId(traineeId) })
      .sort({ startedAt: -1 })
      .toArray();
  }

  async getTestAttemptsBySession(sessionId: string): Promise<TestAttempt[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_ATTEMPTS)
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ submittedAt: -1 })
      .toArray();
  }

  async getAllTestAttempts(): Promise<TestAttempt[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_ATTEMPTS)
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();
  }

  async getTestAttemptByTraineeAndSession(traineeId: string, sessionId: string): Promise<TestAttempt | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_ATTEMPTS).findOne({
      traineeId: new ObjectId(traineeId),
      sessionId: new ObjectId(sessionId),
    });
  }

  async updateTestAttempt(id: string, updates: Partial<TestAttempt>): Promise<TestAttempt | null> {
    const db = await connectToDatabase();
    const processedUpdates = { ...updates };
    if (updates.answers) {
      processedUpdates.answers = updates.answers.map(answer => ({
        ...answer,
        questionId: new ObjectId(answer.questionId),
      }));
    }

    const result = await db.collection(COLLECTIONS.TEST_ATTEMPTS).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: processedUpdates },
      { returnDocument: "after" }
    );
    return result;
  }

  // Test Evaluation methods
  async createTestEvaluation(evaluationData: InsertTestEvaluation): Promise<TestEvaluation> {
    const db = await connectToDatabase();
    const evaluation = {
      ...evaluationData,
      attemptId: new ObjectId(evaluationData.attemptId),
      sessionId: new ObjectId(evaluationData.sessionId),
      traineeId: new ObjectId(evaluationData.traineeId),
      evaluatorId: new ObjectId(evaluationData.evaluatorId),
      questionEvaluations: evaluationData.questionEvaluations.map(qe => ({
        ...qe,
        questionId: new ObjectId(qe.questionId),
      })),
      evaluatedAt: new Date(),
    };

    const result = await db.collection(COLLECTIONS.TEST_EVALUATIONS).insertOne(evaluation);
    return { ...evaluation, _id: result.insertedId };
  }

  async getTestEvaluation(id: string): Promise<TestEvaluation | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_EVALUATIONS).findOne({ _id: new ObjectId(id) });
  }

  async getTestEvaluationByAttempt(attemptId: string): Promise<TestEvaluation | null> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_EVALUATIONS).findOne({ attemptId: new ObjectId(attemptId) });
  }

  async getTestEvaluationsByTrainee(traineeId: string): Promise<TestEvaluation[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_EVALUATIONS)
      .find({ traineeId: new ObjectId(traineeId) })
      .sort({ evaluatedAt: -1 })
      .toArray();
  }

  async getAllTestEvaluations(): Promise<TestEvaluation[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.TEST_EVALUATIONS)
      .find({})
      .sort({ evaluatedAt: -1 })
      .toArray();
  }

  async updateTestEvaluation(id: string, updates: Partial<TestEvaluation>): Promise<TestEvaluation | null> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.TEST_EVALUATIONS).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result;
  }

  // Performance Report methods
  async createPerformanceReport(reportData: InsertPerformanceReport): Promise<PerformanceReport> {
    const db = await connectToDatabase();
    const report = {
      ...reportData,
      traineeId: new ObjectId(reportData.traineeId),
      generatedAt: new Date(),
    };

    const result = await db.collection(COLLECTIONS.PERFORMANCE_REPORTS).insertOne(report);
    return { ...report, _id: result.insertedId };
  }

  async getPerformanceReportsByTrainee(traineeId: string): Promise<PerformanceReport[]> {
    const db = await connectToDatabase();
    return await db.collection(COLLECTIONS.PERFORMANCE_REPORTS)
      .find({ traineeId: new ObjectId(traineeId) })
      .sort({ generatedAt: -1 })
      .toArray();
  }
}

export const storage = new Storage();