import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, FileText, Calendar, Users, Building2, Download, FileArchive } from "lucide-react";
import { useAdminReports } from "@/hooks/useReports";
import { format, getWeek, getYear } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

export default function AdminDashboard() {
  const { allReports } = useAdminReports();
  const [selectedWeek, setSelectedWeek] = useState("thisWeek");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const { toast } = useToast();

  const currentDate = new Date();
  const currentWeek = getWeek(currentDate, { weekStartsOn: 1 });
  const currentYear = getYear(currentDate);

  // 주차별 필터링
  const getFilteredReports = () => {
    let filtered = Array.isArray(allReports) ? allReports : [];

    if (selectedWeek === "thisWeek") {
      filtered = filtered.filter((report: any) => 
        report.weekNumber === currentWeek && report.weekYear === currentYear
      );
    } else if (selectedWeek === "lastWeek") {
      filtered = filtered.filter((report: any) => 
        report.weekNumber === currentWeek - 1 && report.weekYear === currentYear
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter((report: any) => report.department === selectedDepartment);
    }

    return filtered;
  };

  const filteredReports = getFilteredReports();

  // 체크박스 관련 함수들
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(filteredReports.map((report: any) => report.id));
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

  // 선택된 보고서들 다운로드
  const handleDownloadSelected = async () => {
    if (selectedReports.length === 0) {
      toast({
        title: "선택된 보고서가 없습니다",
        description: "다운로드할 보고서를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const selectedReportData = filteredReports.filter((report: any) => 
      selectedReports.includes(report.id)
    );

    if (selectedReportData.length === 1) {
      // 단일 파일 다운로드 - 원본 첨부파일이 있으면 다운로드, 없으면 텍스트 파일
      const report = selectedReportData[0];
      
      if (report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0) {
        try {
          const attachment = report.attachments[0];
          let base64Data;
          
          if (attachment.data.includes(',')) {
            base64Data = attachment.data.split(',')[1];
          } else {
            base64Data = attachment.data;
          }
          
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: attachment.type });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.name;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);

          toast({
            title: "다운로드 완료",
            description: `${attachment.name} 파일이 다운로드되었습니다.`,
          });
        } catch (error) {
          console.error("파일 다운로드 오류:", error);
          downloadAsTextFile(selectedReportData);
        }
      } else {
        // 첨부파일이 없으면 텍스트 파일로 다운로드
        downloadAsTextFile(selectedReportData);
      }
    } else {
      // 다중 파일 다운로드 - ZIP 파일로 압축
      await downloadAsZip(selectedReportData);
    }

    setSelectedReports([]);
  };

  // 텍스트 파일로 다운로드
  const downloadAsTextFile = (reportData: any[]) => {
    let content = `가평시설관리공단 주간업무보고서 모음\n\n`;
    content += `생성일: ${format(new Date(), "yyyy년 MM월 dd일 HH시 mm분", { locale: ko })}\n`;
    content += `총 ${reportData.length}개 보고서\n\n`;
    content += "=".repeat(80) + "\n\n";

    reportData.forEach((report: any, index: number) => {
      content += `${index + 1}. ${report.title}\n`;
      content += `담당자: ${report.authorName} | 부서: ${report.department}\n`;
      content += `보고기간: ${report.weekPeriod}\n`;
      content += `작성일: ${format(new Date(report.createdAt), "yyyy.MM.dd", { locale: ko })}\n`;
      content += `상태: ${getStatusText(report.status)}\n\n`;
      
      content += `이번 주 업무:\n${report.thisWeekWork || "내용 없음"}\n\n`;
      
      if (report.achievements) {
        content += `성과 및 특이사항:\n${report.achievements}\n\n`;
      }
      
      if (report.issues) {
        content += `애로사항:\n${report.issues}\n\n`;
      }
      
      content += `다음 주 계획:\n${report.nextWeekPlan || "내용 없음"}\n\n`;
      
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
    
    if (reportData.length === 1) {
      link.download = `${reportData[0].title}_${format(new Date(), "yyyyMMdd", { locale: ko })}.txt`;
    } else {
      link.download = `주간업무보고서_모음_${format(new Date(), "yyyyMMdd", { locale: ko })}.txt`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "다운로드 완료",
      description: `${reportData.length}개 보고서가 텍스트 파일로 다운로드되었습니다.`,
    });
  };

  // ZIP 파일로 다운로드
  const downloadAsZip = async (reportData: any[]) => {
    try {
      const zip = new JSZip();
      let hasFiles = false;

      for (const [index, report] of reportData.entries()) {
        // 텍스트 요약 파일 추가
        const textContent = `${report.title}\n`;
        const textContent2 = `담당자: ${report.authorName} | 부서: ${report.department}\n`;
        const textContent3 = `보고기간: ${report.weekPeriod}\n`;
        const textContent4 = `작성일: ${format(new Date(report.createdAt), "yyyy.MM.dd", { locale: ko })}\n\n`;
        const textContent5 = `이번 주 업무:\n${report.thisWeekWork || "내용 없음"}\n\n`;
        const textContent6 = report.achievements ? `성과 및 특이사항:\n${report.achievements}\n\n` : "";
        const textContent7 = report.issues ? `애로사항:\n${report.issues}\n\n` : "";
        const textContent8 = `다음 주 계획:\n${report.nextWeekPlan || "내용 없음"}\n\n`;
        
        const fullTextContent = textContent + textContent2 + textContent3 + textContent4 + 
                              textContent5 + textContent6 + textContent7 + textContent8;
        
        const safeFileName = report.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        zip.file(`${index + 1}_${safeFileName}_요약.txt`, fullTextContent);

        // 첨부파일이 있으면 추가
        if (report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0) {
          for (const attachment of report.attachments) {
            try {
              let base64Data;
              if (attachment.data.includes(',')) {
                base64Data = attachment.data.split(',')[1];
              } else {
                base64Data = attachment.data;
              }
              
              zip.file(`${index + 1}_${safeFileName}_${attachment.name}`, base64Data, { base64: true });
              hasFiles = true;
            } catch (error) {
              console.error("첨부파일 처리 오류:", error);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `주간업무보고서_모음_${format(new Date(), "yyyyMMdd", { locale: ko })}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "ZIP 다운로드 완료",
        description: `${reportData.length}개 보고서가 ZIP 파일로 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error("ZIP 생성 오류:", error);
      toast({
        title: "ZIP 생성 실패",
        description: "ZIP 파일 생성 중 오류가 발생했습니다. 텍스트 파일로 다운로드합니다.",
        variant: "destructive",
      });
      downloadAsTextFile(reportData);
    }
  };

  // 보고서 상세 보기
  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "승인완료";
      case "pending": return "검토중";
      case "rejected": return "반려";
      case "draft": return "임시저장";
      default: return "알 수 없음";
    }
  };

  // 부서별 제출 현황
  const getDepartmentSubmissionStats = () => {
    const departments = ["안전감사실", "혁신기획팀", "경영지원팀", "산장관광지", "칼봉산자연휴양림", 
      "연인산다목적캠핑장", "자라섬캠핑장", "교통약자이동지원센터", "문화예술회관", "여성비전센터", 
      "종량제봉투판매", "잣고을전통시장 창업경제타운", "한석봉체육관", "생활체육파트", 
      "조종국민체육센터", "청평호반문화체육센터", "가평파크골프장"];

    return departments.map(dept => {
      const deptReports = filteredReports.filter((report: any) => report.department === dept);
      return {
        department: dept,
        submitted: deptReports.length,
        submissionRate: deptReports.length > 0 ? 100 : 0
      };
    });
  };

  // Excel 내보내기 함수
  const handleExportExcel = () => {
    const csvContent = [
      ["부서", "작성자", "제목", "제출일"].join(","),
      ...filteredReports.map((report: any) => [
        report.department,
        report.authorName,
        report.title,
        format(new Date(report.createdAt), "yyyy-MM-dd")
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `주간보고서_${selectedWeek}_${format(currentDate, "yyyyMMdd")}.csv`;
    link.click();
  };

  const submissionStats = getDepartmentSubmissionStats();

  return (
    <div className="p-6 space-y-6">
      {/* 관리자 대시보드 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Building2 className="w-6 h-6 mr-2" />
              주간 업무보고 관리
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisWeek">이번 주</SelectItem>
                  <SelectItem value="lastWeek">지난 주</SelectItem>
                  <SelectItem value="all">전체</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 부서</SelectItem>
                  <SelectItem value="안전감사실">안전감사실</SelectItem>
                  <SelectItem value="혁신기획팀">혁신기획팀</SelectItem>
                  <SelectItem value="경영지원팀">경영지원팀</SelectItem>
                  <SelectItem value="산장관광지">산장관광지</SelectItem>
                  <SelectItem value="칼봉산자연휴양림">칼봉산자연휴양림</SelectItem>
                  <SelectItem value="연인산다목적캠핑장">연인산다목적캠핑장</SelectItem>
                  <SelectItem value="자라섬캠핑장">자라섬캠핑장</SelectItem>
                  <SelectItem value="교통약자이동지원센터">교통약자이동지원센터</SelectItem>
                  <SelectItem value="문화예술회관">문화예술회관</SelectItem>
                  <SelectItem value="여성비전센터">여성비전센터</SelectItem>
                  <SelectItem value="종량제봉투판매">종량제봉투판매</SelectItem>
                  <SelectItem value="잣고을전통시장 창업경제타운">잣고을전통시장 창업경제타운</SelectItem>
                  <SelectItem value="한석봉체육관">한석봉체육관</SelectItem>
                  <SelectItem value="생활체육파트">생활체육파트</SelectItem>
                  <SelectItem value="조종국민체육센터">조종국민체육센터</SelectItem>
                  <SelectItem value="청평호반문화체육센터">청평호반문화체육센터</SelectItem>
                  <SelectItem value="가평파크골프장">가평파크골프장</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel 내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 제출 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 제출</p>
                <p className="text-2xl font-bold">{filteredReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">제출 부서</p>
                <p className="text-2xl font-bold">{submissionStats.filter(s => s.submitted > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 부서</p>
                <p className="text-2xl font-bold">17</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">제출률</p>
                <p className="text-2xl font-bold">{Math.round((submissionStats.filter(s => s.submitted > 0).length / 17) * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 부서별 제출 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>부서별 제출 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>부서명</TableHead>
                <TableHead>제출 건수</TableHead>
                <TableHead>제출 상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionStats.map((stat) => (
                <TableRow key={stat.department}>
                  <TableCell className="font-medium">{stat.department}</TableCell>
                  <TableCell>{stat.submitted}건</TableCell>
                  <TableCell>
                    <Badge 
                      variant={stat.submitted > 0 ? "default" : "secondary"}
                      className={stat.submitted > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      {stat.submitted > 0 ? "제출완료" : "미제출"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 보고서 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>제출된 보고서 목록</CardTitle>
            <Button 
              onClick={handleDownloadSelected} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={selectedReports.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              선택 다운로드 {selectedReports.length > 0 && `(${selectedReports.length})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>부서</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>제출일</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={(checked) => handleSelectReport(report.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{report.department}</TableCell>
                  <TableCell>{report.authorName}</TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{format(new Date(report.createdAt), "yyyy-MM-dd HH:mm", { locale: ko })}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                      <FileText className="w-4 h-4 mr-1" />
                      보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    선택한 조건에 해당하는 보고서가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 보고서 상세 보기 모달 */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>보고서 상세 보기</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedReport && (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">제목</label>
                    <p className="mt-1 text-sm">{selectedReport.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">작성자</label>
                    <p className="mt-1 text-sm">{selectedReport.authorName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">부서</label>
                    <p className="mt-1 text-sm">{selectedReport.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">보고 기간</label>
                    <p className="mt-1 text-sm">{selectedReport.weekPeriod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">작성일</label>
                    <p className="mt-1 text-sm">{format(new Date(selectedReport.createdAt), "yyyy년 MM월 dd일 HH:mm", { locale: ko })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">상태</label>
                    <Badge className={selectedReport.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {getStatusText(selectedReport.status)}
                    </Badge>
                  </div>
                </div>

                {/* 업무 내용 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">이번 주 주요 업무</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.thisWeekWork || "내용 없음"}</p>
                    </div>
                  </div>

                  {selectedReport.achievements && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">성과 및 특이사항</label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedReport.achievements}</p>
                      </div>
                    </div>
                  )}

                  {selectedReport.issues && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">애로사항</label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedReport.issues}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">다음 주 계획</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.nextWeekPlan || "내용 없음"}</p>
                    </div>
                  </div>
                </div>

                {/* 예산 현황 */}
                {(selectedReport.budgetLabor || selectedReport.budgetMaterials || selectedReport.budgetOthers) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">예산 현황</label>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      {selectedReport.budgetLabor && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">인건비</p>
                          <p className="text-sm mt-1">{selectedReport.budgetLabor}</p>
                        </div>
                      )}
                      {selectedReport.budgetMaterials && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">재료비</p>
                          <p className="text-sm mt-1">{selectedReport.budgetMaterials}</p>
                        </div>
                      )}
                      {selectedReport.budgetOthers && (
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="text-xs text-orange-600 font-medium">기타</p>
                          <p className="text-sm mt-1">{selectedReport.budgetOthers}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 첨부파일 */}
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">첨부파일</label>
                    <div className="mt-2 space-y-2">
                      {selectedReport.attachments.map((file: any, index: number) => (
                        <div key={index} className="flex items-center p-2 border rounded-lg">
                          <FileText className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}