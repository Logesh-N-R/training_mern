import bcrypt from 'bcryptjs';
import { ObjectId, Collection } from 'mongodb';
import { connectToDatabase, getDatabase } from './db';
import { 
  User, 
  Question, 
  Submission, 
  InsertUser, 
  InsertQuestion, 
  InsertSubmission,
  COLLECTIONS
} from '@shared/schema';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Question methods
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByDate(date: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  getAllQuestions(): Promise<Question[]>;

  // Submission methods
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByUser(userId: string): Promise<Submission[]>;
  getSubmissionsByDate(date: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getAllSubmissions(): Promise<Submission[]>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined>;
  deleteSubmission(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  private usersCollection: Collection<User>;
  private questionsCollection: Collection<Question>;
  private submissionsCollection: Collection<Submission>;

  constructor() {
    // Initialize collections lazily
    this.usersCollection = null as any;
    this.questionsCollection = null as any;
    this.submissionsCollection = null as any;
  }

  private async initializeCollections() {
    if (!this.usersCollection) {
      const db = await connectToDatabase();
      this.usersCollection = db.collection<User>(COLLECTIONS.USERS);
      this.questionsCollection = db.collection<Question>(COLLECTIONS.QUESTIONS);
      this.submissionsCollection = db.collection<Submission>(COLLECTIONS.SUBMISSIONS);
    }
  }

  private transformDocumentToUser(doc: any): User {
    return {
      ...doc,
      id: doc._id.toString(),
    };
  }

  private transformDocumentToQuestion(doc: any): Question {
    return {
      ...doc,
      id: doc._id.toString(),
    };
  }

  private transformDocumentToSubmission(doc: any): Submission {
    return {
      ...doc,
      id: doc._id.toString(),
    };
  }

  async initializeSuperAdmin(): Promise<void> {
    await this.initializeCollections();
    
    const existingSuperAdmin = await this.usersCollection.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) return;

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await this.usersCollection.insertOne({
      name: 'Super Admin',
      email: 'admin@admin.com',
      password: hashedPassword,
      role: 'superadmin',
      createdAt: new Date(),
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.initializeCollections();
    
    const doc = await this.usersCollection.findOne({ _id: new ObjectId(id) });
    return doc ? this.transformDocumentToUser(doc) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.initializeCollections();
    
    const doc = await this.usersCollection.findOne({ email });
    return doc ? this.transformDocumentToUser(doc) : undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    await this.initializeCollections();
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userToInsert: InsertUser = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await this.usersCollection.insertOne(userToInsert);
    const createdUser = await this.usersCollection.findOne({ _id: result.insertedId });
    
    if (!createdUser) {
      throw new Error('Failed to create user');
    }
    
    return this.transformDocumentToUser(createdUser);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.initializeCollections();
    
    const updateData = { ...updates };
    delete updateData.id;
    delete updateData._id;

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const result = await this.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result ? this.transformDocumentToUser(result) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.initializeCollections();
    
    const result = await this.usersCollection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  async getAllUsers(): Promise<User[]> {
    await this.initializeCollections();
    
    const docs = await this.usersCollection.find({}).toArray();
    return docs.map(doc => this.transformDocumentToUser(doc));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    await this.initializeCollections();
    
    const doc = await this.questionsCollection.findOne({ _id: new ObjectId(id) });
    return doc ? this.transformDocumentToQuestion(doc) : undefined;
  }

  async getQuestionsByDate(date: string): Promise<Question[]> {
    await this.initializeCollections();
    
    const docs = await this.questionsCollection.find({ date }).toArray();
    return docs.map(doc => this.transformDocumentToQuestion(doc));
  }

  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    await this.initializeCollections();
    
    const questionToInsert: InsertQuestion = {
      ...questionData,
      createdAt: new Date(),
    };

    const result = await this.questionsCollection.insertOne(questionToInsert);
    const createdQuestion = await this.questionsCollection.findOne({ _id: result.insertedId });
    
    if (!createdQuestion) {
      throw new Error('Failed to create question');
    }
    
    return this.transformDocumentToQuestion(createdQuestion);
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined> {
    await this.initializeCollections();
    
    const updateData = { ...updates };
    delete updateData.id;
    delete updateData._id;

    const result = await this.questionsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result ? this.transformDocumentToQuestion(result) : undefined;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    await this.initializeCollections();
    
    const result = await this.questionsCollection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  async getAllQuestions(): Promise<Question[]> {
    await this.initializeCollections();
    
    const docs = await this.questionsCollection.find({}).toArray();
    return docs.map(doc => this.transformDocumentToQuestion(doc));
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    await this.initializeCollections();
    
    const doc = await this.submissionsCollection.findOne({ _id: new ObjectId(id) });
    return doc ? this.transformDocumentToSubmission(doc) : undefined;
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    await this.initializeCollections();
    
    const docs = await this.submissionsCollection.find({ userId: new ObjectId(userId) }).toArray();
    return docs.map(doc => this.transformDocumentToSubmission(doc));
  }

  async getSubmissionsByDate(date: string): Promise<Submission[]> {
    await this.initializeCollections();
    
    const docs = await this.submissionsCollection.find({ date }).toArray();
    return docs.map(doc => this.transformDocumentToSubmission(doc));
  }

  async createSubmission(submissionData: InsertSubmission): Promise<Submission> {
    await this.initializeCollections();
    
    const submissionToInsert: InsertSubmission = {
      ...submissionData,
      submittedAt: new Date(),
    };

    const result = await this.submissionsCollection.insertOne(submissionToInsert);
    const createdSubmission = await this.submissionsCollection.findOne({ _id: result.insertedId });
    
    if (!createdSubmission) {
      throw new Error('Failed to create submission');
    }
    
    return this.transformDocumentToSubmission(createdSubmission);
  }

  async getAllSubmissions(): Promise<Submission[]> {
    await this.initializeCollections();
    
    const docs = await this.submissionsCollection.find({}).toArray();
    return docs.map(doc => this.transformDocumentToSubmission(doc));
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    await this.initializeCollections();
    
    const updateData = { ...updates };
    delete updateData.id;
    delete updateData._id;

    const result = await this.submissionsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result ? this.transformDocumentToSubmission(result) : undefined;
  }

  async deleteSubmission(id: string): Promise<boolean> {
    await this.initializeCollections();
    
    const result = await this.submissionsCollection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}

export const storage = new MongoStorage();