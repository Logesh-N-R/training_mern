import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';
import { COLLECTIONS } from '@shared/schema';
import { readJsonFile } from './utils/fileStorage';

interface OldUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'trainee' | 'admin' | 'superadmin';
  createdAt: string;
}

interface OldQuestion {
  id: string;
  date: string;
  sessionTitle: string;
  questions: Array<{topic: string, question: string}>;
  createdBy: string;
  createdAt: string;
}

interface OldSubmission {
  id: string;
  userId: string;
  questionSetId: string;
  date: string;
  sessionTitle: string;
  questionAnswers: Array<{
    topic: string;
    question: string;
    answer: string;
    score?: number;
    feedback?: string;
  }>;
  overallUnderstanding: string;
  status: string;
  remarks?: string;
  submittedAt: string;
  evaluation?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    grade: string;
    evaluatedBy: string;
    evaluatedAt: string;
    overallFeedback?: string;
  };
}

async function migrateUsers(): Promise<Map<string, ObjectId>> {
  const db = await connectToDatabase();
  const usersCollection = db.collection(COLLECTIONS.USERS);
  
  console.log('Starting user migration...');
  
  try {
    const oldUsers = await readJsonFile<OldUser>('users.json');
    const userIdMap = new Map<string, ObjectId>();
    
    for (const oldUser of oldUsers) {
      const newUser = {
        name: oldUser.name,
        email: oldUser.email,
        password: oldUser.password, // Already hashed from JSON
        role: oldUser.role,
        createdAt: new Date(oldUser.createdAt),
      };
      
      const result = await usersCollection.insertOne(newUser);
      // Map both old ID and email to the new ObjectId
      userIdMap.set(oldUser.id, result.insertedId);
      userIdMap.set(oldUser.email, result.insertedId);
      console.log(`Migrated user: ${oldUser.email} -> ${result.insertedId}`);
    }
    
    console.log(`Successfully migrated ${oldUsers.length} users`);
    return userIdMap;
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
}

async function migrateQuestions(userIdMap: Map<string, ObjectId>): Promise<Map<string, ObjectId>> {
  const db = await connectToDatabase();
  const questionsCollection = db.collection(COLLECTIONS.QUESTIONS);
  
  console.log('Starting question migration...');
  
  try {
    const oldQuestions = await readJsonFile<OldQuestion>('questions.json');
    const questionIdMap = new Map<string, ObjectId>();
    
    for (const oldQuestion of oldQuestions) {
      const createdByObjectId = userIdMap.get(oldQuestion.createdBy);
      if (!createdByObjectId) {
        console.warn(`Could not find user ID for question creator: ${oldQuestion.createdBy}`);
        console.log('Available user mappings:', Array.from(userIdMap.keys()));
        continue;
      }
      
      const newQuestion = {
        date: oldQuestion.date,
        sessionTitle: oldQuestion.sessionTitle,
        questions: oldQuestion.questions,
        createdBy: createdByObjectId,
        createdAt: new Date(oldQuestion.createdAt),
      };
      
      const result = await questionsCollection.insertOne(newQuestion);
      questionIdMap.set(oldQuestion.id, result.insertedId);
      console.log(`Migrated question: ${oldQuestion.sessionTitle} -> ${result.insertedId}`);
    }
    
    console.log(`Successfully migrated ${oldQuestions.length} questions`);
    return questionIdMap;
  } catch (error) {
    console.error('Error migrating questions:', error);
    throw error;
  }
}

async function migrateSubmissions(userIdMap: Map<string, ObjectId>, questionIdMap: Map<string, ObjectId>): Promise<void> {
  const db = await connectToDatabase();
  const submissionsCollection = db.collection(COLLECTIONS.SUBMISSIONS);
  
  console.log('Starting submission migration...');
  
  try {
    const oldSubmissions = await readJsonFile<OldSubmission>('submissions.json');
    
    for (const oldSubmission of oldSubmissions) {
      const userObjectId = userIdMap.get(oldSubmission.userId);
      const questionObjectId = questionIdMap.get(oldSubmission.questionSetId);
      
      if (!userObjectId) {
        console.warn(`Could not find user ID for submission: ${oldSubmission.userId}`);
        console.log('Available user mappings:', Array.from(userIdMap.keys()));
        continue;
      }
      
      if (!questionObjectId) {
        console.warn(`Could not find question ID for submission: ${oldSubmission.questionSetId}`);
        console.log('Available question mappings:', Array.from(questionIdMap.keys()));
        continue;
      }
      
      const newSubmission = {
        userId: userObjectId,
        questionSetId: questionObjectId,
        date: oldSubmission.date,
        sessionTitle: oldSubmission.sessionTitle,
        questionAnswers: oldSubmission.questionAnswers,
        overallUnderstanding: oldSubmission.overallUnderstanding,
        status: oldSubmission.status,
        remarks: oldSubmission.remarks,
        submittedAt: new Date(oldSubmission.submittedAt),
        evaluation: oldSubmission.evaluation,
      };
      
      const result = await submissionsCollection.insertOne(newSubmission);
      console.log(`Migrated submission: ${oldSubmission.id} -> ${result.insertedId}`);
    }
    
    console.log(`Successfully migrated ${oldSubmissions.length} submissions`);
  } catch (error) {
    console.error('Error migrating submissions:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting migration from JSON files to MongoDB...');
    
    // Migrate users first to get the ID mappings
    const userIdMap = await migrateUsers();
    
    // Migrate questions using the user ID map
    const questionIdMap = await migrateQuestions(userIdMap);
    
    // Migrate submissions using both ID maps
    await migrateSubmissions(userIdMap, questionIdMap);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
main();