var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/db.ts
import { MongoClient } from "mongodb";
async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  }
  return db;
}
var client, db, MONGODB_URI, DB_NAME;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://logeshnr17:FfY1VxMqKHVNwsL2@cluster0.y6gasxf.mongodb.net/ProjectDB?retryWrites=true&w=majority";
    DB_NAME = process.env.DB_NAME || "daily_training_test";
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storage: () => storage
});
import { join } from "path";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
var Storage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    Storage = class {
      dataDir = join(process.cwd(), "server", "data");
      async initializeDatabase() {
        try {
          const db2 = await connectToDatabase();
          console.log("Connected to MongoDB successfully");
          await db2.collection("users").createIndex({ email: 1 }, { unique: true });
          await db2.collection("submissions").createIndex({ userId: 1 });
          await db2.collection("submissions").createIndex({ questionSetId: 1 });
          await db2.collection("submissions").createIndex({ date: 1 });
          await db2.collection("questions").createIndex({ date: 1 });
          await this.createSuperAdminIfNeeded();
        } catch (error) {
          console.error("Database initialization error:", error);
          throw error;
        }
      }
      async createSuperAdminIfNeeded() {
        try {
          const db2 = await connectToDatabase();
          const superAdmin = await db2.collection("users").findOne({ role: "superadmin" });
          if (!superAdmin) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            const superAdminUser = {
              name: "Super Admin",
              email: "admin@example.com",
              password: hashedPassword,
              role: "superadmin",
              createdAt: /* @__PURE__ */ new Date()
            };
            await db2.collection("users").insertOne(superAdminUser);
            console.log("Super admin created: admin@example.com / admin123");
          }
        } catch (error) {
          console.error("Error creating super admin:", error);
        }
      }
      // User methods
      async getAllUsers() {
        const db2 = await connectToDatabase();
        const users = await db2.collection("users").find({}).toArray();
        return users.map((user) => ({
          ...user,
          id: user._id.toString()
        }));
      }
      async getUser(id) {
        try {
          const db2 = await connectToDatabase();
          const user = await db2.collection("users").findOne({ _id: new ObjectId(id) });
          if (!user) return null;
          return {
            ...user,
            id: user._id.toString()
          };
        } catch (error) {
          console.error("Error getting user:", error);
          return null;
        }
      }
      async getUserByEmail(email) {
        try {
          const db2 = await connectToDatabase();
          const user = await db2.collection("users").findOne({ email });
          if (!user) return null;
          return {
            ...user,
            id: user._id.toString()
          };
        } catch (error) {
          console.error("Error getting user by email:", error);
          return null;
        }
      }
      async createUser(userData) {
        const db2 = await connectToDatabase();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = {
          ...userData,
          password: hashedPassword,
          createdAt: /* @__PURE__ */ new Date()
        };
        const result = await db2.collection("users").insertOne(user);
        const createdUser = await db2.collection("users").findOne({ _id: result.insertedId });
        return {
          ...createdUser,
          id: createdUser._id.toString()
        };
      }
      async updateUser(id, updates) {
        try {
          const db2 = await connectToDatabase();
          const result = await db2.collection("users").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: /* @__PURE__ */ new Date() } },
            { returnDocument: "after" }
          );
          if (!result) return null;
          return {
            ...result,
            id: result._id.toString()
          };
        } catch (error) {
          console.error("Error updating user:", error);
          return null;
        }
      }
      async deleteUser(id) {
        try {
          const db2 = await connectToDatabase();
          const user = await this.getUser(id);
          if (user?.role === "superadmin") {
            return false;
          }
          const result = await db2.collection("users").deleteOne({ _id: new ObjectId(id) });
          return result.deletedCount > 0;
        } catch (error) {
          console.error("Error deleting user:", error);
          return false;
        }
      }
      // Question methods
      async getAllQuestions() {
        const db2 = await connectToDatabase();
        const questions = await db2.collection("questions").find({}).sort({ date: -1 }).toArray();
        return questions.map((q) => ({
          ...q,
          id: q._id.toString()
        }));
      }
      async getQuestionsByDate(date) {
        const db2 = await connectToDatabase();
        const questions = await db2.collection("questions").find({ date }).toArray();
        return questions.map((q) => ({
          ...q,
          id: q._id.toString()
        }));
      }
      async createQuestion(questionData) {
        const db2 = await connectToDatabase();
        const question = {
          ...questionData,
          createdAt: /* @__PURE__ */ new Date()
        };
        const result = await db2.collection("questions").insertOne(question);
        const createdQuestion = await db2.collection("questions").findOne({ _id: result.insertedId });
        return {
          ...createdQuestion,
          id: createdQuestion._id.toString()
        };
      }
      async updateQuestion(id, updates) {
        try {
          const db2 = await connectToDatabase();
          const result = await db2.collection("questions").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: /* @__PURE__ */ new Date() } },
            { returnDocument: "after" }
          );
          if (!result) return null;
          return {
            ...result,
            id: result._id.toString()
          };
        } catch (error) {
          console.error("Error updating question:", error);
          return null;
        }
      }
      async deleteQuestion(id) {
        try {
          const db2 = await connectToDatabase();
          const result = await db2.collection("questions").deleteOne({ _id: new ObjectId(id) });
          return result.deletedCount > 0;
        } catch (error) {
          console.error("Error deleting question:", error);
          return false;
        }
      }
      // Submission methods
      async getAllSubmissions() {
        const db2 = await connectToDatabase();
        const submissions = await db2.collection("submissions").find({}).sort({ submittedAt: -1 }).toArray();
        return submissions.map((s) => ({
          ...s,
          id: s._id.toString()
        }));
      }
      async getSubmissionsByUser(userId) {
        try {
          const db2 = await connectToDatabase();
          console.log("Getting submissions for user ID:", userId);
          const submissions = await db2.collection("submissions").find({
            userId: new ObjectId(userId)
          }).sort({ submittedAt: -1 }).toArray();
          console.log("Found submissions:", submissions.length);
          return submissions.map((s) => ({
            ...s,
            id: s._id.toString()
          }));
        } catch (error) {
          console.error("Error getting submissions by user:", error);
          return [];
        }
      }
      async getSubmissionByUserAndDate(userId, date) {
        try {
          const db2 = await connectToDatabase();
          const submission = await db2.collection("submissions").findOne({
            userId: new ObjectId(userId),
            date
          });
          if (!submission) return null;
          return {
            ...submission,
            id: submission._id.toString()
          };
        } catch (error) {
          console.error("Error getting submission by user and date:", error);
          return null;
        }
      }
      async getSubmissionByUserAndQuestionSet(userId, questionSetId) {
        try {
          const db2 = await connectToDatabase();
          console.log("Looking for submission - User ID:", userId, "Question Set ID:", questionSetId);
          const submission = await db2.collection("submissions").findOne({
            userId: new ObjectId(userId),
            questionSetId: new ObjectId(questionSetId)
          });
          if (!submission) {
            console.log("No existing submission found");
            return null;
          }
          console.log("Found existing submission:", submission._id);
          return {
            ...submission,
            id: submission._id.toString()
          };
        } catch (error) {
          console.error("Error getting submission by user and question set:", error);
          return null;
        }
      }
      async createSubmission(submissionData) {
        const db2 = await connectToDatabase();
        console.log("Creating submission with data:", {
          ...submissionData,
          userId: submissionData.userId.toString(),
          questionSetId: submissionData.questionSetId.toString()
        });
        const submission = {
          ...submissionData,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        const result = await db2.collection("submissions").insertOne(submission);
        const createdSubmission = await db2.collection("submissions").findOne({ _id: result.insertedId });
        console.log("Submission created with ID:", createdSubmission._id);
        return {
          ...createdSubmission,
          id: createdSubmission._id.toString()
        };
      }
      async updateSubmission(id, updates) {
        try {
          const db2 = await connectToDatabase();
          console.log("Updating submission ID:", id);
          console.log("Update data:", updates);
          const result = await db2.collection("submissions").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: /* @__PURE__ */ new Date() } },
            { returnDocument: "after" }
          );
          if (!result) {
            console.log("Submission not found for update");
            return null;
          }
          console.log("Submission updated successfully");
          return {
            ...result,
            id: result._id.toString()
          };
        } catch (error) {
          console.error("Error updating submission:", error);
          return null;
        }
      }
      async deleteSubmission(id) {
        try {
          const db2 = await connectToDatabase();
          const result = await db2.collection("submissions").deleteOne({ _id: new ObjectId(id) });
          return result.deletedCount > 0;
        } catch (error) {
          console.error("Error deleting submission:", error);
          return false;
        }
      }
    };
    storage = new Storage();
  }
});

