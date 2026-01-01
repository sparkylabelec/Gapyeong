import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase UID
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  role: text("role").notNull().default("employee"), // "employee" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  department: text("department").notNull(),
  weekYear: integer("week_year").notNull(), // e.g., 2024
  weekNumber: integer("week_number").notNull(), // 1-53
  weekPeriod: text("week_period").notNull(), // e.g., "2024.01.22 ~ 2024.01.28"
  title: text("title").notNull(),
  thisWeekWork: text("this_week_work").notNull(),
  achievements: text("achievements"),
  issues: text("issues"),
  nextWeekPlan: text("next_week_plan").notNull(),
  budgetLabor: text("budget_labor"),
  budgetMaterials: text("budget_materials"),
  budgetOthers: text("budget_others"),
  attachments: jsonb("attachments"), // Array of file info
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  isDraft: boolean("is_draft").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReportSchema = insertReportSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
