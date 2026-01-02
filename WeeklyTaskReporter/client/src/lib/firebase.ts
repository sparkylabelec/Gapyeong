import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 초기화
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase 초기화 완료");
  } else {
    console.warn("Firebase 설정 값이 누락되었습니다. 환경 변수를 확인해주세요.");
  }
} catch (error) {
  console.error("Firebase 초기화 오류:", error);
}

// Storage 유틸리티 함수
export const uploadFileToStorage = async (file: File, userId: string): Promise<{ url: string; path: string }> => {
  if (!storage) throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const filePath = `reports/${userId}/${fileName}`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return { url: downloadURL, path: filePath };
};

export const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  if (!storage) throw new Error("Firebase Storage가 초기화되지 않았습니다.");
  
  const storageRef = ref(storage, filePath);
  await deleteObject(storageRef);
};

export { auth, db, storage };
export default app;