// server/services/powerpoint-extractor.ts
var PowerPointExtractor;
var init_powerpoint_extractor = __esm({
  "server/services/powerpoint-extractor.ts"() {
    "use strict";
    PowerPointExtractor = class {
      static async extractContent(buffer, filename) {
        try {
          const sizeInMB = (buffer.length / (1024 * 1024)).toFixed(2);
          return `
Extracted content from PowerPoint presentation: ${filename}
File size: ${sizeInMB} MB

This is a placeholder implementation. The actual content would include:
- Slide titles and text content
- Bullet points and structured data
- Image descriptions and captions
- Notes and speaker comments

To implement real PowerPoint extraction, consider using:
1. officegen-docx or similar libraries
2. External conversion tools
3. Cloud-based document parsing APIs

Sample extracted content:
- Introduction to React Components
- State Management with Hooks
- Component Lifecycle Methods
- Best Practices and Patterns
- Testing React Applications
      `.trim();
        } catch (error) {
          console.error("PowerPoint extraction error:", error);
          throw new Error("Failed to extract content from PowerPoint file");
        }
      }
      static getSupportedFormats() {
        return [".ppt", ".pptx", ".odp"];
      }
      static isValidFile(filename) {
        const supportedFormats = this.getSupportedFormats();
        return supportedFormats.some(
          (format) => filename.toLowerCase().endsWith(format)
        );
      }
    };
  }
});

