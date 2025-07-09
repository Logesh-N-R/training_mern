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
      
      // Check if questions already exist for this date
      const existingQuestions = await storage.getQuestionsByDate(date);
      if (existingQuestions.length > 0) {
        return res.status(400).json({ message: 'Questions already exist for this date' });
      }

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
      
      // Prevent modification of superadmin
      const existingUser = await storage.getUser(id);
      if (existingUser?.role === 'superadmin' && req.user!.id !== id) {
        return res.status(403).json({ message: 'Cannot modify superadmin account' });
      }
      
      const user = await storage.updateUser(id, updates);
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
