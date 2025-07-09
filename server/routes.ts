import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { storage } from "./storage";
import { authenticateToken, requireRole, generateToken, type AuthRequest } from "./middleware/auth";
import { 
  loginSchema, 
  registerSchema 
} from "@shared/schema";
import { z } from "zod";
import { googleOAuthClient, GOOGLE_OAUTH_SCOPES } from "./config/google-oauth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });

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
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser({ ...userData, role: 'trainee' });

      const token = generateToken({ id: user.id, email: user.email, role: user.role });

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
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res) => {
    const authUrl = googleOAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_OAUTH_SCOPES,
    });
    res.redirect(authUrl);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect('/login?error=no_code');
      }

      const { tokens } = await googleOAuthClient.getToken(code as string);
      googleOAuthClient.setCredentials(tokens);

      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect('/login?error=invalid_token');
      }

      const { email, name, picture } = payload;

      if (!email || !name) {
        return res.redirect('/login?error=incomplete_profile');
      }

      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user with Google account
        user = await storage.createUser({
          name,
          email,
          password: '', // No password for Google users
          role: 'trainee'
        });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      // Redirect to frontend with token
      res.redirect(`/login?token=${token}`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect('/login?error=oauth_failed');
    }
  });

  // Question routes
  app.get('/api/questions/today', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const questions = await storage.getQuestionsByDate(today);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/questions', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/questions', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const { date, sessionTitle, questions } = req.body;

      // Basic validation
      if (!date || !sessionTitle || !Array.isArray(questions)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      // Allow multiple admins to add questions for the same date
      // Each admin can contribute questions to the same day's test
      const question = await storage.createQuestion({
        date,
        sessionTitle,
        questions,
        createdBy: new ObjectId(req.user!.id)
      });

      res.status(201).json(question);
    } catch (error) {
      console.error('Question upload error:', error);
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.put('/api/questions/:id', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const question = await storage.updateQuestion(id, updates);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.json(question);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.delete('/api/questions/:id', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteQuestion(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Submission routes
  app.get('/api/submissions/my', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submissions = await storage.getSubmissionsByUser(req.user!.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/submissions', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/submissions', authenticateToken, requireRole(['trainee']), async (req: AuthRequest, res) => {
    try {
      console.log('Submission request body:', req.body);
      const { questionSetId, date, sessionTitle, questionAnswers, overallUnderstanding, status, remarks } = req.body;

      // Basic validation
      if (!questionSetId || !date || !sessionTitle || !Array.isArray(questionAnswers) || !overallUnderstanding || !status) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      // Check if user has already submitted for this date
      const existingSubmission = await storage.getSubmissionByUserAndDate(req.user!.id, date);

      if (existingSubmission) {
        // If submission exists and has been evaluated, don't allow resubmission
        if (existingSubmission.evaluation) {
          return res.status(400).json({ message: 'Test has already been evaluated and cannot be resubmitted' });
        }

        // If submission exists but not evaluated, update it instead of creating new one
        const updatedSubmission = await storage.updateSubmission(existingSubmission._id.toString(), {
          questionSetId: new ObjectId(questionSetId),
          sessionTitle,
          questionAnswers,
          overallUnderstanding,
          status,
          remarks,
          submittedAt: new Date()
        });

        return res.status(200).json(updatedSubmission);
      }

      // Create new submission if none exists
      const submission = await storage.createSubmission({
        questionSetId: new ObjectId(questionSetId),
        date,
        sessionTitle,
        questionAnswers,
        overallUnderstanding,
        status,
        remarks,
        userId: new ObjectId(req.user!.id)
      });

      res.status(201).json(submission);
    } catch (error) {
      console.error('Submission validation error:', error);
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.put('/api/submissions/:id', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If evaluation data is being added, set the evaluatedBy field
      if (updates.evaluation) {
        const user = await storage.getUser(req.user!.id);
        updates.evaluation.evaluatedBy = user?.name || req.user!.email;
        updates.evaluation.evaluatedAt = new Date().toISOString();
      }

      const submission = await storage.updateSubmission(id, updates);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.json(submission);
    } catch (error) {
      console.error('Submission update error:', error);
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.delete('/api/submissions/:id', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSubmission(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // User management routes (Super Admin only)
  app.get('/api/users', authenticateToken, requireRole(['superadmin']), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/users', authenticateToken, requireRole(['superadmin']), async (req: AuthRequest, res) => {
    try {
      const createUserSchema = registerSchema.extend({
        role: z.enum(['trainee', 'admin']).optional().default('trainee')
      });

      const userData = createUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
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
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.put('/api/users/:id', authenticateToken, requireRole(['superadmin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent modification of existing superadmin by other superadmins (except self)
      const existingUser = await storage.getUser(id);
      if (existingUser?.role === 'superadmin' && req.user!.id !== id) {
        return res.status(403).json({ message: 'Cannot modify another superadmin account' });
      }

      // Allow promoting users to superadmin role
      const allowedUpdates = { ...updates };
      if (allowedUpdates.role && !['trainee', 'admin', 'superadmin'].includes(allowedUpdates.role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Hash password if it's being updated
      if (allowedUpdates.password) {
        allowedUpdates.password = await bcrypt.hash(allowedUpdates.password, 10);
      }

      const user = await storage.updateUser(id, allowedUpdates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requireRole(['superadmin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ message: 'User not found or cannot be deleted' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Trainee management routes (Admin and Super Admin)
  app.get('/api/trainees', authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const trainees = users.filter(user => user.role === 'trainee');
      const traineesWithoutPasswords = trainees.map(({ password, ...user }) => user);
      res.json(traineesWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}