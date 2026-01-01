import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/components/auth/LoginPage";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Dashboard from "@/components/dashboard/Dashboard";
import ReportForm from "@/components/reports/ReportForm";
import ReportHistory from "@/components/reports/ReportHistory";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const titleMap = {
    dashboard: "대시보드",
    reports: "보고서 작성",
    history: "작성 이력",
    management: "관리자 메뉴",
  };

  const subtitleMap = {
    dashboard: getCurrentWeekString(),
    reports: getCurrentWeekString(),
    history: undefined,
    management: undefined,
  };

  function getCurrentWeekString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const weekOfMonth = Math.ceil(now.getDate() / 7);
    return `${year}년 ${month}월 ${weekOfMonth}주차`;
  }

  const renderContent = () => {
    switch (currentSection) {
      case "dashboard":
        return <Dashboard onSectionChange={setCurrentSection} />;
      case "reports":
        return <ReportForm onBack={() => setCurrentSection("dashboard")} />;
      case "history":
        return <ReportHistory />;
      case "management":
        return userProfile?.role === "admin" ? <AdminDashboard /> : <Dashboard onSectionChange={setCurrentSection} />;
      default:
        return <Dashboard onSectionChange={setCurrentSection} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 lg:ml-0">
        <TopBar
          title={titleMap[currentSection as keyof typeof titleMap]}
          subtitle={subtitleMap[currentSection as keyof typeof subtitleMap]}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {renderContent()}
      </main>
    </div>
  );
}