// server/services/ai-prompt-templates.ts
var AIPromptTemplates;
var init_ai_prompt_templates = __esm({
  "server/services/ai-prompt-templates.ts"() {
    "use strict";
    AIPromptTemplates = class {
      static getSystemPrompt(questionTypes, count) {
        return `You are an expert educator and assessment creator. Your role is to generate high-quality, educational questions that effectively test understanding and knowledge retention.

INSTRUCTIONS:
1. Create ${count} diverse, meaningful questions
2. Use these question types: ${questionTypes.join(", ")}
3. Ensure questions test different cognitive levels (knowledge, comprehension, application, analysis)
4. Make questions clear, unambiguous, and educationally valuable
5. Provide accurate answers and helpful explanations

QUESTION TYPES DEFINITIONS:
- text: Open-ended questions requiring written responses
- multiple-choice: Questions with 4 options, only one correct
- choose-best: Questions asking for the best option among good choices
- true-false: Binary questions with clear true/false answers
- fill-blank: Questions with missing words or phrases to complete

OUTPUT FORMAT:
Return a JSON array of question objects with this exact structure:
[
  {
    "topic": "Clear topic name",
    "question": "Well-formed question text",
    "type": "question_type",
    "options": ["option1", "option2", "option3", "option4"], // Only for choice-based questions
    "correctAnswer": "Exact correct answer",
    "explanation": "Clear explanation of why this answer is correct"
  }
]

QUALITY STANDARDS:
- Questions should be at appropriate difficulty level
- Avoid trick questions or ambiguous wording
- Ensure options are plausible for multiple-choice questions
- Explanations should enhance learning, not just state correctness`;
      }
      static getContentPrompt(content, additionalPrompt) {
        let prompt = `Based on the following content, generate educational questions:

${content}`;
        if (additionalPrompt) {
          prompt += `

Additional instructions: ${additionalPrompt}`;
        }
        return prompt;
      }
      static getFileBasedPrompt(filename, extractedContent, additionalPrompt) {
        let prompt = `Based on the PowerPoint presentation "${filename}", generate educational questions from this extracted content:

${extractedContent}`;
        if (additionalPrompt) {
          prompt += `

Additional instructions: ${additionalPrompt}`;
        }
        return prompt;
      }
      static getTopicPrompt(topic, additionalPrompt) {
        let prompt = `Generate educational questions about the topic: ${topic}`;
        if (additionalPrompt) {
          prompt += `

Additional instructions: ${additionalPrompt}`;
        }
        return prompt;
      }
    };
  }
});

