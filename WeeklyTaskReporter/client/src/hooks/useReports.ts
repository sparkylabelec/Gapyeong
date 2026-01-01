import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertReport, Report } from "@shared/schema";

export function useReports() {
  const queryClient = useQueryClient();

  // Get user's reports
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ["/api/reports"],
  });

  // Get current week report
  const { data: currentWeekReport } = useQuery({
    queryKey: ["/api/reports/current"],
  });

  // Create/update report
  const createReportMutation = useMutation({
    mutationFn: async (report: InsertReport) => {
      const response = await apiRequest("POST", "/api/reports", report);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, ...report }: Partial<Report> & { id: number }) => {
      const response = await apiRequest("PUT", `/api/reports/${id}`, report);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
  });

  // Delete report
  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting report with ID:", id);
      const response = await apiRequest("DELETE", `/api/reports/${id}`);
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data, id) => {
      console.log("Delete successful for ID:", id);
      // 캐시에서 해당 항목을 즉시 제거
      queryClient.setQueryData(["/api/reports"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((report: any) => report.id !== id);
      });
      
      // 모든 관련 쿼리 무효화 및 리패치
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.refetchQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error, id) => {
      console.error("Delete report error for ID:", id, error);
    },
  });

  return {
    reports,
    currentWeekReport,
    isLoading,
    error,
    createReport: createReportMutation.mutate,
    updateReport: updateReportMutation.mutate,
    deleteReport: deleteReportMutation.mutate,
    isCreating: createReportMutation.isPending,
    isUpdating: updateReportMutation.isPending,
    isDeleting: deleteReportMutation.isPending,
  };
}

export function useAdminReports() {
  const queryClient = useQueryClient();

  // Get all reports for admin
  const { data: allReports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
  });

  // Get department stats
  const { data: departmentStats = [] } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Approve report
  const approveReportMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/reports/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
  });

  // Reject report
  const rejectReportMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/reports/${id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
  });

  return {
    allReports,
    departmentStats,
    approveReport: approveReportMutation.mutate,
    rejectReport: rejectReportMutation.mutate,
    isApproving: approveReportMutation.isPending,
    isRejecting: rejectReportMutation.isPending,
  };
}
