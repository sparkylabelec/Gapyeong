import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth,
  updateProfile,
  sendPasswordResetEmail 
} from "firebase/auth";
import { auth } from "./firebase";

// Firebase 인증이 초기화되지 않은 경우 오류 방지
const isFirebaseReady = (): boolean => {
  return auth !== null && auth !== undefined;
};

export function signInWithEmail(email: string, password: string) {
  if (!isFirebaseReady() || !auth) {
    console.error("Firebase 인증이 초기화되지 않았습니다.");
    return Promise.reject(new Error("Firebase 인증이 초기화되지 않았습니다."));
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUpWithEmail(email: string, password: string, name: string) {
  if (!isFirebaseReady() || !auth) {
    console.error("Firebase 인증이 초기화되지 않았습니다.");
    return Promise.reject(new Error("Firebase 인증이 초기화되지 않았습니다."));
  }
  return createUserWithEmailAndPassword(auth, email, password)
    .then((result) => {
      // 사용자 프로필에 이름 설정
      if (result.user) {
        return updateProfile(result.user, { displayName: name }).then(() => result);
      }
      return result;
    });
}

export function signOutUser() {
  if (!isFirebaseReady() || !auth) {
    return Promise.resolve();
  }
  return signOut(auth);
}

export function resetPassword(email: string) {
  if (!isFirebaseReady() || !auth) {
    console.error("Firebase 인증이 초기화되지 않았습니다.");
    return Promise.reject(new Error("Firebase 인증이 초기화되지 않았습니다."));
  }
  return sendPasswordResetEmail(auth, email);
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isFirebaseReady() || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
