import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, signOutUser } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get user profile from backend or localStorage
  const { data: userProfile } = useQuery({
    queryKey: ["/api/auth/profile", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      
      // 로컬 스토리지에서 사용자 정보 가져오기
      const savedDepartment = localStorage.getItem(`user_department_${user.uid}`);
      const savedRole = localStorage.getItem(`user_role_${user.uid}`);
      const savedName = localStorage.getItem(`user_name_${user.uid}`);
      
      if (savedDepartment && savedRole && savedName) {
        return {
          id: 1,
          uid: user.uid,
          email: user.email,
          name: savedName,
          department: savedDepartment,
          role: savedRole,
          isAdmin: savedRole === "admin",
          createdAt: new Date(),
        };
      }
      
      // 백엔드에서 정보 가져오기 시도
      try {
        const response = await fetch("/api/auth/profile");
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log("프로필 정보 백엔드 로드 실패, 로컬 정보 사용");
      }
      
      // 기본값 반환
      return {
        id: 1,
        uid: user.uid,
        email: user.email,
        name: user.displayName || "사용자",
        department: "미지정",
        role: "employee",
        isAdmin: false,
        createdAt: new Date(),
      };
    },
  });

  // Sync user with backend
  const syncUserMutation = useMutation({
    mutationFn: async (firebaseUser: User & { isAdmin?: boolean; department?: string }) => {
      const response = await apiRequest("POST", "/api/auth/sync", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "사용자",
        department: firebaseUser.department || "미지정",
        role: firebaseUser.isAdmin ? "admin" : "employee",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/profile"] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      queryClient.clear();
      setUser(null);
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        // 로컬 스토리지에서 부서 정보 가져오기 (회원가입 시 저장됨)
        const savedDepartment = localStorage.getItem(`user_department_${firebaseUser.uid}`);
        const savedRole = localStorage.getItem(`user_role_${firebaseUser.uid}`);
        
        const userWithExtraInfo = {
          ...firebaseUser,
          department: savedDepartment || "미지정",
          isAdmin: savedRole === "admin"
        } as any;
        
        syncUserMutation.mutate(userWithExtraInfo);
      }
    });

    return unsubscribe;
  }, []);

  return {
    user,
    userProfile,
    loading,
    signOut: () => signOutMutation.mutate(),
    isSigningOut: signOutMutation.isPending,
  };
}
