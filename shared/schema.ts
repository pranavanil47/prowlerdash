import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for local authentication.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique().notNull(),
  passwordHash: text("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "user"] }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prowler configuration storage table
export const prowlerConfigurations = pgTable("prowler_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prowlerUrl: text("prowler_url").notNull(),
  prowlerEmail: text("prowler_email").notNull(),
  prowlerPasswordHash: text("prowler_password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  connectionStatus: varchar("connection_status", { enum: ["connected", "disconnected", "error"] }).default("disconnected"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset/Resource storage table for caching Prowler data
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configurationId: varchar("configuration_id").notNull().references(() => prowlerConfigurations.id, { onDelete: "cascade" }),
  resourceId: text("resource_id").notNull(),
  resourceName: text("resource_name").notNull(),
  resourceType: text("resource_type").notNull(),
  region: text("region"),
  status: varchar("status", { enum: ["compliant", "non-compliant", "warning", "unknown"] }).notNull(),
  severity: varchar("severity", { enum: ["critical", "high", "medium", "low"] }),
  rawData: jsonb("raw_data"),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertProwlerConfigurationSchema = createInsertSchema(prowlerConfigurations).pick({
  prowlerUrl: true,
  prowlerEmail: true,
});

export const prowlerConfigurationSchema = insertProwlerConfigurationSchema.extend({
  prowlerPassword: z.string().min(1, "Password is required"),
});

export type InsertProwlerConfiguration = z.infer<typeof insertProwlerConfigurationSchema>;
export type ProwlerConfigurationInput = z.infer<typeof prowlerConfigurationSchema>;
export type ProwlerConfiguration = typeof prowlerConfigurations.$inferSelect;
export type Asset = typeof assets.$inferSelect;
