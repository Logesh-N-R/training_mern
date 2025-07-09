import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { users, questions, submissions } from '@shared/schema';

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

async function migrateUsers(): Promise<Map<string, number>> {
  const userIdMap = new Map<string, number>();
  
  const usersPath = join(process.cwd(), 'server/data/users.json');
  if (!existsSync(usersPath)) {
    console.log('No users.json file found, skipping user migration');
    return userIdMap;
  }

  try {
    const usersData = JSON.parse(readFileSync(usersPath, 'utf-8')) as OldUser[];
    console.log(`Migrating ${usersData.length} users...`);

    for (const oldUser of usersData) {
      const [newUser] = await db.insert(users).values({
        name: oldUser.name,
        email: oldUser.email,
        password: oldUser.password,
        role: oldUser.role,
        createdAt: new Date(oldUser.createdAt),
      }).returning();
      
      userIdMap.set(oldUser.id, newUser.id);
      console.log(`✓ Migrated user: ${oldUser.name} (${oldUser.id} → ${newUser.id})`);
    }
    
    return userIdMap;
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
}

async function migrateQuestions(userIdMap: Map<string, number>): Promise<Map<string, number>> {
  const questionIdMap = new Map<string, number>();
  
  const questionsPath = join(process.cwd(), 'server/data/questions.json');
  if (!existsSync(questionsPath)) {
    console.log('No questions.json file found, skipping question migration');
    return questionIdMap;
  }

  try {
    const questionsData = JSON.parse(readFileSync(questionsPath, 'utf-8')) as OldQuestion[];
    console.log(`Migrating ${questionsData.length} questions...`);

    for (const oldQuestion of questionsData) {
      const createdById = userIdMap.get(oldQuestion.createdBy);
      if (!createdById) {
        console.warn(`⚠ Skipping question ${oldQuestion.id} - creator not found: ${oldQuestion.createdBy}`);
        continue;
      }

      const [newQuestion] = await db.insert(questions).values({
        date: oldQuestion.date,
        sessionTitle: oldQuestion.sessionTitle,
        questions: oldQuestion.questions,
        createdBy: createdById,
        createdAt: new Date(oldQuestion.createdAt),
      }).returning();
      
      questionIdMap.set(oldQuestion.id, newQuestion.id);
      console.log(`✓ Migrated question: ${oldQuestion.sessionTitle} (${oldQuestion.id} → ${newQuestion.id})`);
    }
    
    return questionIdMap;
  } catch (error) {
    console.error('Error migrating questions:', error);
    throw error;
  }
}

async function migrateSubmissions(userIdMap: Map<string, number>, questionIdMap: Map<string, number>): Promise<void> {
  const submissionsPath = join(process.cwd(), 'server/data/submissions.json');
  if (!existsSync(submissionsPath)) {
    console.log('No submissions.json file found, skipping submission migration');
    return;
  }

  try {
    const submissionsData = JSON.parse(readFileSync(submissionsPath, 'utf-8')) as OldSubmission[];
    console.log(`Migrating ${submissionsData.length} submissions...`);

    for (const oldSubmission of submissionsData) {
      const userId = userIdMap.get(oldSubmission.userId);
      const questionSetId = questionIdMap.get(oldSubmission.questionSetId);
      
      if (!userId) {
        console.warn(`⚠ Skipping submission ${oldSubmission.id} - user not found: ${oldSubmission.userId}`);
        continue;
      }
      
      if (!questionSetId) {
        console.warn(`⚠ Skipping submission ${oldSubmission.id} - question set not found: ${oldSubmission.questionSetId}`);
        continue;
      }

      const [newSubmission] = await db.insert(submissions).values({
        userId,
        questionSetId,
        date: oldSubmission.date,
        sessionTitle: oldSubmission.sessionTitle,
        questionAnswers: oldSubmission.questionAnswers,
        overallUnderstanding: oldSubmission.overallUnderstanding,
        status: oldSubmission.status,
        remarks: oldSubmission.remarks,
        submittedAt: new Date(oldSubmission.submittedAt),
        evaluation: oldSubmission.evaluation,
      }).returning();
      
      console.log(`✓ Migrated submission: ${oldSubmission.id} → ${newSubmission.id}`);
    }
  } catch (error) {
    console.error('Error migrating submissions:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting data migration from JSON files to PostgreSQL...\n');
    
    // Clear existing data
    console.log('🧹 Clearing existing database data...');
    await db.delete(submissions);
    await db.delete(questions);
    await db.delete(users);
    console.log('✓ Database cleared\n');

    // Migrate in order (users first, then questions, then submissions)
    const userIdMap = await migrateUsers();
    console.log('');
    
    const questionIdMap = await migrateQuestions(userIdMap);
    console.log('');
    
    await migrateSubmissions(userIdMap, questionIdMap);
    console.log('');

    console.log('✅ Data migration completed successfully!');
    console.log(`📊 Migration summary:`);
    console.log(`   Users: ${userIdMap.size}`);
    console.log(`   Questions: ${questionIdMap.size}`);
    console.log(`   Submissions: migrated based on available data`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}