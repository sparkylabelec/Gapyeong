import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, LogIn, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { signInWithEmail, signUpWithEmail, resetPassword } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

const signupSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string(),
  department: z.string().min(1, "부서를 선택해주세요"),
  isAdmin: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
      isAdmin: false,
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const departments = [
    "안전감사실",
    "혁신기획팀",
    "경영지원팀",
    "산장관광지",
    "칼봉산자연휴양림",
    "연인산다목적캠핑장",
    "자라섬캠핑장",
    "교통약자이동지원센터",
    "문화예술회관",
    "여성비전센터",
    "종량제봉투판매",
    "잣고을전통시장 창업경제타운",
    "한석봉체육관",
    "생활체육파트",
    "조종국민체육센터",
    "청평호반문화체육센터",
    "가평파크골프장"
  ];

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const result = await signUpWithEmail(data.email, data.password, data.name);
      
      // 사용자 정보를 로컬 스토리지에 저장 (부서 및 권한 포함)
      if (result.user) {
        localStorage.setItem(`user_department_${result.user.uid}`, data.department);
        localStorage.setItem(`user_role_${result.user.uid}`, data.isAdmin ? "admin" : "employee");
        localStorage.setItem(`user_name_${result.user.uid}`, data.name);
        
        // 백엔드 동기화 시도 (실패해도 로컬 정보는 유지)
        try {
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              name: data.name,
              department: data.department,
              role: data.isAdmin ? "admin" : "employee",
            }),
          });
        } catch (syncError) {
          console.log("백엔드 동기화 오류 (로컬 정보는 저장됨):", syncError);
        }
      }
      
      toast({
        title: "회원가입 성공",
        description: `${data.isAdmin ? '관리자' : '직원'} 계정이 생성되었습니다. 로그인해주세요.`,
      });
      // 회원가입 성공 후 로그인 탭으로 이동
      (document.querySelector('[value="login"]') as HTMLElement)?.click();
    } catch (error: any) {
      toast({
        title: "회원가입 실패", 
        description: error.message || "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      toast({
        title: "비밀번호 재설정 이메일 발송",
        description: "입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해주세요.",
      });
      resetPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: "비밀번호 재설정 실패",
        description: error.message || "비밀번호 재설정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Building className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">가평시설관리공단</CardTitle>
          <p className="text-gray-600 mt-2">업무보고 시스템</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
              <TabsTrigger value="reset">비밀번호 찾기</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input placeholder="이메일을 입력해주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="비밀번호를 입력해주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름</FormLabel>
                        <FormControl>
                          <Input placeholder="이름을 입력해주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input placeholder="이메일을 입력해주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>부서</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">부서를 선택해주세요</option>
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="비밀번호를 입력해주세요 (최소 6자)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호 확인</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="비밀번호를 다시 입력해주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            관리자 계정으로 가입
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            관리자 권한으로 가입하면 모든 보고서를 검토하고 승인할 수 있습니다.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    size="lg"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    {isLoading ? "가입 중..." : "회원가입"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="reset" className="space-y-4">
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  <FormField
                    control={resetPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일 주소</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="이메일을 입력하세요"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    입력하신 이메일 주소로 비밀번호 재설정 링크를 보내드립니다. 
                    이메일을 확인한 후 링크를 클릭하여 새로운 비밀번호를 설정해주세요.
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isLoading ? "전송 중..." : "비밀번호 재설정 이메일 보내기"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