// server/services/ai-question-generator.ts
var ai_question_generator_exports = {};
__export(ai_question_generator_exports, {
  AIQuestionGenerator: () => AIQuestionGenerator
});
var AIQuestionGenerator;
var init_ai_question_generator = __esm({
  "server/services/ai-question-generator.ts"() {
    "use strict";
    init_powerpoint_extractor();
    init_ai_prompt_templates();
    AIQuestionGenerator = class {
      static async generateQuestions(request) {
        const { content, prompt, questionTypes, count = 5, file } = request;
        let finalContent = content || "";
        if (file && PowerPointExtractor.isValidFile(file.filename)) {
          try {
            const extractedContent = await PowerPointExtractor.extractContent(file.buffer, file.filename);
            finalContent = extractedContent;
          } catch (error) {
            console.error("PowerPoint extraction failed:", error);
          }
        }
        const systemPrompt = AIPromptTemplates.getSystemPrompt(questionTypes, count);
        let userPrompt;
        if (file && finalContent) {
          userPrompt = AIPromptTemplates.getFileBasedPrompt(file.filename, finalContent, prompt);
        } else if (finalContent) {
          userPrompt = AIPromptTemplates.getContentPrompt(finalContent, prompt);
        } else if (prompt) {
          userPrompt = AIPromptTemplates.getTopicPrompt(prompt, void 0);
        } else {
          userPrompt = "Generate general educational questions covering fundamental concepts.";
        }
        const topics = this.extractTopicsFromContent(finalContent, userPrompt);
        const mockQuestions = this.generateMockQuestions(topics, questionTypes, count);
        return mockQuestions;
      }
      static extractTopicsFromContent(content, prompt) {
        const defaultTopics = ["Fundamentals", "Best Practices", "Advanced Concepts"];
        if (content.toLowerCase().includes("react")) {
          return ["React Components", "State Management", "React Hooks", "Performance"];
        } else if (content.toLowerCase().includes("javascript")) {
          return ["JavaScript Basics", "ES6 Features", "Async Programming", "DOM Manipulation"];
        } else if (content.toLowerCase().includes("python")) {
          return ["Python Basics", "Data Structures", "Object-Oriented Programming", "Libraries"];
        } else if (prompt.toLowerCase().includes("database")) {
          return ["Database Design", "SQL Queries", "Normalization", "Indexing"];
        }
        return defaultTopics;
      }
      static generateMockQuestions(topics, questionTypes, count) {
        const questions = [];
        const questionsPerTopic = Math.ceil(count / topics.length);
        for (let i = 0; i < topics.length && questions.length < count; i++) {
          const topic = topics[i];
          const remainingCount = count - questions.length;
          const questionsToGenerate = Math.min(questionsPerTopic, remainingCount);
          for (let j = 0; j < questionsToGenerate; j++) {
            const questionType = questionTypes[j % questionTypes.length];
            questions.push(this.createMockQuestion(topic, questionType, j + 1));
          }
        }
        return questions;
      }
      static createMockQuestion(topic, type, index) {
        const baseQuestion = {
          topic,
          explanation: `This question tests understanding of ${topic.toLowerCase()} concepts.`
        };
        switch (type) {
          case "multiple-choice":
            return {
              ...baseQuestion,
              question: `What is a key concept in ${topic}? (Question ${index})`,
              type,
              options: [
                `Correct understanding of ${topic}`,
                `Incorrect option A`,
                `Incorrect option B`,
                `Incorrect option C`
              ],
              correctAnswer: `Correct understanding of ${topic}`
            };
          case "true-false":
            return {
              ...baseQuestion,
              question: `${topic} follows standard best practices. (Statement ${index})`,
              type,
              options: ["True", "False"],
              correctAnswer: "True"
            };
          case "choose-best":
            return {
              ...baseQuestion,
              question: `Which is the best approach for ${topic}? (Question ${index})`,
              type,
              options: [
                `Best practice for ${topic}`,
                `Good but not optimal approach`,
                `Acceptable alternative method`,
                `Less preferred option`
              ],
              correctAnswer: `Best practice for ${topic}`
            };
          case "fill-blank":
            return {
              ...baseQuestion,
              question: `${topic} requires understanding of _______ concepts. (Question ${index})`,
              type,
              correctAnswer: "fundamental"
            };
          default:
            return {
              ...baseQuestion,
              question: `Explain the importance of ${topic} in modern development. (Question ${index})`,
              type: "text",
              correctAnswer: `${topic} is important because it provides structure, maintainability, and efficiency in development processes.`
            };
        }
      }
      static async extractContentFromPowerPoint(buffer) {
        return PowerPointExtractor.extractContent(buffer, "presentation.pptx");
      }
    };
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";
import bcrypt2 from "bcryptjs";
import { ObjectId as ObjectId2 } from "mongodb";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// shared/schema.ts
import { z } from "zod";
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});
var questionFormSchema = z.object({
  date: z.string().min(1),
  sessionTitle: z.string().min(1),
  questions: z.array(z.object({
    topic: z.string().min(1),
    question: z.string().min(1),
    type: z.enum(["text", "multiple-choice", "choose-best", "true-false", "fill-blank"]),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number()]).optional(),
    explanation: z.string().optional()
  })).min(1)
});
var testFormSchema = z.object({
  date: z.string().min(1),
  sessionTitle: z.string().min(1),
  questionAnswers: z.array(z.object({
    topic: z.string().min(1),
    question: z.string().min(1),
    type: z.enum(["text", "multiple-choice", "choose-best", "true-false", "fill-blank"]),
    answer: z.union([z.string().min(1), z.number()]),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number()]).optional()
  })).min(1),
  overallUnderstanding: z.string().min(1),
  remarks: z.string().optional()
});
var evaluationSchema = z.object({
  questionAnswers: z.array(z.object({
    topic: z.string(),
    question: z.string(),
    type: z.enum(["text", "multiple-choice", "choose-best", "true-false", "fill-blank"]),
    answer: z.union([z.string(), z.number()]),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number()]).optional(),
    score: z.number().min(0).max(100),
    feedback: z.string().optional()
  })),
  overallFeedback: z.string().optional()
});
var updateSubmissionSchema = z.object({
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
  }).optional()
});
var createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["trainee", "admin", "superadmin"])
});

