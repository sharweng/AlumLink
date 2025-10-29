import BanUnbanButton from "../components/common/BanUnbanButton";
import AdminStats from "../components/adminDashboard/AdminStats";
import AdminDetails from "../components/adminDashboard/AdminDetails";
import AdminUsers from "../components/adminDashboard/AdminUsers";
import AdminFeedbackReports from "../components/adminDashboard/AdminFeedbackReports";
import AdminModeration from "../components/adminDashboard/AdminModeration";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { 
  Shield, 
  Activity, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";
  const authUser = queryClient.getQueryData(["authUser"]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [selectedModeration, setSelectedModeration] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  

  useEffect(() => {
    // basic auth check (non-blocking)
    const check = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (!res.data) navigate("/login");
      } catch (e) {
        console.warn("auth check failed", e);
      }
    };
    check();
  }, [navigate]);

  // Get dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/stats");
      return res.data;
    },
  });

  // Get all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/users");
      return res.data;
    },
  });

  // Update user permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, permission }) => {
      const res = await axiosInstance.put(`/admin/users/${userId}/permission`, { permission });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update permission");
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await axiosInstance.put(`/admin/users/${userId}/toggle-status`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  // prepare sortedUsers: super-admins, admins, then users; each group newest-first
  // Keep original array safe by creating a shallow copy
  // Sort by permission: superAdmin, admin, then regular; each group newest-first
  const sortedUsers = users
    ? [...users].sort((a, b) => {
        const rank = (u) =>
          u.permission === "superAdmin"
            ? 0
            : u.permission === "admin"
            ? 1
            : 2;
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
    : [];

  if (statsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={() => setSearchParams({ tab: 'users' })} className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Users</button>
          <button onClick={() => setSearchParams({ tab: 'stats' })} className={`px-4 py-2 rounded ${activeTab === 'stats' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Stats</button>
          <button onClick={() => setSearchParams({ tab: 'details' })} className={`px-4 py-2 rounded ${activeTab === 'details' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Details</button>
          <button onClick={() => setSearchParams({ tab: 'reports' })} className={`px-4 py-2 rounded ${activeTab === 'reports' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Feedback & Reports</button>
          <button onClick={() => setSearchParams({ tab: 'moderation' })} className={`px-4 py-2 rounded ${activeTab === 'moderation' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Moderation</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          <AdminStats stats={stats} />
          <AdminUsers 
            users={sortedUsers} 
            authUser={authUser} 
            updatePermissionMutation={updatePermissionMutation} 
            toggleStatusMutation={toggleStatusMutation} 
          />
        </>
      )}

      {activeTab === 'stats' && (
        <AdminStats stats={stats} />
      )}

      {activeTab === 'details' && (
        <AdminDetails stats={stats} />
      )}

      {activeTab === 'reports' && (
        <AdminFeedbackReports 
          setShowFeedbackModal={setShowFeedbackModal}
          setSelectedFeedback={setSelectedFeedback}
          setShowReportModal={setShowReportModal}
          setSelectedReport={setSelectedReport}
        />
      )}

      {activeTab === 'moderation' && (
        <AdminModeration 
          setShowModerationModal={setShowModerationModal}
          setSelectedModeration={setSelectedModeration}
        />
      )}

      {/* Moderation log detail modal */}
      {showModerationModal && selectedModeration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Moderation Log</h3>
            <div className="text-sm text-gray-600 mb-2">Action: {selectedModeration.action.toUpperCase()}</div>
            <div className="text-sm text-gray-600 mb-2">Target Type: {selectedModeration.targetType}</div>
            <div className="text-sm text-gray-600 mb-2">Target ID: {selectedModeration.targetId}</div>
            <div className="text-sm text-gray-600 mb-2">Parent ID: {selectedModeration.parentId || '-'}</div>
            <div className="text-sm text-gray-600 mb-2">By: {selectedModeration.performedBy?.name || selectedModeration.performedBy?.username}</div>
            <div className="text-sm text-gray-600 mb-2">At: {new Date(selectedModeration.performedAt).toLocaleString()}</div>
            <div className="mt-3 whitespace-pre-wrap">Reason: {selectedModeration.reason || 'No reason provided'}</div>
            <div className="mt-4 flex justify-end">
              <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => { setShowModerationModal(false); setSelectedModeration(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Feedback</h3>
            <p className="text-sm text-gray-600 mb-2">{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
            <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={() => setShowFeedbackModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Report Details</h3>
            <p className="text-sm text-gray-600 mb-2">Type: {selectedReport.type.toUpperCase()}</p>
            <p className="text-sm text-gray-600 mb-2">Target: {selectedReport.target || 'N/A'}</p>
            <p className="text-sm text-gray-600 mb-4">{new Date(selectedReport.createdAt).toLocaleString()}</p>
            <p className="whitespace-pre-wrap">{selectedReport.details || 'No details provided'}</p>
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={() => setShowReportModal(false)}>Close</button>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminDashboard;
