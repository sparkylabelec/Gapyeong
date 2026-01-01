import { FileText, Calendar, Clock, AlertTriangle, Plus, FolderOpen, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface DashboardProps {
  onSectionChange: (section: string) => void;
}

export default function Dashboard({ onSectionChange }: DashboardProps) {
  const { reports, currentWeekReport } = useReports();

  const thisWeekReports = reports.filter((report: any) => {
    const reportDate = new Date(report.createdAt);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return reportDate >= weekStart;
  });

  const thisMonthReports = reports.filter((report: any) => {
    const reportDate = new Date(report.createdAt);
    const now = new Date();
    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
  });

  const pendingReports = reports.filter((report: any) => report.status === "pending");
  const overdueReports = reports.filter((report: any) => {
    // Reports not submitted by Sunday night are overdue
    const reportDate = new Date(report.createdAt);
    const now = new Date();
    const daysSinceWeekStart = now.getDay();
    return daysSinceWeekStart > 0 && !thisWeekReports.length;
  });

  const recentReports = reports.slice(0, 3);

  const stats = [
    {
      title: "이번 주 보고서",
      value: thisWeekReports.length,
      icon: FileText,
      color: "blue",
      status: thisWeekReports.length > 0 ? "완료" : "미완료",
      statusColor: thisWeekReports.length > 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "이번 달 보고서",
      value: thisMonthReports.length,
      icon: Calendar,
      color: "green",
      status: `총 ${thisMonthReports.length}건`,
      statusColor: "text-green-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">승인완료</span>;
      case "pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">검토중</span>;
      case "rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">반려</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">임시저장</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{stat.title}</p>
                    <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm font-semibold ${stat.statusColor} flex items-center`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${stat.statusColor === 'text-green-600' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {stat.status}
                    </p>
                  </div>
                  <div className={`p-4 rounded-full bg-${stat.color}-100 flex-shrink-0 ml-4`}>
                    <Icon className={`w-8 h-8 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => onSectionChange("reports")}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 보고서 작성
              </Button>
              <Button 
                onClick={() => onSectionChange("history")}
                variant="outline"
                className="w-full justify-start"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                보고서 목록
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div className="lg:col-span-2 lg:order-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>최근 보고서</CardTitle>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => onSectionChange("history")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  전체 보기 →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <div className="space-y-3">
                  {recentReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{report.title}</h4>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {format(new Date(report.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })} 제출
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>작성된 보고서가 없습니다.</p>
                  <Button 
                    onClick={() => onSectionChange("reports")}
                    className="mt-3"
                    size="sm"
                  >
                    첫 보고서 작성하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}