import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { storage } from "./storage";
import {
  authenticateToken,
  requireRole,
  generateToken,
  type AuthRequest,
} from "./middleware/auth";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import { googleOAuthClient, GOOGLE_OAUTH_SCOPES } from "./config/google-oauth";
import { connectToDatabase } from "./db";
import express from "express";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (keeping existing auth routes)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({
        id: user._id?.toString() || user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({ ...userData, role: "trainee" });

      const token = generateToken({
        id: user._id?.toString() || user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        token,
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post(
    "/api/auth/reset-password",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            message: "Current password and new password are required",
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            message: "New password must be at least 6 characters long",
          });
        }

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
          currentPassword,
          user.password,
        );
        if (!isValidPassword) {
          return res
            .status(401)
            .json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        await storage.updateUser(req.user!.id, { password: hashedNewPassword });

        res.json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  // Google OAuth routes
  app.get("/api/auth/google", (req, res) => {
    const authUrl = googleOAuthClient.generateAuthUrl({
      access_type: "offline",
      scope: GOOGLE_OAUTH_SCOPES,
    });
    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect("/login?error=no_code");
      }

      const { tokens } = await googleOAuthClient.getToken(code as string);
      googleOAuthClient.setCredentials(tokens);

      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
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
        // Create new user with Google account
        user = await storage.createUser({
          name,
          email,
          password: "", // No password for Google users
          role: "trainee",
        });
      }

      const token = generateToken({
        id: user._id?.toString() || user.id,
        email: user.email,
        role: user.role,
      });

      // Redirect to frontend with token
      res.redirect(`/login?token=${token}`);
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.redirect("/login?error=oauth_failed");
    }
  });

  // Test Session routes
  app.get("/api/test-sessions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role === 'trainee') {
        const sessions = await storage.getActiveTestSessions();
        res.json(sessions);
      } else {
        const sessions = await storage.getAllTestSessions();
        res.json(sessions);
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/test-sessions", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const sessionData = {
        ...req.body,
        createdBy: new ObjectId(req.user!.id),
      };

      const session = await storage.createTestSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Test session creation error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/test-sessions/:id", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const session = await storage.updateTestSession(id, updates);
      if (!session) {
        return res.status(404).json({ message: "Test session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.delete("/api/test-sessions/:id", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTestSession(id);

      if (!deleted) {
        return res.status(404).json({ message: "Test session not found" });
      }

      res.json({ message: "Test session deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all questions endpoint
  app.get("/api/questions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessions = await storage.getAllTestSessions();
      const questionsData = [];
      
      for (const session of sessions) {
        const questions = await storage.getTestQuestionsBySession(session._id!.toString());
        if (questions.length > 0) {
          questionsData.push({
            _id: session._id,
            date: session.date,
            sessionTitle: session.title,
            questions: questions,
            createdAt: session.createdAt || new Date().toISOString(),
          });
        }
      }
      
      res.json(questionsData);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Question upload endpoint (for question-uploader component)
  app.post("/api/questions", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const { date, sessionTitle, questions } = req.body;

      // Create a test session first
      const sessionData = {
        title: sessionTitle,
        description: `Questions for ${date}`,
        date: date,
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        status: 'active' as const,
        createdBy: new ObjectId(req.user!.id),
      };

      const session = await storage.createTestSession(sessionData);

      // Create questions for the session
      const createdQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionData = {
          sessionId: session._id!.toString(),
          questionNumber: i + 1,
          category: question.topic || 'General',
          question: question.question,
          type: question.type === 'multiple-choice' || question.type === 'choose-best' ? 'multiple-choice' : 
                question.type === 'true-false' ? 'true-false' : 'text-input',
          options: question.options?.filter(opt => opt.trim()) || [],
          correctAnswer: question.correctAnswer,
          points: 10,
          explanation: question.explanation || '',
          difficulty: 'medium' as const,
          tags: [question.topic || 'General'],
        };

        const createdQuestion = await storage.createTestQuestion(questionData);
        createdQuestions.push(createdQuestion);
      }

      res.status(201).json({
        message: 'Questions uploaded successfully',
        session: session,
        questions: createdQuestions,
      });
    } catch (error) {
      console.error("Question upload error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Test Question routes
  app.get("/api/test-questions/:sessionId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.params;
      const questions = await storage.getTestQuestionsBySession(sessionId);

      // For trainees, remove correct answers from response
      if (req.user!.role === 'trainee') {
        const sanitizedQuestions = questions.map(q => ({
          ...q,
          correctAnswer: undefined,
          explanation: undefined,
        }));
        res.json(sanitizedQuestions);
      } else {
        res.json(questions);
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/test-questions", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const questionData = req.body;
      const question = await storage.createTestQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Question creation error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/test-questions/:id", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const question = await storage.updateTestQuestion(id, updates);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Test Attempt routes
  app.get("/api/test-attempts/my", authenticateToken, requireRole(["trainee"]), async (req: AuthRequest, res) => {
    try {
      const attempts = await storage.getTestAttemptsByTrainee(req.user!.id);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/test-attempts", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const attempts = await storage.getAllTestAttempts();
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/test-attempts/session/:sessionId", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.params;
      const attempts = await storage.getTestAttemptsBySession(sessionId);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/test-attempts", authenticateToken, requireRole(["trainee"]), async (req: AuthRequest, res) => {
    try {
      const attemptData = {
        ...req.body,
        traineeId: req.user!.id,
        startedAt: new Date(),
      };

      // Check if trainee already has an attempt for this session
      const existingAttempt = await storage.getTestAttemptByTraineeAndSession(
        req.user!.id,
        attemptData.sessionId
      );

      if (existingAttempt) {
        // Update existing attempt
        const updatedAttempt = await storage.updateTestAttempt(
          existingAttempt._id!.toString(),
          {
            answers: attemptData.answers,
            timeSpent: attemptData.timeSpent,
            status: 'submitted',
            submittedAt: new Date(),
          }
        );
        return res.json(updatedAttempt);
      }

      // Create new attempt
      const attempt = await storage.createTestAttempt({
        ...attemptData,
        status: 'submitted',
        submittedAt: new Date(),
      });

      res.status(201).json(attempt);
    } catch (error) {
      console.error("Test attempt submission error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Test Evaluation routes
  app.get("/api/test-evaluations/my", authenticateToken, requireRole(["trainee"]), async (req: AuthRequest, res) => {
    try {
      const evaluations = await storage.getTestEvaluationsByTrainee(req.user!.id);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/test-evaluations", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const evaluations = await storage.getAllTestEvaluations();
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Submission Management routes
  app.get("/api/submissions", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const db = await connectToDatabase();
      
      // Get all test attempts that have been submitted
      const attempts = await db.collection('test_attempts')
        .find({ 
          $or: [
            { status: 'submitted' },
            { status: 'completed' },
            { submittedAt: { $exists: true } }
          ]
        })
        .sort({ submittedAt: -1, startedAt: -1 })
        .toArray();

      // Get all evaluations to match with attempts
      const evaluations = await db.collection('test_evaluations').find({}).toArray();
      const evaluationMap = new Map();
      evaluations.forEach(evaluation => {
        evaluationMap.set(evaluation.attemptId.toString(), evaluation);
      });

      // Get all test sessions to get session titles
      const sessions = await db.collection('test_sessions').find({}).toArray();
      const sessionMap = new Map();
      sessions.forEach(session => {
        sessionMap.set(session._id.toString(), session);
      });

      // Transform attempts to submission format
      const formattedSubmissions = attempts.map(attempt => {
        const evaluation = evaluationMap.get(attempt._id.toString());
        const session = sessionMap.get(attempt.sessionId.toString());
        
        return {
          id: attempt._id?.toString(),
          _id: attempt._id,
          userId: attempt.traineeId?.toString(),
          sessionId: attempt.sessionId?.toString(),
          sessionTitle: session?.title || attempt.sessionTitle || 'Test Session',
          date: attempt.startedAt ? new Date(attempt.startedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          questionAnswers: attempt.answers || [],
          overallUnderstanding: evaluation?.overallUnderstanding || 'Good',
          status: attempt.status === 'submitted' ? 'Completed' : (attempt.status || 'Completed'),
          remarks: evaluation?.remarks || '',
          submittedAt: attempt.submittedAt || attempt.startedAt,
          evaluation: evaluation ? {
            totalScore: evaluation.totalScore,
            maxScore: evaluation.maxScore,
            percentage: evaluation.percentage,
            grade: evaluation.grade,
            evaluatedBy: evaluation.evaluatedBy,
            overallFeedback: evaluation.overallFeedback,
            createdAt: evaluation.createdAt
          } : null
        };
      });

      console.log(`Found ${formattedSubmissions.length} submissions`);
      res.json(formattedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/submissions/my", authenticateToken, requireRole(["trainee"]), async (req: AuthRequest, res) => {
    try {
      const attempts = await storage.getTestAttemptsByTrainee(req.user!.id);
      
      // Transform attempts to submission format
      const formattedSubmissions = attempts.map(attempt => ({
        id: attempt._id?.toString(),
        _id: attempt._id,
        userId: attempt.traineeId,
        sessionId: attempt.sessionId,
        sessionTitle: attempt.sessionTitle || 'Test Session',
        date: attempt.startedAt ? new Date(attempt.startedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        questionAnswers: attempt.answers || [],
        overallUnderstanding: 'Good',
        status: attempt.status === 'submitted' ? 'Completed' : attempt.status,
        remarks: '',
        submittedAt: attempt.submittedAt || attempt.startedAt,
        evaluation: null
      }));

      res.json(formattedSubmissions);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/submissions/:id", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const db = await connectToDatabase();
      const result = await db.collection('test_attempts').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json({
        ...result,
        id: result._id?.toString()
      });
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/test-evaluations", authenticateToken, requireRole(["admin", "superadmin"]), async (req: AuthRequest, res) => {
    try {
      const evaluationData = {
        ...req.body,
        evaluatorId: req.user!.id,
      };

      const evaluation = await storage.createTestEvaluation(evaluationData);

      // Update the attempt status to 'evaluated'
      await storage.updateTestAttempt(evaluation.attemptId.toString(), {
        status: 'evaluated',
      });

      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Test evaluation error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User management routes (keeping existing ones)
  app.get(
    "/api/users",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req: AuthRequest, res) => {
      try {
        const users = await storage.getAllUsers();
        const usersWithoutPasswords = users.map(
          ({ password, ...user }) => user,
        );
        res.json(usersWithoutPasswords);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  app.post(
    "/api/users",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req: AuthRequest, res) => {
      try {
        const createUserSchema = registerSchema.extend({
          role: z.enum(["trainee", "admin"]).optional().default("trainee"),
        });

        const userData = createUserSchema.parse(req.body);

        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const user = await storage.createUser({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
        });
        const { password, ...userWithoutPassword } = user;

        res.status(201).json(userWithoutPassword);
      } catch (error) {
        res.status(400).json({ message: "Invalid request data" });
      }
    },
  );

  app.put(
    "/api/users/:id",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent modification of existing superadmin by other superadmins (except self)
        const existingUser = await storage.getUser(id);
        if (existingUser?.role === "superadmin" && req.user!.id !== id) {
          return res
            .status(403)
            .json({ message: "Cannot modify another superadmin account" });
        }

        // Allow promoting users to superadmin role
        const allowedUpdates = { ...updates };
        if (
          allowedUpdates.role &&
          !["trainee", "admin", "superadmin"].includes(allowedUpdates.role)
        ) {
          return res.status(400).json({ message: "Invalid role" });
        }

        // Hash password if it's being updated
        if (allowedUpdates.password) {
          allowedUpdates.password = await bcrypt.hash(
            allowedUpdates.password,
            10,
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
    },
  );

  app.delete(
    "/api/users/:id",
    authenticateToken,
    requireRole(["superadmin"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const deleted = await storage.deleteUser(id);

        if (!deleted) {
          return res
            .status(404)
            .json({ message: "User not found or cannot be deleted" });
        }

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  app.get(
    "/api/trainees",
    authenticateToken,
    requireRole(["admin", "superadmin"]),
    async (req: AuthRequest, res) => {
      try {
        const users = await storage.getAllUsers();
        const trainees = users.filter((user) => user.role === "trainee");
        const traineesWithoutPasswords = trainees.map(({ password, ...user }) => user);
        res.json(traineesWithoutPasswords);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );

    

  // Q&A routes (keeping existing ones)
  app.get("/api/qa/questions", authenticateToken, async (req, res) => {
    try {
      const db = await connectToDatabase();
      const questions = await db
        .collection("qa_questions")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.json(questions);
    } catch (error) {
      console.error("Error fetching Q&A questions:", error);
      res.status(500).json({ message: "Failed to fetch Q&A questions" });
    }
  });

  app.post("/api/qa/questions", authenticateToken, async (req, res) => {
    try {
      const { title, content } = req.body;
      const user = (req as any).user;

      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const db = await connectToDatabase();
      const newQuestion = {
        title: title.trim(),
        content: content.trim(),
        askedBy: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        createdAt: new Date().toISOString(),
        answers: [],
      };

      const result = await db.collection("qa_questions").insertOne(newQuestion);

      res.status(201).json({
        message: "Question posted successfully",
        questionId: result.insertedId,
      });
    } catch (error) {
      console.error("Error posting question:", error);
      res.status(500).json({ message: "Failed to post question" });
    }
  });

  app.post("/api/qa/questions/:questionId/answers", authenticateToken, async (req, res) => {
    try {
      const { questionId } = req.params;
      const { content } = req.body;
      const user = (req as any).user;

      if (!content) {
        return res.status(400).json({ message: "Answer content is required" });
      }

      const db = await connectToDatabase();
      const newAnswer = {
        _id: new ObjectId(),
        content: content.trim(),
        answeredBy: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        createdAt: new Date().toISOString(),
      };

      await db
        .collection("qa_questions")
        .updateOne(
          { _id: new ObjectId(questionId) },
          { $push: { answers: newAnswer } }
        );

      res.status(201).json({ message: "Answer posted successfully" });
    } catch (error) {
      console.error("Error posting answer:", error);
      res.status(500).json({ message: "Failed to post answer" });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Serve static files from dist/public
  app.use(express.static(path.join(import.meta.dirname, '../dist/public')));

  // Handle static file serving only
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ message: 'API endpoint not found' });
    } else {
      res.sendFile(path.join(import.meta.dirname, '../dist/public/index.html'));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}