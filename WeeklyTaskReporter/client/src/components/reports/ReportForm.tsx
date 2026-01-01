import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, Eye, Send, X, Upload, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { insertReportSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, getWeek, getYear } from "date-fns";
import { ko } from "date-fns/locale";
import { z } from "zod";

const reportFormSchema = insertReportSchema.extend({
  budgetLabor: z.string().optional(),
  budgetMaterials: z.string().optional(),
  budgetOthers: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

interface ReportFormProps {
  onBack: () => void;
}

export default function ReportForm({ onBack }: ReportFormProps) {
  const { user, userProfile } = useAuth();
  const { createReport, isCreating } = useReports();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const currentDate = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
  const year = getYear(currentDate);
  const weekPeriod = `${format(weekStart, "yyyy.MM.dd", { locale: ko })} ~ ${format(weekEnd, "yyyy.MM.dd", { locale: ko })}`;

  // 지난주 기간 계산
  const lastWeekDate = new Date(currentDate);
  lastWeekDate.setDate(currentDate.getDate() - 7);
  const lastWeekStart = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
  const lastWeekPeriod = `${format(lastWeekStart, "yyyy.MM.dd", { locale: ko })} ~ ${format(lastWeekEnd, "yyyy.MM.dd", { locale: ko })}`;

  // 로컬 스토리지에서 사용자 정보 가져오기
  const getUserInfo = () => {
    if (!user) return { name: "", department: "" };
    
    const savedName = localStorage.getItem(`user_name_${user.uid}`);
    const savedDepartment = localStorage.getItem(`user_department_${user.uid}`);
    
    return {
      name: savedName || userProfile?.name || "",
      department: savedDepartment || userProfile?.department || "",
    };
  };

  const userInfo = getUserInfo();

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 형식 확인 (Word, PDF, 이미지 파일 허용)
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/pdf', // .pdf
        'image/jpeg', // .jpg
        'image/png', // .png
        'image/gif', // .gif
      ];
      
      if (allowedTypes.includes(file.type)) {
        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "파일 크기 초과",
            description: "파일 크기는 10MB 이하여야 합니다.",
            variant: "destructive",
          });
          return;
        }

        // 파일을 base64로 변환하여 저장
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64Data,
            uploadedAt: new Date().toISOString(),
          };
          
          setUploadedFile(file);
          // attachments 필드에 파일 데이터 저장
          form.setValue("attachments", [fileData] as any);
          form.setValue("thisWeekWork", `업로드된 파일: ${file.name}`);
          
          toast({
            title: "파일 업로드 완료",
            description: `${file.name} 파일이 업로드되었습니다.`,
          });
        };
        
        reader.onerror = () => {
          toast({
            title: "파일 읽기 오류",
            description: "파일을 읽는 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        };
        
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "파일 형식 오류",
          description: "Word, PDF, 이미지 파일(.doc, .docx, .pdf, .jpg, .png, .gif)만 업로드 가능합니다.",
          variant: "destructive",
        });
      }
    }
  };

  // 파일 제거 핸들러
  const handleFileRemove = () => {
    setUploadedFile(null);
    form.setValue("attachments", null);
    form.setValue("thisWeekWork", "");
    // 파일 input 초기화
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast({
      title: "파일 제거 완료",
      description: "첨부파일이 제거되었습니다.",
    });
  };

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      authorName: "",
      department: "",
      weekYear: year,
      weekNumber: weekNumber,
      weekPeriod: weekPeriod,
      title: `${year}년 ${Math.ceil(weekNumber / 4)}월 ${weekNumber % 4 || 4}주차 업무보고`,
      thisWeekWork: "",
      achievements: "",
      issues: "",
      nextWeekPlan: "",
      budgetLabor: "",
      budgetMaterials: "",
      budgetOthers: "",
      status: "pending",
      isDraft: false,
    },
  });

  // 사용자 정보가 로드되면 폼 필드 업데이트
  useEffect(() => {
    if (user) {
      const savedName = localStorage.getItem(`user_name_${user.uid}`);
      const savedDepartment = localStorage.getItem(`user_department_${user.uid}`);
      
      const name = savedName || userProfile?.name || "";
      const department = savedDepartment || userProfile?.department || "";
      
      if (name) {
        form.setValue("authorName", name);
      }
      if (department) {
        form.setValue("department", department);
      }
    }
  }, [user, userProfile, form]);

  const onSubmit = (data: ReportFormData, isDraft = false) => {
    const reportData = {
      ...data,
      isDraft,
      status: isDraft ? "draft" : "pending",
    };

    createReport(reportData, {
      onSuccess: () => {
        toast({
          title: isDraft ? "임시저장 완료" : "보고서 제출 완료",
          description: isDraft ? "보고서가 임시저장되었습니다." : "보고서가 성공적으로 제출되었습니다.",
        });
        onBack();
      },
      onError: (error) => {
        toast({
          title: "오류",
          description: "보고서 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      },
    });
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    onSubmit(data, true);
  };

  const handleSubmit = (data: ReportFormData) => {
    onSubmit(data, false);
  };

  if (showPreview) {
    const formData = form.getValues();
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>보고서 미리보기</CardTitle>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                <X className="w-4 h-4 mr-2" />
                닫기
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">주간 업무보고서</h2>
              <p className="text-gray-600">{formData.weekPeriod}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">작성자:</span> {formData.authorName}
              </div>
              <div>
                <span className="font-medium">소속:</span> {formData.department}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">전주 업무 추진 실적 (지난주 기간)</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {uploadedFile ? (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500">업로드된 파일이 없습니다.</p>
                )}
              </div>
            </div>

            

            <div>
              <h3 className="font-medium mb-2">다음 주 업무 계획</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{formData.nextWeekPlan || "작성된 내용이 없습니다."}</p>
              </div>
            </div>

            
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>주간 업무보고서 작성</CardTitle>
          <p className="text-sm text-gray-600">{weekPeriod}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>작성자</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>소속 부서</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="weekPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>보고 주차</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>보고서 제목</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 이번 주 업무 실적 - 파일 업로드 */}
              <FormField
                control={form.control}
                name="thisWeekWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>업무추진실적 및 계획 업로드</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* 파일 업로드 영역 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            id="file-upload"
                            type="file"
                            accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center space-y-2">
                              <Upload className="w-8 h-8 text-gray-400" />
                              <div className="text-sm text-gray-600">
                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                  클릭하여 파일 선택
                                </span>
                                <p className="mt-1">Word, PDF, 이미지 파일(.doc, .docx, .pdf, .jpg, .png, .gif) 업로드 가능</p>
                                <p className="text-xs text-gray-500">최대 파일 크기: 10MB</p>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* 업로드된 파일 표시 */}
                        {uploadedFile && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                {uploadedFile.name}
                              </span>
                              <span className="text-xs text-blue-600">
                                ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleFileRemove}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {/* 숨겨진 텍스트 필드 (폼 검증용) */}
                        <input
                          type="hidden"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              

              {/* 다음 주 계획 */}
              <FormField
                control={form.control}
                name="nextWeekPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="min-h-32 resize-none" 
                        placeholder="메모를 작성해주세요."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              

              {/* 버튼 그룹 */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isCreating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    임시저장
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    미리보기
                  </Button>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={onBack}
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isCreating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isCreating ? "제출 중..." : "제출하기"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