// server/routes.ts
import { z as z2 } from "zod";

// server/config/google-oauth.ts
import { OAuth2Client } from "google-auth-library";
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback";
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials not found. Google SSO will not be available.");
}
var googleOAuthClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
var GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

// server/routes.ts
init_db();
import express from "express";
import path from "path";
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const user = await storage.createUser({ ...userData, role: "trainee" });
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post(
    "/api/auth/reset-password",
    authenticateToken,
    async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            message: "Current password and new password are required"
          });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({
            message: "New password must be at least 6 characters long"
          });
        }
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const isValidPassword = await bcrypt2.compare(
          currentPassword,
          user.password
        );
        if (!isValidPassword) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
        const hashedNewPassword = await bcrypt2.hash(newPassword, 10);
        await storage.updateUser(req.user.id, { password: hashedNewPassword });
        res.json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.get("/api/auth/google", (req, res) => {
    const authUrl = googleOAuthClient.generateAuthUrl({
      access_type: "offline",
      scope: GOOGLE_OAUTH_SCOPES
    });
    res.redirect(authUrl);
  });
  app2.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect("/login?error=no_code");
      }
      const { tokens } = await googleOAuthClient.getToken(code);
      googleOAuthClient.setCredentials(tokens);
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect("/login?error=invalid_token");
      }
      const { email, name, picture } = payload;
      if (!email || !name) {
        return res.redirect("/login?error=incomplete_profile");
      }
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          name,
          email,
          password: "",
          // No password for Google users
          role: "trainee"
        });
      }
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      res.redirect(`/login?token=${token}`);
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.redirect("/login?error=oauth_failed");
    }
  });
  app2.get(
    "/api/questions/today",
    authenticateToken,
    async (req, res) => {
      try {
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const questions = await storage.getQuestionsByDate(today);
        res.json(questions);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.get(
    "/api/questions",
    authenticateToken,
    async (req, res) => {
      try {
        const questions = await storage.getAllQuestions();
        res.json(questions);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.post(
    "/api/questions",
    authenticateToken,
    async (req, res) => {
      try {
        const { date, sessionTitle, questions } = req.body;
        if (!date || !sessionTitle || !Array.isArray(questions)) {
          return res.status(400).json({ message: "Invalid request data" });
        }
        const question = await storage.createQuestion({
          date,
          sessionTitle,
          questions,
          createdBy: new ObjectId2(req.user.id)
        });
        res.status(201).json(question);
      } catch (error) {
        console.error("Question upload error:", error);
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  );
  app2.put(
    "/api/questions/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const question = await storage.updateQuestion(id, updates);
        if (!question) {
          return res.status(404).json({ message: "Question not found" });
        }
        res.json(question);
      } catch (error) {
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  );
  app2.delete(
    "/api/questions/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const { id } = req.params;
        const deleted = await storage.deleteQuestion(id);
        if (!deleted) {
          return res.status(404).json({ message: "Question not found" });
        }
        res.json({ message: "Question deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.get(
    "/api/submissions/my",
    authenticateToken,
    async (req, res) => {
      try {
        const submissions = await storage.getSubmissionsByUser(req.user.id);
        res.json(submissions);
      } catch (error) {
        console.error("Error fetching user submissions:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.get(
    "/api/submissions",
    authenticateToken,
    requireRole(["admin", "superadmin"]),
    async (req, res) => {
      try {
        const submissions = await storage.getAllSubmissions();
        res.json(submissions);
      } catch (error) {
        console.error("Error fetching all submissions:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.post(
    "/api/submissions",
    authenticateToken,
    requireRole(["trainee"]),
    async (req, res) => {
      try {
        console.log("Submission request body:", req.body);
        console.log("User from token:", req.user);
        const {
          id,
          questionSetId,
          date,
          sessionTitle,
          questionAnswers,
          overallUnderstanding,
          status,
          remarks,
          submittedAt
        } = req.body;
        if (!questionSetId || !date || !sessionTitle || !Array.isArray(questionAnswers)) {
          return res.status(400).json({ message: "Invalid request data" });
        }
        const userId = req.user.id;
        console.log("Processing submission for user ID:", userId);
        if (id) {
          console.log("Updating existing submission:", id);
          const updatedSubmission = await storage.updateSubmission(id, {
            questionSetId: new ObjectId2(questionSetId),
            sessionTitle,
            questionAnswers,
            overallUnderstanding: overallUnderstanding || "Average",
            status: status || "Completed",
            remarks: remarks || "",
            submittedAt: submittedAt ? new Date(submittedAt) : status === "Completed" ? /* @__PURE__ */ new Date() : void 0
          });
          if (!updatedSubmission) {
            return res.status(404).json({ message: "Submission not found" });
          }
          console.log("Submission updated successfully:", updatedSubmission._id);
          return res.status(200).json(updatedSubmission);
        }
        const existingSubmission = await storage.getSubmissionByUserAndQuestionSet(
          userId,
          questionSetId
        );
        if (existingSubmission) {
          console.log("Found existing submission:", existingSubmission._id);
          if (existingSubmission.evaluation && status === "Completed") {
            return res.status(400).json({
              message: "Test has already been evaluated and cannot be resubmitted"
            });
          }
          const updatedSubmission = await storage.updateSubmission(
            existingSubmission._id.toString(),
            {
              questionSetId: new ObjectId2(questionSetId),
              sessionTitle,
              questionAnswers,
              overallUnderstanding: overallUnderstanding || "Average",
              status: status || "Completed",
              remarks: remarks || "",
              submittedAt: submittedAt ? new Date(submittedAt) : status === "Completed" ? /* @__PURE__ */ new Date() : existingSubmission.submittedAt
            }
          );
          console.log("Existing submission updated:", updatedSubmission?._id);
          return res.status(200).json(updatedSubmission);
        }
        console.log("Creating new submission for user:", userId);
        const submission = await storage.createSubmission({
          questionSetId: new ObjectId2(questionSetId),
          date,
          sessionTitle,
          questionAnswers,
          overallUnderstanding: overallUnderstanding || "Average",
          status: status || "Completed",
          remarks: remarks || "",
          userId: new ObjectId2(userId),
          submittedAt: submittedAt ? new Date(submittedAt) : status === "Completed" ? /* @__PURE__ */ new Date() : void 0
        });
        console.log("New submission created:", submission._id);
        res.status(201).json(submission);
      } catch (error) {
        console.error("Submission validation error:", error);
        res.status(400).json({
          message: "Invalid request data",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  );
  app2.put(
    "/api/submissions/:id",
    authenticateToken,
    requireRole(["admin", "superadmin"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        console.log("Updating submission:", id);
        console.log("Update data:", updates);
        if (updates.evaluation) {
          const user = await storage.getUser(req.user.id);
          updates.evaluation.evaluatedBy = user?.name || req.user.email;
          updates.evaluation.evaluatedAt = (/* @__PURE__ */ new Date()).toISOString();
          updates.status = "Evaluated";
        }
        const submission = await storage.updateSubmission(id, updates);
        if (!submission) {
          return res.status(404).json({ message: "Submission not found" });
        }
        console.log("Submission updated successfully:", submission._id);
        res.json(submission);
      } catch (error) {
        console.error("Submission update error:", error);
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  );
  app2.delete(
    "/api/submissions/:id",
    authenticateToken,
    requireRole(["admin", "superadmin"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const deleted = await storage.deleteSubmission(id);
        if (!deleted) {
          return res.status(404).json({ message: "Submission not found" });
        }
        res.json({ message: "Submission deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.get(
    "/api/users",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req, res) => {
      try {
        const users = await storage.getAllUsers();
        const usersWithoutPasswords = users.map(
          ({ password, ...user }) => user
        );
        res.json(usersWithoutPasswords);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.post(
    "/api/users",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req, res) => {
      try {
        const createUserSchema2 = registerSchema.extend({
          role: z2.enum(["trainee", "admin"]).optional().default("trainee")
        });
        const userData = createUserSchema2.parse(req.body);
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }
        const user = await storage.createUser({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role
        });
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      } catch (error) {
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  );
  app2.put(
    "/api/users/:id",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const existingUser = await storage.getUser(id);
        if (existingUser?.role === "superadmin" && req.user.id !== id) {
          return res.status(403).json({ message: "Cannot modify another superadmin account" });
        }
        const allowedUpdates = { ...updates };
        if (allowedUpdates.role && !["trainee", "admin", "superadmin"].includes(allowedUpdates.role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        if (allowedUpdates.password) {
          allowedUpdates.password = await bcrypt2.hash(
            allowedUpdates.password,
            10
          );
        }
        const user = await storage.updateUser(id, allowedUpdates);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  );
  app2.delete(
    "/api/users/:id",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const deleted = await storage.deleteUser(id);
        if (!deleted) {
          return res.status(404).json({ message: "User not found or cannot be deleted" });
        }
        res.json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.get(
    "/api/trainees",
    authenticateToken,
    requireRole(["admin", "superadmin"]),
    async (req, res) => {
      try {
        const users = await storage.getAllUsers();
        const trainees = users.filter((user) => user.role === "trainee");
        const traineesWithoutPasswords = trainees.map(
          ({ password, ...user }) => user
        );
        res.json(traineesWithoutPasswords);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  app2.post(
    "/api/ai/generate-questions",
    authenticateToken,
    requireRole(["admin", "superadmin"]),
    async (req, res) => {
      try {
        const { prompt, questionTypes } = req.body;
        const file = req.file;
        if (!prompt && !file) {
          return res.status(400).json({ message: "Either prompt or file is required" });
        }
        let content = "";
        if (file) {
          content = `PowerPoint content extracted from ${file.originalname}. This would contain the actual slide content, text, and structure.`;
        }
        const { AIQuestionGenerator: AIQuestionGenerator2 } = await Promise.resolve().then(() => (init_ai_question_generator(), ai_question_generator_exports));
        const generatedQuestions = await AIQuestionGenerator2.generateQuestions({
          content,
          prompt,
          questionTypes: JSON.parse(
            questionTypes || '["multiple-choice", "text", "true-false"]'
          ),
          count: 8
        });
        res.json(generatedQuestions);
      } catch (error) {
        console.error("AI question generation error:", error);
        res.status(500).json({ message: "Failed to generate questions" });
      }
    }
  );
  app2.get("/api/qa/questions", authenticateToken, async (req, res) => {
    try {
      const db2 = await connectToDatabase();
      const questions = await db2.collection("qa_questions").find({}).sort({ createdAt: -1 }).toArray();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching Q&A questions:", error);
      res.status(500).json({ message: "Failed to fetch Q&A questions" });
    }
  });
  app2.post("/api/qa/questions", authenticateToken, async (req, res) => {
    try {
      const { title, content } = req.body;
      const user = req.user;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      const db2 = await connectToDatabase();
      const newQuestion = {
        title: title.trim(),
        content: content.trim(),
        askedBy: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        answers: []
      };
      const result = await db2.collection("qa_questions").insertOne(newQuestion);
      res.status(201).json({
        message: "Question posted successfully",
        questionId: result.insertedId
      });
    } catch (error) {
      console.error("Error posting question:", error);
      res.status(500).json({ message: "Failed to post question" });
    }
  });
  app2.post(
    "/api/qa/questions/:questionId/answers",
    authenticateToken,
    async (req, res) => {
      try {
        const { questionId } = req.params;
        const { content } = req.body;
        const user = req.user;
        if (!content) {
          return res.status(400).json({ message: "Answer content is required" });
        }
        const db2 = await connectToDatabase();
        const newAnswer = {
          _id: new ObjectId2(),
          content: content.trim(),
          answeredBy: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db2.collection("qa_questions").updateOne(
          { _id: new ObjectId2(questionId) },
          { $push: { answers: newAnswer } }
        );
        res.status(201).json({ message: "Answer posted successfully" });
      } catch (error) {
        console.error("Error posting answer:", error);
        res.status(500).json({ message: "Failed to post answer" });
      }
    }
  );
  app2.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.use(express.static(path.join(import.meta.dirname, "../dist/public")));
  app2.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ message: "API endpoint not found" });
    } else {
      res.sendFile(path.join(import.meta.dirname, "../dist/public/index.html"));
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
init_db();

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: false
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import cors from "cors";
import path4 from "path";
import multer from "multer";
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(cors());
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
var multerStorage = multer.memoryStorage();
var upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes("presentation") || file.originalname.endsWith(".ppt") || file.originalname.endsWith(".pptx")) {
      cb(null, true);
    } else {
      cb(new Error("Only PowerPoint files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
app.use("/api/ai/generate-questions", upload.single("file"));
async function startServer() {
  try {
    await connectToDatabase();
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    await storage2.initializeDatabase();
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api/")) {
        res.sendFile(path4.join(__dirname, "../dist/public/index.html"));
      } else {
        res.status(404).json({ message: "API endpoint not found" });
      }
    });
    const port = 5e3;
    server.listen(port, "0.0.0.0", () => {
      log(`Server running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();
