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

// shared/schema.ts
import { z } from "zod";
var loginSchema, registerSchema, questionFormSchema, testFormSchema, evaluationSchema, updateSubmissionSchema, createUserSchema, COLLECTIONS;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });
    registerSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6)
    });
    questionFormSchema = z.object({
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
    testFormSchema = z.object({
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
    evaluationSchema = z.object({
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
    updateSubmissionSchema = z.object({
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
    createUserSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["trainee", "admin", "superadmin"])
    });
    COLLECTIONS = {
      USERS: "users",
      QUESTIONS: "questions",
      SUBMISSIONS: "submissions"
    };
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  MongoStorage: () => MongoStorage,
  storage: () => storage
});
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
var MongoStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    init_schema();
    MongoStorage = class {
      usersCollection;
      questionsCollection;
      submissionsCollection;
      constructor() {
        this.usersCollection = null;
        this.questionsCollection = null;
        this.submissionsCollection = null;
      }
      async initializeCollections() {
        if (!this.usersCollection) {
          const db2 = await connectToDatabase();
          this.usersCollection = db2.collection(COLLECTIONS.USERS);
          this.questionsCollection = db2.collection(COLLECTIONS.QUESTIONS);
          this.submissionsCollection = db2.collection(COLLECTIONS.SUBMISSIONS);
        }
      }
      transformDocumentToUser(doc) {
        return {
          ...doc,
          id: doc._id.toString()
        };
      }
      transformDocumentToQuestion(doc) {
        return {
          ...doc,
          id: doc._id.toString()
        };
      }
      transformDocumentToSubmission(doc) {
        return {
          ...doc,
          id: doc._id.toString()
        };
      }
      async initializeSuperAdmin() {
        await this.initializeCollections();
        const existingSuperAdmin = await this.usersCollection.findOne({ role: "superadmin" });
        if (existingSuperAdmin) return;
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await this.usersCollection.insertOne({
          name: "Super Admin",
          email: "admin@admin.com",
          password: hashedPassword,
          role: "superadmin",
          createdAt: /* @__PURE__ */ new Date()
        });
      }
      async getUser(id) {
        await this.initializeCollections();
        const doc = await this.usersCollection.findOne({ _id: new ObjectId(id) });
        return doc ? this.transformDocumentToUser(doc) : void 0;
      }
      async getUserByEmail(email) {
        await this.initializeCollections();
        const doc = await this.usersCollection.findOne({ email });
        return doc ? this.transformDocumentToUser(doc) : void 0;
      }
      async createUser(userData) {
        await this.initializeCollections();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const userToInsert = {
          ...userData,
          password: hashedPassword,
          createdAt: /* @__PURE__ */ new Date()
        };
        const result = await this.usersCollection.insertOne(userToInsert);
        const createdUser = await this.usersCollection.findOne({ _id: result.insertedId });
        if (!createdUser) {
          throw new Error("Failed to create user");
        }
        return this.transformDocumentToUser(createdUser);
      }
      async updateUser(id, updates) {
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
          { returnDocument: "after" }
        );
        return result ? this.transformDocumentToUser(result) : void 0;
      }
      async deleteUser(id) {
        await this.initializeCollections();
        const result = await this.usersCollection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
      }
      async getAllUsers() {
        await this.initializeCollections();
        const docs = await this.usersCollection.find({}).toArray();
        return docs.map((doc) => this.transformDocumentToUser(doc));
      }
      async getQuestion(id) {
        await this.initializeCollections();
        const doc = await this.questionsCollection.findOne({ _id: new ObjectId(id) });
        return doc ? this.transformDocumentToQuestion(doc) : void 0;
      }
      async getQuestionsByDate(date) {
        await this.initializeCollections();
        const docs = await this.questionsCollection.find({ date }).toArray();
        return docs.map((doc) => this.transformDocumentToQuestion(doc));
      }
      async createQuestion(questionData) {
        await this.initializeCollections();
        const questionToInsert = {
          ...questionData,
          createdAt: /* @__PURE__ */ new Date()
        };
        const result = await this.questionsCollection.insertOne(questionToInsert);
        const createdQuestion = await this.questionsCollection.findOne({ _id: result.insertedId });
        if (!createdQuestion) {
          throw new Error("Failed to create question");
        }
        return this.transformDocumentToQuestion(createdQuestion);
      }
      async updateQuestion(id, updates) {
        await this.initializeCollections();
        const updateData = { ...updates };
        delete updateData.id;
        delete updateData._id;
        const result = await this.questionsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updateData },
          { returnDocument: "after" }
        );
        return result ? this.transformDocumentToQuestion(result) : void 0;
      }
      async deleteQuestion(id) {
        await this.initializeCollections();
        const result = await this.questionsCollection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
      }
      async getAllQuestions() {
        await this.initializeCollections();
        const docs = await this.questionsCollection.find({}).toArray();
        return docs.map((doc) => this.transformDocumentToQuestion(doc));
      }
      async getSubmission(id) {
        await this.initializeCollections();
        const doc = await this.submissionsCollection.findOne({ _id: new ObjectId(id) });
        return doc ? this.transformDocumentToSubmission(doc) : void 0;
      }
      async getSubmissionsByUser(userId) {
        await this.initializeCollections();
        const docs = await this.submissionsCollection.find({ userId: new ObjectId(userId) }).toArray();
        return docs.map((doc) => this.transformDocumentToSubmission(doc));
      }
      async getSubmissionsByDate(date) {
        await this.initializeCollections();
        const docs = await this.submissionsCollection.find({ date }).toArray();
        return docs.map((doc) => this.transformDocumentToSubmission(doc));
      }
      async createSubmission(submissionData) {
        await this.initializeCollections();
        const submissionToInsert = {
          ...submissionData,
          submittedAt: /* @__PURE__ */ new Date()
        };
        const result = await this.submissionsCollection.insertOne(submissionToInsert);
        const createdSubmission = await this.submissionsCollection.findOne({ _id: result.insertedId });
        if (!createdSubmission) {
          throw new Error("Failed to create submission");
        }
        return this.transformDocumentToSubmission(createdSubmission);
      }
      async getAllSubmissions() {
        await this.initializeCollections();
        const docs = await this.submissionsCollection.find({}).toArray();
        return docs.map((doc) => this.transformDocumentToSubmission(doc));
      }
      async updateSubmission(id, updates) {
        await this.initializeCollections();
        const updateData = { ...updates };
        delete updateData.id;
        delete updateData._id;
        const result = await this.submissionsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updateData },
          { returnDocument: "after" }
        );
        return result ? this.transformDocumentToSubmission(result) : void 0;
      }
      async deleteSubmission(id) {
        await this.initializeCollections();
        const result = await this.submissionsCollection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
      }
      async getSubmissionByUserAndDate(userId, date) {
        await this.initializeCollections();
        const submission = await this.submissionsCollection.findOne({
          userId: new ObjectId(userId),
          date
        });
        return submission ? this.transformDocumentToSubmission(submission) : null;
      }
    };
    storage = new MongoStorage();
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

