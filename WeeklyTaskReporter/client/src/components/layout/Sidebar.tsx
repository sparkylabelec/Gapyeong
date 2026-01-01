import { Building, BarChart3, FileText, History, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  const { userProfile, signOut } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "대시보드", icon: BarChart3 },
    { id: "reports", label: "보고서 작성", icon: FileText },
    { id: "history", label: "작성 이력", icon: History },
  ];

  if (userProfile?.role === "admin") {
    menuItems.push({ id: "management", label: "관리자 메뉴", icon: Settings });
  }

  const handleNavigation = (section: string) => {
    onSectionChange(section);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-white shadow-lg fixed h-screen z-30 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">가평시설관리공단</h1>
              <p className="text-xs text-gray-500">업무보고 시스템</p>
            </div>
          </div>
        </div>

        <nav className="p-4 pb-32">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-left",
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/assets/주간업무추진계획보고_양식.docx';
                  link.download = '주간업무추진계획보고_양식.docx';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-left text-gray-600 hover:bg-gray-100"
              >
                <Download className="w-5 h-5" />
                <span>양식 다운로드</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-4 left-0 right-0 p-4 border-t border-gray-200 mt-8">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userProfile?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile?.name || "사용자"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userProfile?.department || "부서 미지정"}
              </p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>
    </>
  );
}