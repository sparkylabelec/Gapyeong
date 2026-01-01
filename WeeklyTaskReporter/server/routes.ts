import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
// Import Firestore functions
import {
  createUser as firestoreCreateUser,
  getUserByUid as firestoreGetUserByUid,
  getAllUsers as firestoreGetAllUsers,
  createReport as firestoreCreateReport,
  getReportsByUser as firestoreGetReportsByUser,
  getAllReports as firestoreGetAllReports,
  updateReport as firestoreUpdateReport,
  deleteReport as firestoreDeleteReport,
  approveReport as firestoreApproveReport,
  rejectReport as firestoreRejectReport,
  getReportByWeek as firestoreGetReportByWeek,
  getDepartmentStats as firestoreGetDepartmentStats
} from "./firestore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      let user = await firestoreGetUserByUid(userData.uid);
      
      if (user) {
        res.json(user);
      } else {
        const newUser = await firestoreCreateUser(userData);
        res.json(newUser);
      }
    } catch (error) {
      console.error("Auth sync error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/auth/profile", async (req, res) => {
    try {
      // In a real app, you'd extract user from JWT token
      // For now, we'll return the first user from Firestore
      const users = await firestoreGetAllUsers();
      if (users.length > 0) {
        res.json(users[0]);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Report routes
  app.get("/api/reports", async (req, res) => {
    try {
      // In a real app, filter by authenticated user
      const reports = await firestoreGetReportsByUser(1); // Assuming user ID 1
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/reports/current", async (req, res) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const weekNumber = Math.ceil((now.getDate() + new Date(year, 0, 1).getDay()) / 7);
      
      const report = await firestoreGetReportByWeek(1, year, weekNumber); // Assuming user ID 1
      res.json(report);
    } catch (error) {
      console.error("Get current report error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await firestoreCreateReport({
        ...reportData,
        userId: 1, // In a real app, get from auth
      });
      res.json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(400).json({ message: "Invalid report data" });
    }
  });

  app.put("/api/reports/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const reportData = insertReportSchema.partial().parse(req.body);
      await firestoreUpdateReport(id, reportData);
      res.json({ success: true });
    } catch (error) {
      console.error("Update report error:", error);
      res.status(400).json({ message: "Invalid report data" });
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`Deleting report with ID: ${id}`);
      await firestoreDeleteReport(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/reports", async (req, res) => {
    try {
      const reports = await firestoreGetAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Get all reports error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await firestoreGetDepartmentStats();
      res.json(stats);
    } catch (error) {
      console.error("Get department stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/reports/:id/approve", async (req, res) => {
    try {
      const id = req.params.id;
      await firestoreApproveReport(id, "관리자"); // In a real app, get from auth
      res.json({ success: true });
    } catch (error) {
      console.error("Approve report error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/reports/:id/reject", async (req, res) => {
    try {
      const id = req.params.id;
      const { reason } = req.body;
      await firestoreRejectReport(id, reason);
      res.json({ success: true });
    } catch (error) {
      console.error("Reject report error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
