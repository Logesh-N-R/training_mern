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

  async updateTestAttempt(id: string, updates: any) {
    const db = await connectToDatabase();
    const result = await db.collection('test_attempts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
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

  // Initialize database with required indexes
  async initializeDatabase() {
    const db = await connectToDatabase();

    try {
      // Create indexes for better performance - only for collections that actually exist
      const collections = ['users', 'test_sessions', 'test_attempts', 'test_evaluations', 'test_questions', 'performance_reports'];

      for (const collectionName of collections) {
        try {
          switch (collectionName) {
            case 'users':
              await db.collection(collectionName).createIndex({ email: 1 }, { unique: true });
              break;
            case 'test_sessions':
              await db.collection(collectionName).createIndex({ date: 1 });
              await db.collection(collectionName).createIndex({ status: 1 });
              break;
            case 'test_attempts':
              await db.collection(collectionName).createIndex({ traineeId: 1 });
              await db.collection(collectionName).createIndex({ sessionId: 1 });
              break;
            case 'test_evaluations':
              await db.collection(collectionName).createIndex({ attemptId: 1 });
              break;
            case 'test_questions':
              await db.collection(collectionName).createIndex({ sessionId: 1 });
              break;
            case 'performance_reports':
              await db.collection(collectionName).createIndex({ traineeId: 1 });
              break;
          }
        } catch (indexError) {
          console.warn(`Failed to create index for ${collectionName}:`, indexError.message);
        }
      }

      console.log('Database initialization completed');
    } catch (error) {
      console.error('Error during database initialization:', error);
    }
  }

  // Additional methods for submission compatibility
  async getAllSubmissions() {
    try {
      const db = await connectToDatabase();
      const submissions = await db.collection(COLLECTIONS.TEST_ATTEMPTS).find({}).sort({ submittedAt: -1 }).toArray();

      return submissions.map(submission => ({
        ...submission,
        id: submission._id?.toString()
      }));
    } catch (error) {
      console.error('Error getting all submissions:', error);
      return [];
    }
  }

  async getSubmissionsByUser(userId: string) {
    try {
      const db = await connectToDatabase();
      const submissions = await db.collection(COLLECTIONS.TEST_ATTEMPTS).find({
        traineeId: userId
      }).sort({ submittedAt: -1 }).toArray();

      return submissions.map(submission => ({
        ...submission,
        id: submission._id?.toString()
      }));
    } catch (error) {
      console.error('Error getting user submissions:', error);
      return [];
    }
  }

  async updateSubmission(id: string, updates: any) {
    try {
      const db = await connectToDatabase();
      const result = await db.collection(COLLECTIONS.TEST_ATTEMPTS).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result) {
        return null;
      }

      return {
        ...result,
        id: result._id?.toString()
      };
    } catch (error) {
      console.error('Error updating submission:', error);
      return null;
    }
  }
}

export const storage = new Storage();