// server/routes.ts
init_schema();
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
        const {
          id,
          questionSetId,
          date,
          sessionTitle,
          questionAnswers,
          overallUnderstanding,
          status,
          remarks
        } = req.body;
        if (!questionSetId || !date || !sessionTitle || !Array.isArray(questionAnswers)) {
          return res.status(400).json({ message: "Invalid request data" });
        }
        if (id) {
          const updatedSubmission = await storage.updateSubmission(id, {
            questionSetId: new ObjectId2(questionSetId),
            sessionTitle,
            questionAnswers,
            overallUnderstanding,
            status,
            remarks,
            submittedAt: status === "submitted" ? /* @__PURE__ */ new Date() : void 0
          });
          if (!updatedSubmission) {
            return res.status(404).json({ message: "Submission not found" });
          }
          return res.status(200).json(updatedSubmission);
        }
        const existingSubmission = await storage.getSubmissionByUserAndDate(
          req.user.id,
          date
        );
        if (existingSubmission) {
          if (existingSubmission.evaluation && status === "submitted") {
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
              overallUnderstanding,
              status,
              remarks,
              submittedAt: status === "submitted" || status === "completed" ? /* @__PURE__ */ new Date() : existingSubmission.submittedAt
            }
          );
          return res.status(200).json(updatedSubmission);
        }
        const submission = await storage.createSubmission({
          questionSetId: new ObjectId2(questionSetId),
          date,
          sessionTitle,
          questionAnswers,
          overallUnderstanding: overallUnderstanding || "",
          status,
          remarks: remarks || "",
          userId: new ObjectId2(req.user.id),
          submittedAt: status === "submitted" || status === "completed" ? /* @__PURE__ */ new Date() : void 0
        });
        res.status(201).json(submission);
      } catch (error) {
        console.error("Submission validation error:", error);
        res.status(400).json({ message: "Invalid request data" });
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
        if (updates.evaluation) {
          const user = await storage.getUser(req.user.id);
          updates.evaluation.evaluatedBy = user?.name || req.user.email;
          updates.evaluation.evaluatedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
        const submission = await storage.updateSubmission(id, updates);
        if (!submission) {
          return res.status(404).json({ message: "Submission not found" });
        }
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
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.join(import.meta.dirname, "../dist/public/index.html"));
    } else {
      res.status(404).json({ message: "API endpoint not found" });
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
    await storage2.initializeSuperAdmin();
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
