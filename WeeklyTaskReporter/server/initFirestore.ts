import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

export async function initializeFirestoreCollections() {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
      console.log("Firebase 설정이 없어 Firestore 초기화를 건너뜁니다.");
      return;
    }

    const app = initializeApp(firebaseConfig, "init-app");
    const db = getFirestore(app);

    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    if (usersSnapshot.empty) {
      console.log("Firestore 컬렉션 초기화 중...");

      await setDoc(doc(db, "users", "sample_admin"), {
        uid: "sample_admin",
        email: "admin@gapyeong.go.kr",
        name: "관리자",
        department: "혁신기획팀",
        role: "admin",
        createdAt: new Date(),
      });

      await setDoc(doc(db, "users", "sample_employee"), {
        uid: "sample_employee",
        email: "employee@gapyeong.go.kr",
        name: "홍길동",
        department: "경영지원팀",
        role: "employee",
        createdAt: new Date(),
      });

      const now = new Date();
      const weekNumber = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
      
      await setDoc(doc(db, "reports", "sample_report"), {
        userId: 1,
        authorName: "홍길동",
        department: "경영지원팀",
        weekYear: now.getFullYear(),
        weekNumber: weekNumber,
        weekPeriod: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.01 ~ ${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.07`,
        title: "샘플 주간업무보고",
        thisWeekWork: "- 샘플 업무 내용입니다.\n- 이번 주 수행한 업무를 작성합니다.",
        achievements: "주요 성과 내용",
        issues: "",
        nextWeekPlan: "- 다음 주 계획을 작성합니다.",
        budgetLabor: "",
        budgetMaterials: "",
        budgetOthers: "",
        attachments: null,
        status: "pending",
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        isDraft: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Firestore 컬렉션 초기화 완료!");
      console.log("- users 컬렉션: 2개의 샘플 문서 생성");
      console.log("- reports 컬렉션: 1개의 샘플 문서 생성");
    } else {
      console.log("Firestore 컬렉션이 이미 존재합니다.");
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firestore 권한 오류 - Firebase Console에서 보안 규칙을 설정해주세요.");
    } else {
      console.error("Firestore 초기화 오류:", error.message);
    }
  }
}
