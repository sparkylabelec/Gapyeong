import { users, reports, type User, type InsertUser, type Report, type InsertReport } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getReportsByUser(userId: number): Promise<Report[]>;
  getReportByWeek(userId: number, year: number, weekNumber: number): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport & { userId: number }): Promise<Report>;
  updateReport(id: number, report: Partial<Report>): Promise<Report>;
  deleteReport(id: number): Promise<void>;
  approveReport(id: number, approver: string): Promise<Report>;
  rejectReport(id: number, reason: string): Promise<Report>;
  getDepartmentStats(): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private currentUserId: number;
  private currentReportId: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;

    // Add sample admin user
    this.users.set(1, {
      id: 1,
      uid: "admin-uid",
      email: "admin@gapyeong.go.kr",
      name: "관리자",
      department: "총무팀",
      role: "admin",
      createdAt: new Date(),
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.uid === uid);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "employee",
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getReportByWeek(userId: number, year: number, weekNumber: number): Promise<Report | undefined> {
    return Array.from(this.reports.values())
      .find(report => 
        report.userId === userId && 
        report.weekYear === year && 
        report.weekNumber === weekNumber
      );
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createReport(reportData: InsertReport & { userId: number }): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = {
      ...reportData,
      issues: reportData.issues || null,
      achievements: reportData.achievements || null,
      budgetLabor: reportData.budgetLabor || null,
      budgetMaterials: reportData.budgetMaterials || null,
      budgetOthers: reportData.budgetOthers || null,
      attachments: reportData.attachments || null,
      approvedBy: reportData.approvedBy || null,
      approvedAt: reportData.approvedAt || null,
      rejectionReason: reportData.rejectionReason || null,
      status: reportData.status || "pending",
      isDraft: reportData.isDraft || false,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: number, reportData: Partial<Report>): Promise<Report> {
    const existingReport = this.reports.get(id);
    if (!existingReport) {
      throw new Error("Report not found");
    }

    const updatedReport: Report = {
      ...existingReport,
      ...reportData,
      updatedAt: new Date(),
    };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteReport(id: number): Promise<void> {
    this.reports.delete(id);
  }

  async approveReport(id: number, approver: string): Promise<Report> {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error("Report not found");
    }

    const updatedReport: Report = {
      ...report,
      status: "approved",
      approvedBy: approver,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async rejectReport(id: number, reason: string): Promise<Report> {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error("Report not found");
    }

    const updatedReport: Report = {
      ...report,
      status: "rejected",
      rejectionReason: reason,
      updatedAt: new Date(),
    };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async getDepartmentStats(): Promise<any[]> {
    const allReports = Array.from(this.reports.values());
    const departments = new Map<string, { total: number; approved: number; pending: number; }>();

    allReports.forEach(report => {
      const dept = report.department;
      if (!departments.has(dept)) {
        departments.set(dept, { total: 0, approved: 0, pending: 0 });
      }
      
      const stats = departments.get(dept)!;
      stats.total++;
      
      if (report.status === "approved") {
        stats.approved++;
      } else if (report.status === "pending") {
        stats.pending++;
      }
    });

    return Array.from(departments.entries()).map(([department, stats]) => ({
      department,
      ...stats,
    }));
  }
}

export const storage = new MemStorage();
