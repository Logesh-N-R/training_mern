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
  async createTestAttempt(data: any) {
    const attempt = {
      ...data,
      traineeId: new ObjectId(data.traineeId),
      sessionId: new ObjectId(data.sessionId),
      startedAt: data.startedAt || new Date(),
      submittedAt: data.submittedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await connectToDatabase();
    const result = await db.collection('test_attempts').insertOne(attempt);
    return { ...attempt, _id: result.insertedId };
  }

  async getTestAttemptsByTrainee(traineeId: string) {
    const db = await connectToDatabase();
    return await db.collection('test_attempts')
      .find({ traineeId: new ObjectId(traineeId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getTestAttemptsBySession(sessionId: string) {
    const db = await connectToDatabase();
    return await db.collection('test_attempts')
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getAllTestAttempts() {
    const db = await connectToDatabase();
    return await db.collection('test_attempts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getTestAttemptByTraineeAndSession(traineeId: string, sessionId: string) {
    const db = await connectToDatabase();
    return await db.collection('test_attempts')
      .findOne({ 
        traineeId: new ObjectId(traineeId), 
        sessionId: new ObjectId(sessionId) 
      });
  }

  // Get test evaluation by attempt ID
  async getTestEvaluationByAttemptId(attemptId: string): Promise<TestEvaluation | null> {
    const db = await connectToDatabase();
    return db.collection(COLLECTIONS.TEST_EVALUATIONS).findOne({
      attemptId: new ObjectId(attemptId)
    }) as Promise<TestEvaluation | null>;
  }

  // Update test evaluation
  async updateTestEvaluation(id: string, updates: Partial<TestEvaluation>): Promise<TestEvaluation | null> {
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTIONS.TEST_EVALUATIONS).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result as TestEvaluation | null;
  }

  // Get test attempt by ID
  async getTestAttemptById(id: string): Promise<TestAttempt | null> {
    const db = await connectToDatabase();
    return db.collection(COLLECTIONS.TEST_ATTEMPTS).findOne({
      _id: new ObjectId(id)
    }) as Promise<TestAttempt | null>;
  }

  async getAllTestQuestions() {
    const db = await connectToDatabase();
    return await db.collection('test_questions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Test Evaluation methods
  async createTestEvaluation(data: any) {
    const evaluation = {
      ...data,
      attemptId: new ObjectId(data.attemptId),
      traineeId: new ObjectId(data.traineeId),
      sessionId: new ObjectId(data.sessionId),
      evaluatorId: new ObjectId(data.evaluatorId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await connectToDatabase();
    const result = await db.collection('test_evaluations').insertOne(evaluation);
    return { ...evaluation, _id: result.insertedId };
  }

  async getTestEvaluationsByTrainee(traineeId: string) {
    const db = await connectToDatabase();
    return await db.collection('test_evaluations')
      .find({ traineeId: new ObjectId(traineeId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getAllTestEvaluations() {
    const db = await connectToDatabase();
    return await db.collection('test_evaluations')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
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

  // Initialize database method
  async initializeDatabase(): Promise<void> {
    const db = await connectToDatabase();

    // Create indexes for better performance
    try {
      // User indexes
      await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });

      // Test session indexes
      await db.collection(COLLECTIONS.TEST_SESSIONS).createIndex({ status: 1 });
      await db.collection(COLLECTIONS.TEST_SESSIONS).createIndex({ date: 1 });

      // Test question indexes
      await db.collection(COLLECTIONS.TEST_QUESTIONS).createIndex({ sessionId: 1 });

      // Test attempt indexes
      await db.collection(COLLECTIONS.TEST_ATTEMPTS).createIndex({ traineeId: 1 });
      await db.collection(COLLECTIONS.TEST_ATTEMPTS).createIndex({ sessionId: 1 });
      await db.collection(COLLECTIONS.TEST_ATTEMPTS).createIndex({ traineeId: 1, sessionId: 1 }, { unique: true });

      // Test evaluation indexes
      await db.collection(COLLECTIONS.TEST_EVALUATIONS).createIndex({ attemptId: 1 }, { unique: true });
      await db.collection(COLLECTIONS.TEST_EVALUATIONS).createIndex({ traineeId: 1 });
      await db.collection(COLLECTIONS.TEST_EVALUATIONS).createIndex({ sessionId: 1 });

      // Performance report indexes
      await db.collection(COLLECTIONS.PERFORMANCE_REPORTS).createIndex({ traineeId: 1 });

      console.log("Database indexes initialized successfully");
    } catch (error) {
      console.error("Error creating database indexes:", error);
    }
  }
}

export const storage = new Storage();