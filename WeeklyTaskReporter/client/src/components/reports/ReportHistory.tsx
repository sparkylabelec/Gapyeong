import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Eye, Download, FileText, Trash2, X } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function ReportHistory() {
  const { reports, isLoading, deleteReport } = useReports();
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">승인완료</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">검토중</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">반려</Badge>;
      case "draft":
        return <Badge variant="outline">임시저장</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  // 체크박스 관련 함수들
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(filteredReports.map((report: any) => report.id.toString()));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  // 삭제 함수
  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) return;
    
    const deleteCount = selectedReports.length;
    console.log("Starting deletion of reports:", selectedReports);
    
    try {
      // 각 보고서를 순차적으로 삭제
      for (const reportId of selectedReports) {
        console.log("Deleting report:", reportId);
        await new Promise((resolve, reject) => {
          deleteReport(reportId, {
            onSuccess: () => {
              console.log("Successfully deleted report:", reportId);
              resolve(true);
            },
            onError: (error) => {
              console.error("Failed to delete report:", reportId, error);
              reject(error);
            }
          });
        });
      }
      
      toast({
        title: "삭제 완료",
        description: `${deleteCount}개의 보고서가 삭제되었습니다.`,
      });
      
      setSelectedReports([]);
      
    } catch (error) {
      console.error("Deletion process failed:", error);
      toast({
        title: "삭제 실패", 
        description: "보고서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 개별 보고서의 첨부파일 다운로드
  const handleDownloadReport = (report: any) => {
    console.log("Downloading report:", report);
    console.log("Attachments:", report.attachments);
    
    // 첨부파일이 있는지 확인
    if (report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0) {
      const attachment = report.attachments[0]; // 첫 번째 첨부파일
      console.log("Downloading attachment:", attachment);
      
      try {
        let base64Data;
        
        // base64 데이터 추출
        if (attachment.data.includes(',')) {
          base64Data = attachment.data.split(',')[1]; // data:type;base64, 부분 제거
        } else {
          base64Data = attachment.data; // 이미 순수 base64인 경우
        }
        
        // base64를 바이너리로 변환
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Blob 생성 (원본 파일 타입 유지)
        const blob = new Blob([bytes], { type: attachment.type });
        
        // 다운로드 링크 생성 및 실행
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name; // 원본 파일명 유지
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // 정리
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        toast({
          title: "첨부파일 다운로드 완료",
          description: `${attachment.name} 파일이 다운로드되었습니다.`,
        });
        
      } catch (error) {
        console.error("파일 다운로드 오류:", error);
        toast({
          title: "다운로드 실패",
          description: "첨부파일 다운로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } else {
      // 첨부파일이 없으면 알림만 표시
      toast({
        title: "첨부파일 없음",
        description: "이 보고서에는 첨부파일이 없습니다.",
        variant: "destructive",
      });
    }
  };

  // 선택된 보고서들 일괄 내보내기
  const handleExportSelected = () => {
    if (selectedReports.length === 0) {
      toast({
        title: "선택된 보고서가 없습니다",
        description: "내보낼 보고서를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const selectedReportData = filteredReports.filter((report: any) => 
      selectedReports.includes(report.id.toString())
    );

    let content = `가평시설관리공단 주간업무보고서 모음\n\n`;
    content += `생성일: ${format(new Date(), "yyyy년 MM월 dd일 HH시 mm분", { locale: ko })}\n`;
    content += `총 ${selectedReportData.length}개 보고서\n\n`;
    content += "=".repeat(80) + "\n\n";

    selectedReportData.forEach((report: any, index: number) => {
      content += `${index + 1}. ${report.title}\n`;
      content += `담당자: ${report.authorName} | 부서: ${report.department}\n`;
      content += `보고기간: ${report.weekPeriod}\n`;
      content += `작성일: ${format(new Date(report.createdAt), "yyyy.MM.dd", { locale: ko })}\n\n`;
      
      content += `이번 주 업무:\n${report.thisWeekWork}\n\n`;
      
      if (report.achievements) {
        content += `성과 및 특이사항:\n${report.achievements}\n\n`;
      }
      
      if (report.issues) {
        content += `애로사항:\n${report.issues}\n\n`;
      }
      
      content += `다음 주 계획:\n${report.nextWeekPlan}\n\n`;
      
      if (report.budgetLabor || report.budgetMaterials || report.budgetOthers) {
        content += `예산 현황:\n`;
        if (report.budgetLabor) content += `- 인건비: ${report.budgetLabor}\n`;
        if (report.budgetMaterials) content += `- 재료비: ${report.budgetMaterials}\n`;
        if (report.budgetOthers) content += `- 기타: ${report.budgetOthers}\n`;
        content += "\n";
      }
      
      content += "-".repeat(60) + "\n\n";
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `주간업무보고서_모음_${format(new Date(), "yyyyMMdd", { locale: ko })}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "내보내기 완료",
      description: `${selectedReportData.length}개 보고서가 내보내기되었습니다.`,
    });
  };

  const filteredReports = Array.isArray(reports) ? reports.filter((report: any) => {
    if (filterPeriod === "all") return true;
    
    const reportDate = new Date(report.createdAt);
    const now = new Date();
    
    switch (filterPeriod) {
      case "thisMonth":
        return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
      case "lastMonth":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return reportDate.getMonth() === lastMonth.getMonth() && reportDate.getFullYear() === lastMonth.getFullYear();
      case "last3Months":
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return reportDate >= threeMonthsAgo;
      case "older3Months":
        const threeMonthsAgoCutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return reportDate < threeMonthsAgoCutoff;
      default:
        return true;
    }
  }) : [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>보고서 작성 이력</CardTitle>
            <div className="flex items-center space-x-3">
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="thisMonth">이번 달</SelectItem>
                  <SelectItem value="lastMonth">지난 달</SelectItem>
                  <SelectItem value="last3Months">최근 3개월</SelectItem>
                  <SelectItem value="older3Months">3개월 이전</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedReports.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      선택 삭제 ({selectedReports.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>보고서 삭제 확인</AlertDialogTitle>
                      <AlertDialogDescription>
                        선택한 {selectedReports.length}개의 보고서를 삭제하시겠습니까? 
                        이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleExportSelected}
              >
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-10 py-3 px-4">
                      <Checkbox
                        checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">보고서 제목</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">제출일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">승인자</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report: any) => (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedReports.includes(report.id.toString())}
                          onCheckedChange={(checked) => handleSelectReport(report.id.toString(), checked as boolean)}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{report.title}</p>
                          <p className="text-sm text-gray-500">{report.weekPeriod}</p>
                          {report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">📎 첨부파일 있음</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {format(new Date(report.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {report.approvedBy || "-"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="보기"
                            onClick={() => setPreviewReport(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="다운로드"
                            onClick={() => {
                              console.log("Report data:", report);
                              console.log("Report attachments:", report.attachments);
                              handleDownloadReport(report);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">보고서가 없습니다</h3>
              <p className="text-gray-500">선택한 기간에 작성된 보고서가 없습니다.</p>
            </div>
          )}
          
          {filteredReports.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                총 <span className="font-medium">{filteredReports.length}</span>개 보고서
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  이전
                </Button>
                <Button size="sm" className="bg-blue-600 text-white">1</Button>
                <Button variant="outline" size="sm" disabled>
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 미리보기 다이얼로그 */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>보고서 미리보기</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewReport(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {previewReport && (
            <div className="space-y-6 p-6 bg-white">
              {/* 보고서 헤더 */}
              <div className="text-center border-b pb-6">
                <h1 className="text-2xl font-bold mb-2">가평시설관리공단</h1>
                <h2 className="text-xl font-semibold mb-4">주간업무보고서</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <span className="font-medium">보고기간:</span> {previewReport.weekPeriod}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">작성일:</span> {format(new Date(previewReport.createdAt), "yyyy년 MM월 dd일", { locale: ko })}
                  </div>
                  <div className="text-left">
                    <span className="font-medium">담당부서:</span> {previewReport.department}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">담당자:</span> {previewReport.authorName}
                  </div>
                </div>
              </div>

              {/* 보고서 내용 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-1">이번 주 주요 업무</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{previewReport.thisWeekWork || "입력된 내용이 없습니다."}</pre>
                  </div>
                </div>

                {previewReport.achievements && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-1">성과 및 특이사항</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{previewReport.achievements}</pre>
                    </div>
                  </div>
                )}

                {previewReport.issues && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-1">애로사항</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{previewReport.issues}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-1">다음 주 계획</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{previewReport.nextWeekPlan || "입력된 내용이 없습니다."}</pre>
                  </div>
                </div>

                {(previewReport.budgetLabor || previewReport.budgetMaterials || previewReport.budgetOthers) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-1">예산 현황</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">인건비:</span> {previewReport.budgetLabor || "-"}
                        </div>
                        <div>
                          <span className="font-medium">재료비:</span> {previewReport.budgetMaterials || "-"}
                        </div>
                        <div>
                          <span className="font-medium">기타:</span> {previewReport.budgetOthers || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewReport.attachments && Array.isArray(previewReport.attachments) && previewReport.attachments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-1">첨부파일</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {previewReport.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-sm">{attachment.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(previewReport)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            다운로드
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
