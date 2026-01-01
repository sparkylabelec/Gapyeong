import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  Timestamp 
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type { InsertUser, User, InsertReport, Report } from "@shared/schema";

// Firebase configuration for server
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let app: any = null;
let db: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Server Firebase 초기화 완료");
  } else {
    console.warn("Server Firebase 설정 값이 누락되었습니다.");
  }
} catch (error) {
  console.error("Server Firebase 초기화 오류:", error);
}

// Users Collection
export const createUser = async (userData: InsertUser): Promise<User> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const docRef = await addDoc(collection(db, "users"), {
    ...userData,
    createdAt: Timestamp.now(),
  });

  return {
    id: parseInt(docRef.id, 36), // Convert to number for compatibility
    ...userData,
    role: userData.role || "employee",
    createdAt: new Date(),
  };
};

export const getUserByUid = async (uid: string): Promise<User | null> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const q = query(collection(db, "users"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  const data = doc.data();

  return {
    id: parseInt(doc.id, 36),
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as User;
};

export const getAllUsers = async (): Promise<User[]> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: parseInt(doc.id, 36),
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as User;
  });
};

// Reports Collection
export const createReport = async (reportData: InsertReport & { userId: number }): Promise<Report> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const docRef = await addDoc(collection(db, "reports"), {
    ...reportData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id, // Use actual Firestore document ID
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
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
};

export const getReportsByUser = async (userId: number): Promise<Report[]> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const q = query(
    collection(db, "reports"), 
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);

  const reports = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id, // Use the actual Firestore document ID as string
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      approvedAt: data.approvedAt?.toDate() || null,
    } as any;
  });

  // Sort by createdAt in descending order in memory
  return reports.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
};

export const getAllReports = async (): Promise<Report[]> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id, // Use actual Firestore document ID
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      approvedAt: data.approvedAt?.toDate() || null,
    } as any;
  });
};

export const updateReport = async (reportId: string, updates: Partial<Report>): Promise<void> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteReport = async (reportId: string): Promise<void> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const reportRef = doc(db, "reports", reportId);
  await deleteDoc(reportRef);
};

export const approveReport = async (reportId: string, approver: string): Promise<void> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    status: "approved",
    approvedBy: approver,
    approvedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const rejectReport = async (reportId: string, reason: string): Promise<void> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    status: "rejected",
    rejectionReason: reason,
    updatedAt: Timestamp.now(),
  });
};

export const getReportByWeek = async (userId: number, year: number, weekNumber: number): Promise<Report | null> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const q = query(
    collection(db, "reports"),
    where("userId", "==", userId),
    where("weekYear", "==", year),
    where("weekNumber", "==", weekNumber)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  const data = doc.data();

  return {
    id: parseInt(doc.id, 36),
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    approvedAt: data.approvedAt?.toDate() || null,
  } as Report;
};

export const getDepartmentStats = async (): Promise<any[]> => {
  if (!db) throw new Error("Firestore가 초기화되지 않았습니다.");

  const reportsSnapshot = await getDocs(collection(db, "reports"));
  const reports = reportsSnapshot.docs.map(doc => doc.data());

  const departments = new Map<string, { total: number; approved: number; pending: number; }>();

  reports.forEach(report => {
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
};