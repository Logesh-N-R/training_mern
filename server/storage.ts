
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './db';

export interface User {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'trainee' | 'admin' | 'superadmin';
  createdAt?: Date;
}

export interface Question {
  _id?: ObjectId;
  id?: string;
  date: string;
  sessionTitle: string;
  questions: Array<{
    topic: string;
    question: string;
    type: string;
    options?: string[];
    correctAnswer?: string;
  }>;
  createdBy?: ObjectId;
  createdAt?: Date;
}

export interface Submission {
  _id?: ObjectId;
  id?: string;
  questionSetId: ObjectId;
  userId: ObjectId;
  date: string;
  sessionTitle: string;
  questionAnswers: Array<{
    question: string;
    type: string;
    topic: string;
    answer: string;
    options?: string[];
    correctAnswer?: string;
    score?: number;
    feedback?: string;
  }>;
  overallUnderstanding: string;
  status: string;
  remarks?: string;
  submittedAt?: Date;
  evaluation?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    grade: string;
    evaluatedBy: string;
    evaluatedAt: string;
    overallFeedback?: string;
    questionFeedback?: Array<{
      score: number;
      feedback?: string;
    }>;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

class Storage {
  private dataDir = join(process.cwd(), 'server', 'data');

  async initializeDatabase() {
    try {
      const db = await connectToDatabase();
      console.log('Connected to MongoDB successfully');

      // Create indexes for better performance
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('submissions').createIndex({ userId: 1 });
      await db.collection('submissions').createIndex({ questionSetId: 1 });
      await db.collection('submissions').createIndex({ date: 1 });
      await db.collection('questions').createIndex({ date: 1 });

      // Create super admin if none exists
      await this.createSuperAdminIfNeeded();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createSuperAdminIfNeeded() {
    try {
      const db = await connectToDatabase();
      const superAdmin = await db.collection('users').findOne({ role: 'superadmin' });

      if (!superAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const superAdminUser = {
          name: 'Super Admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'superadmin' as const,
          createdAt: new Date(),
        };

        await db.collection('users').insertOne(superAdminUser);
        console.log('Super admin created: admin@example.com / admin123');
      }
    } catch (error) {
      console.error('Error creating super admin:', error);
    }
  }

  // User methods
  async getAllUsers(): Promise<User[]> {
    const db = await connectToDatabase();
    const users = await db.collection('users').find({}).toArray();
    return users.map(user => ({
      ...user,
      id: user._id.toString(),
    }));
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
      if (!user) return null;
      
      return {
        ...user,
        id: user._id.toString(),
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ email });
      if (!user) return null;
      
      return {
        ...user,
        id: user._id.toString(),
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, '_id' | 'id' | 'createdAt'>): Promise<User> {
    const db = await connectToDatabase();
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);
    const createdUser = await db.collection('users').findOne({ _id: result.insertedId });
    
    return {
      ...createdUser,
      id: createdUser._id.toString(),
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const db = await connectToDatabase();
      const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result) return null;

      return {
        ...result,
        id: result._id.toString(),
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      
      // Don't allow deleting super admin
      const user = await this.getUser(id);
      if (user?.role === 'superadmin') {
        return false;
      }

      const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    const db = await connectToDatabase();
    const questions = await db.collection('questions').find({}).sort({ date: -1 }).toArray();
    return questions.map(q => ({
      ...q,
      id: q._id.toString(),
    }));
  }

  async getQuestionsByDate(date: string): Promise<Question[]> {
    const db = await connectToDatabase();
    const questions = await db.collection('questions').find({ date }).toArray();
    return questions.map(q => ({
      ...q,
      id: q._id.toString(),
    }));
  }

  async createQuestion(questionData: Omit<Question, '_id' | 'id' | 'createdAt'>): Promise<Question> {
    const db = await connectToDatabase();
    
    const question = {
      ...questionData,
      createdAt: new Date(),
    };

    const result = await db.collection('questions').insertOne(question);
    const createdQuestion = await db.collection('questions').findOne({ _id: result.insertedId });
    
    return {
      ...createdQuestion,
      id: createdQuestion._id.toString(),
    };
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
    try {
      const db = await connectToDatabase();
      const result = await db.collection('questions').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result) return null;

      return {
        ...result,
        id: result._id.toString(),
      };
    } catch (error) {
      console.error('Error updating question:', error);
      return null;
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const result = await db.collection('questions').deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  // Submission methods
  async getAllSubmissions(): Promise<Submission[]> {
    const db = await connectToDatabase();
    const submissions = await db.collection('submissions').find({}).sort({ submittedAt: -1 }).toArray();
    return submissions.map(s => ({
      ...s,
      id: s._id.toString(),
    }));
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    try {
      const db = await connectToDatabase();
      console.log('Getting submissions for user ID:', userId);
      
      const submissions = await db.collection('submissions').find({ 
        userId: new ObjectId(userId) 
      }).sort({ submittedAt: -1 }).toArray();
      
      console.log('Found submissions:', submissions.length);
      
      return submissions.map(s => ({
        ...s,
        id: s._id.toString(),
      }));
    } catch (error) {
      console.error('Error getting submissions by user:', error);
      return [];
    }
  }

  async getSubmissionByUserAndDate(userId: string, date: string): Promise<Submission | null> {
    try {
      const db = await connectToDatabase();
      const submission = await db.collection('submissions').findOne({ 
        userId: new ObjectId(userId),
        date: date
      });
      
      if (!submission) return null;
      
      return {
        ...submission,
        id: submission._id.toString(),
      };
    } catch (error) {
      console.error('Error getting submission by user and date:', error);
      return null;
    }
  }

  async getSubmissionByUserAndQuestionSet(userId: string, questionSetId: string): Promise<Submission | null> {
    try {
      const db = await connectToDatabase();
      console.log('Looking for submission - User ID:', userId, 'Question Set ID:', questionSetId);
      
      const submission = await db.collection('submissions').findOne({ 
        userId: new ObjectId(userId),
        questionSetId: new ObjectId(questionSetId)
      });
      
      if (!submission) {
        console.log('No existing submission found');
        return null;
      }
      
      console.log('Found existing submission:', submission._id);
      
      return {
        ...submission,
        id: submission._id.toString(),
      };
    } catch (error) {
      console.error('Error getting submission by user and question set:', error);
      return null;
    }
  }

  async createSubmission(submissionData: Omit<Submission, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Submission> {
    const db = await connectToDatabase();
    
    console.log('Creating submission with data:', {
      ...submissionData,
      userId: submissionData.userId.toString(),
      questionSetId: submissionData.questionSetId.toString()
    });
    
    const submission = {
      ...submissionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('submissions').insertOne(submission);
    const createdSubmission = await db.collection('submissions').findOne({ _id: result.insertedId });
    
    console.log('Submission created with ID:', createdSubmission._id);
    
    return {
      ...createdSubmission,
      id: createdSubmission._id.toString(),
    };
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
    try {
      const db = await connectToDatabase();
      
      console.log('Updating submission ID:', id);
      console.log('Update data:', updates);
      
      const result = await db.collection('submissions').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result) {
        console.log('Submission not found for update');
        return null;
      }

      console.log('Submission updated successfully');
      
      return {
        ...result,
        id: result._id.toString(),
      };
    } catch (error) {
      console.error('Error updating submission:', error);
      return null;
    }
  }

  async deleteSubmission(id: string): Promise<boolean> {
    try {
      const db = await connectToDatabase();
      const result = await db.collection('submissions').deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting submission:', error);
      return false;
    }
  }
}

export const storage = new Storage();
