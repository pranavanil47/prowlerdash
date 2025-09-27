import {
  users,
  prowlerConfigurations,
  assets,
  type User,
  type UpsertUser,
  type ProwlerConfiguration,
  type InsertProwlerConfiguration,
  type Asset,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // User operations for local authentication.
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Prowler configuration operations
  getProwlerConfiguration(userId: string): Promise<ProwlerConfiguration | undefined>;
  upsertProwlerConfiguration(userId: string, config: InsertProwlerConfiguration & { prowlerPasswordHash: string }): Promise<ProwlerConfiguration>;
  updateConfigurationStatus(configId: string, status: "connected" | "disconnected" | "error", lastSyncAt?: Date): Promise<void>;
  
  // Asset operations
  getAssets(configurationId: string, filters?: {
    resourceType?: string;
    status?: string;
    severity?: string;
    search?: string;
  }): Promise<Asset[]>;
  upsertAssets(configurationId: string, assets: Array<Omit<Asset, 'id' | 'configurationId' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  getAssetStats(configurationId: string): Promise<{
    totalResources: number;
    criticalIssues: number;
    compliantResources: number;
    lastScan: Date | null;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // User operations for local authentication.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Prowler configuration operations
  async getProwlerConfiguration(userId: string): Promise<ProwlerConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(prowlerConfigurations)
      .where(and(eq(prowlerConfigurations.userId, userId), eq(prowlerConfigurations.isActive, true)));
    return config;
  }

  async upsertProwlerConfiguration(userId: string, config: InsertProwlerConfiguration & { prowlerPasswordHash: string }): Promise<ProwlerConfiguration> {
    // First, deactivate any existing configurations
    await db
      .update(prowlerConfigurations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(prowlerConfigurations.userId, userId));

    // Insert new configuration
    const [newConfig] = await db
      .insert(prowlerConfigurations)
      .values({
        userId,
        prowlerUrl: config.prowlerUrl,
        prowlerEmail: config.prowlerEmail,
        prowlerPasswordHash: config.prowlerPasswordHash,
        isActive: true,
      })
      .returning();
    
    return newConfig;
  }

  async updateConfigurationStatus(configId: string, status: "connected" | "disconnected" | "error", lastSyncAt?: Date): Promise<void> {
    await db
      .update(prowlerConfigurations)
      .set({ 
        connectionStatus: status, 
        lastSyncAt: lastSyncAt || new Date(),
        updatedAt: new Date() 
      })
      .where(eq(prowlerConfigurations.id, configId));
  }

  // Asset operations
  async getAssets(configurationId: string, filters?: {
    resourceType?: string;
    status?: string;
    severity?: string;
    search?: string;
  }): Promise<Asset[]> {
    const conditions = [eq(assets.configurationId, configurationId)];

    if (filters?.resourceType) {
      conditions.push(eq(assets.resourceType, filters.resourceType));
    }
    if (filters?.status) {
      conditions.push(eq(assets.status, filters.status as any));
    }
    if (filters?.severity) {
      conditions.push(eq(assets.severity, filters.severity as any));
    }

    const results = await db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(desc(assets.updatedAt));
    
    if (filters?.search) {
      return results.filter(asset => 
        asset.resourceName.toLowerCase().includes(filters.search!.toLowerCase()) ||
        asset.resourceId.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    return results;
  }

  async upsertAssets(configurationId: string, assetsData: Array<Omit<Asset, 'id' | 'configurationId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    // Clear existing assets for this configuration
    await db.delete(assets).where(eq(assets.configurationId, configurationId));

    // Insert new assets
    if (assetsData.length > 0) {
      await db.insert(assets).values(
        assetsData.map(asset => ({
          ...asset,
          configurationId,
        }))
      );
    }
  }

  async getAssetStats(configurationId: string): Promise<{
    totalResources: number;
    criticalIssues: number;
    compliantResources: number;
    lastScan: Date | null;
  }> {
    const allAssets = await db.select().from(assets).where(eq(assets.configurationId, configurationId));
    
    const totalResources = allAssets.length;
    const criticalIssues = allAssets.filter(asset => asset.severity === 'critical').length;
    const compliantResources = allAssets.filter(asset => asset.status === 'compliant').length;
    const lastScan = allAssets.length > 0 
      ? new Date(Math.max(...allAssets.map(asset => new Date(asset.lastCheckedAt || asset.updatedAt!).getTime())))
      : null;

    return {
      totalResources,
      criticalIssues,
      compliantResources,
      lastScan,
    };
  }
}

export const storage = new DatabaseStorage();
