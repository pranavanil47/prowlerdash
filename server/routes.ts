import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { prowlerService } from "./services/prowlerService";
import { prowlerConfigurationSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

// Admin middleware
const isAdmin: typeof isAuthenticated = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser((req.user as any).id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  return next();
};

// Validation schemas for user management
const createUserSchema = z.object({
  username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
  email: z.string().min(1, "Email is required").email("Must be a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("user"),
});

const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Must be a valid email").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["admin", "user"]).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password hash to client
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Prowler configuration routes
  app.get('/api/prowler/configuration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const config = await storage.getProwlerConfiguration(userId);
      
      if (!config) {
        return res.json(null);
      }

      // Don't send password hash to client
      const { prowlerPasswordHash, ...configWithoutPassword } = config;
      res.json(configWithoutPassword);
    } catch (error) {
      console.error("Error fetching Prowler configuration:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  app.post('/api/prowler/configuration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = prowlerConfigurationSchema.parse(req.body);
      
      // Hash the password
      const prowlerPasswordHash = await prowlerService.hashPassword(validatedData.prowlerPassword);
      
      const config = await storage.upsertProwlerConfiguration(userId, {
        prowlerUrl: validatedData.prowlerUrl,
        prowlerEmail: validatedData.prowlerEmail,
        prowlerPasswordHash,
      });

      // Don't send password hash to client
      const { prowlerPasswordHash: _, ...configWithoutPassword } = config;
      res.json(configWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error saving Prowler configuration:", error);
      res.status(500).json({ message: "Failed to save configuration" });
    }
  });

  app.post('/api/prowler/test-connection', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = prowlerConfigurationSchema.parse(req.body);
      
      const result = await prowlerService.testConnection(
        validatedData.prowlerUrl,
        validatedData.prowlerEmail,
        validatedData.prowlerPassword
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error testing Prowler connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  // User management routes
  app.get('/api/users', isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password hashes to client
      const usersWithoutPasswords = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAdmin, async (req: any, res) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        passwordHash,
        role: validatedData.role,
      });

      // Don't send password hash to client
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // If username is being updated, check if it's already taken by another user
      if (validatedData.username && validatedData.username !== existingUser.username) {
        const userWithSameUsername = await storage.getUserByUsername(validatedData.username);
        if (userWithSameUsername && userWithSameUsername.id !== id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      // If email is being updated, check if it's already taken by another user
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const userWithSameEmail = await storage.getUserByEmail(validatedData.email);
        if (userWithSameEmail && userWithSameEmail.id !== id) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Prepare update data
      const updateData: any = { ...validatedData };
      
      // Hash password if provided
      if (validatedData.password) {
        updateData.passwordHash = await bcrypt.hash(validatedData.password, 10);
        delete updateData.password;
      }

      const user = await storage.updateUser(id, updateData);

      // Don't send password hash to client
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deletion of current user
      if (req.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Asset/Resource routes
  app.get('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const config = await storage.getProwlerConfiguration(userId);
      
      if (!config) {
        return res.status(404).json({ message: "No Prowler configuration found" });
      }

      const { resourceType, status, severity, search } = req.query;
      
      const assets = await storage.getAssets(config.id, {
        resourceType: resourceType as string,
        status: status as string,
        severity: severity as string,
        search: search as string,
      });

      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get('/api/assets/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const config = await storage.getProwlerConfiguration(userId);
      
      if (!config) {
        return res.status(404).json({ message: "No Prowler configuration found" });
      }

      const stats = await storage.getAssetStats(config.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching asset stats:", error);
      res.status(500).json({ message: "Failed to fetch asset stats" });
    }
  });

  app.post('/api/assets/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const config = await storage.getProwlerConfiguration(userId);
      
      if (!config) {
        return res.status(404).json({ message: "No Prowler configuration found" });
      }

      // Note: In production, we would need to decrypt the stored password
      // For now, we'll return an error asking user to reconfigure
      res.status(400).json({ 
        message: "Please reconfigure your Prowler connection to sync data",
        requiresReconfiguration: true 
      });
    } catch (error) {
      console.error("Error syncing assets:", error);
      res.status(500).json({ message: "Failed to sync assets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
