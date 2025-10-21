import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Activity, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader,
  Flag,
  MessageSquare,
  Eye,
  Trash2,
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
  const [moderationView, setModerationView] = useState('recent');
  const authUser = queryClient.getQueryData(["authUser"]);
  const [reportsView, setReportsView] = useState("recent");
  const [feedbackView, setFeedbackView] = useState("recent");
  const [reportSearch, setReportSearch] = useState("");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("all");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDeleteLogConfirm, setShowDeleteLogConfirm] = useState(false);
  const [deleteTargetLogId, setDeleteTargetLogId] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Check if current user is deactivated on mount and periodically
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        if (!res.data.isActive) {
          queryClient.setQueryData(["authUser"], null);
          toast.error("Your account has been deactivated");
          navigate("/login");
        }
      } catch (error) {
        // If user check fails, they're likely logged out
        console.error("Error checking user status:", error);
      }
    };

    // Check immediately
    checkUserStatus();

    // Check every 5 seconds
    const interval = setInterval(checkUserStatus, 5000);

    return () => clearInterval(interval);
  }, [navigate, queryClient]);

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

  const { data: reports } = useQuery({
    queryKey: ["adminReports"],
    queryFn: async () => {
      const res = await axiosInstance.get("/reports");
      return res.data;
    },
  });

  const { data: feedbacks } = useQuery({
    queryKey: ["adminFeedbacks"],
    queryFn: async () => {
      const res = await axiosInstance.get("/feedbacks");
      return res.data;
    },
  });

  // Moderation logs (admins only)
  const { data: moderationLogs, isLoading: moderationLoading } = useQuery({
    queryKey: ["moderationLogs"],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/moderation-logs')
      return res.data
    },
    enabled: authUser?.role === 'admin'
  })

  const deleteLogMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.delete(`/admin/moderation-logs/${id}`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['moderationLogs'])
      toast.success(data.message || 'Deleted')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  })

  const deleteAllLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.delete(`/admin/moderation-logs`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['moderationLogs'])
      toast.success(data.message || 'All logs deleted')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete all')
    }
  })

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const res = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update role");
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

  const markReportSeenMutation = useMutation({
    mutationFn: async (reportId) => {
      const res = await axiosInstance.put(`/reports/${reportId}/seen`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["adminReports"]),
  });

  const markFeedbackSeenMutation = useMutation({
    mutationFn: async (feedbackId) => {
      const res = await axiosInstance.put(`/feedbacks/${feedbackId}/seen`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["adminFeedbacks"]),
  });

  const markAllReportsSeenMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.put("/reports/mark-all-seen");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminReports"]);
      toast.success("All reports marked as seen");
    },
  });

  const markAllFeedbacksSeenMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.put("/feedbacks/mark-all-seen");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminFeedbacks"]);
      toast.success("All feedbacks marked as seen");
    },
  });

  // prepare sortedUsers: super-admins, admins, then users; each group newest-first
  // Keep original array safe by creating a shallow copy
  const sortedUsers = users
    ? [...users].sort((a, b) => {
        const rank = (u) => (u.isSuperAdmin ? 0 : u.role === "admin" ? 1 : 2);
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
          <button onClick={() => setSearchParams({ tab: 'reports' })} className={`px-4 py-2 rounded ${activeTab === 'reports' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Feedback & Reports</button>
          <button onClick={() => setSearchParams({ tab: 'moderation' })} className={`px-4 py-2 rounded ${activeTab === 'moderation' ? 'bg-primary text-white' : 'bg-gray-100'}`}>Moderation</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="text-blue-500" size={36} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Users</p>
                  <p className="text-2xl font-bold mt-1">{stats?.activeUsers || 0}</p>
                </div>
                <UserCheck className="text-green-500" size={36} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Inactive Users</p>
                  <p className="text-2xl font-bold mt-1">{stats?.inactiveUsers || 0}</p>
                </div>
                <UserX className="text-red-500" size={36} />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">All Users</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Role
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 w-1/4">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full flex-shrink-0"
                            src={user.profilePicture || "/avatar.png"}
                            alt={user.name}
                          />
                          <div className="ml-4 min-w-0 flex-1">
                            <div 
                              className="text-sm font-medium text-gray-900 truncate"
                              title={user.name}
                            >
                              {user.name}
                            </div>
                            <div 
                              className="text-sm text-gray-500 truncate"
                              title={`@${user.username}`}
                            >
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-1/4">
                        <div 
                          className="text-sm text-gray-900 truncate"
                          title={user.email}
                        >
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 w-1/6 text-center">
                        {user._id === authUser._id || (user.isSuperAdmin && !authUser.isSuperAdmin) ? (
                          <span className={`w-20 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                            user.isSuperAdmin 
                              ? 'bg-purple-100 text-purple-800' 
                              : user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isSuperAdmin ? 'Admin+' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: user._id, role: e.target.value })}
                            disabled={updateRoleMutation.isPending}
                            className={`w-20 px-2 py-1 text-xs leading-5 font-semibold rounded-full border text-center ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800 border-purple-300' 
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                            } cursor-pointer hover:opacity-80`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 w-1/6 text-center">
                        <span className={`w-20 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 w-1/12 text-center">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium w-1/12 text-center">
                        {user._id !== authUser._id && !(user.isSuperAdmin && !authUser.isSuperAdmin) && (
                          <button
                            onClick={() => toggleStatusMutation.mutate(user._id)}
                            disabled={toggleStatusMutation.isPending}
                            className={`w-24 px-3 py-1 rounded text-xs ${
                              user.isActive 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } transition-colors disabled:opacity-50`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Reports</p>
                  <p className="text-2xl font-bold mt-1">{reports ? reports.length : 0}</p>
                </div>
                <Flag className="text-red-500" size={36} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Open Reports</p>
                  <p className="text-2xl font-bold mt-1">{reports ? reports.filter(r => r.status === 'open').length : 0}</p>
                </div>
                <Eye className="text-yellow-500" size={36} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Feedback Messages</p>
                  <p className="text-2xl font-bold mt-1">{feedbacks ? feedbacks.length : 0}</p>
                </div>
                <MessageSquare className="text-indigo-500" size={36} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{reportsView === 'recent' ? 'Recent Reports' : 'All Reports'}</h3>
                {reportsView === 'recent' ? (
                  <button className="text-sm text-primary underline" onClick={() => setReportsView('all')}>View All</button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm" onClick={() => markAllReportsSeenMutation.mutate()}>Mark All as Seen</button>
                    <button className="text-sm text-primary underline" onClick={() => setReportsView('recent')}>Back to Recent</button>
                    
                  </div>
                )}
              </div>

              {reportsView === 'recent' ? (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {reports && reports.slice(0, 5).map(r => (
                    <div key={r._id} className={`p-3 border rounded flex items-start justify-between cursor-pointer ${!r.seen ? 'border-red-500' : ''}`} onClick={() => { setSelectedReport(r); setShowReportModal(true); markReportSeenMutation.mutate(r._id); }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{r.type.toUpperCase()}</div>
                        <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                        <div className="text-sm mt-2 truncate">{r.details || <span className="text-gray-400">No details provided</span>}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <a href={r.type === 'post' ? `/post/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` : r.type === 'discussion' ? `/discussion/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` : r.type === 'job' ? `/job/${r.target}` : r.type === 'event' ? `/event/${r.target}` : '#'} className="text-sm text-primary underline" onClick={(e) => e.stopPropagation()}>View {r.type}</a>
                        <button className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded" onClick={(e) => { e.stopPropagation(); markReportSeenMutation.mutate(r._id); }}>Mark Seen</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center gap-4">
                    <input type="search" placeholder="Search reports" value={reportSearch} onChange={e => setReportSearch(e.target.value)} className="border rounded px-3 py-1 flex-1 min-w-0" />
                    <select value={reportFilter} onChange={e => setReportFilter(e.target.value)} className="border rounded px-3 py-1 flex-shrink-0">
                      <option value="all">All</option>
                      <option value="seen">Seen</option>
                      <option value="unseen">Unseen</option>
                    </select>
                    <select value={reportTypeFilter} onChange={e => setReportTypeFilter(e.target.value)} className="border rounded px-3 py-1 flex-shrink-0">
                      <option value="all">All types</option>
                      <option value="post">Posts</option>
                      <option value="discussion">Discussions</option>
                      <option value="job">Jobs</option>
                      <option value="event">Events</option>
                    </select>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-auto">
                    {reports?.filter(r => {
                      if (!reportSearch) return true
                      const s = reportSearch.toLowerCase()
                      return (r.type || '').toLowerCase().includes(s) || (r.details || '').toLowerCase().includes(s) || (r.target || '').toLowerCase().includes(s)
                    }).filter(r => {
                      if (reportFilter === 'all') return true
                      if (reportFilter === 'seen') return r.seen
                      if (reportFilter === 'unseen') return !r.seen
                      return true
                    }).filter(r => {
                      if (reportTypeFilter === 'all') return true
                      return (r.type || '') === reportTypeFilter
                    }).map(r => (
                      <div key={r._1d} className={`p-3 border rounded flex items-start justify-between cursor-pointer ${!r.seen ? 'border-red-500' : ''}`} onClick={() => { setSelectedReport(r); setShowReportModal(true); markReportSeenMutation.mutate(r._id); }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold">{r.type.toUpperCase()}</div>
                          <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                          <div className="text-sm mt-2 truncate">{r.details || <span className="text-gray-400">No details provided</span>}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <a href={r.type === 'post' ? `/post/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` : r.type === 'discussion' ? `/discussion/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` : r.type === 'job' ? `/job/${r.target}` : r.type === 'event' ? `/event/${r.target}` : '#'} className="text-sm text-primary underline" onClick={(e) => e.stopPropagation()}>View {r.type}</a>
                          <button className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded" onClick={(e) => { e.stopPropagation(); markReportSeenMutation.mutate(r._id); }}>Mark Seen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{feedbackView === 'recent' ? 'Recent Feedback' : 'All Feedback'}</h3>
                {feedbackView === 'recent' ? (
                  <button className="text-sm text-primary underline" onClick={() => setFeedbackView('all')}>View All</button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm" onClick={() => markAllFeedbacksSeenMutation.mutate()}>Mark All as Seen</button>
                    <button className="text-sm text-primary underline" onClick={() => setFeedbackView('recent')}>Back to Recent</button>
                  </div>
                )}
              </div>

              {feedbackView === 'recent' ? (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {feedbacks && feedbacks.slice(0, 5).map(f => (
                    <div key={f._id} className={`p-3 border rounded cursor-pointer ${!f.seen ? 'border-red-500' : ''}`} onClick={() => { setSelectedFeedback(f); setShowFeedbackModal(true); markFeedbackSeenMutation.mutate(f._id); }}>
                      <div className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleString()}</div>
                      <div className="mt-2 truncate">{f.message}</div>
                      <div className="mt-2 flex justify-end">
                        <button className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded" onClick={(e) => { e.stopPropagation(); markFeedbackSeenMutation.mutate(f._id); }}>Mark Seen</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center gap-4">
                    <input type="search" placeholder="Search feedback" value={feedbackSearch} onChange={e => setFeedbackSearch(e.target.value)} className="border rounded px-3 py-1 flex-1 min-w-0" />
                    <select value={feedbackFilter} onChange={e => setFeedbackFilter(e.target.value)} className="border rounded px-3 py-1 flex-shrink-0">
                      <option value="all">All</option>
                      <option value="seen">Seen</option>
                      <option value="unseen">Unseen</option>
                    </select>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-auto">
                    {feedbacks?.filter(f => {
                      if (!feedbackSearch) return true
                      const s = feedbackSearch.toLowerCase()
                      return (f.message || '').toLowerCase().includes(s)
                    }).filter(f => {
                      if (feedbackFilter === 'all') return true
                      if (feedbackFilter === 'seen') return f.seen
                      if (feedbackFilter === 'unseen') return !f.seen
                      return true
                    }).map(f => (
                      <div key={f._id} className={`p-3 border rounded cursor-pointer ${!f.seen ? 'border-red-500' : ''}`} onClick={() => { setSelectedFeedback(f); setShowFeedbackModal(true); markFeedbackSeenMutation.mutate(f._id); }}>
                        <div className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</div>
                        <div className="mt-2 truncate">{f.message}</div>
                        <div className="mt-2 flex justify-end">
                          <button className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded" onClick={(e) => { e.stopPropagation(); markFeedbackSeenMutation.mutate(f._id); }}>Mark Seen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div>
          <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Moderation Logs</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => queryClient.invalidateQueries(['moderationLogs'])}>Refresh</button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                  onClick={() => setShowDeleteAllConfirm(true)}
                >
                  Delete All
                </button>
              </div>
            </div>

            {moderationLoading ? (
              <div className="text-center py-6">
                <Loader className="animate-spin mx-auto" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-center w-1/5">Action</th>
                      <th className="px-3 py-2 text-center w-1/5">Target</th>
                      <th className="px-3 py-2 text-center w-1/5">By</th>
                      <th className="px-3 py-2 text-center w-1/5">Date-Time</th>
                      <th className="px-3 py-2 text-center w-1/5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderationLogs?.map((log) => (
                      <tr key={log._id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedLog(log); setShowLogModal(true); }}>
                        <td className="px-3 py-2 text-center">{log.action.toUpperCase()}</td>
                        <td className="px-3 py-2 text-center">{log.targetType}</td>
                        <td className="px-3 py-2 text-center">{log.performedBy?.name || log.performedBy?.username}</td>
                        <td className="px-3 py-2 text-center">{new Date(log.performedAt).toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url =
                                  log.targetType === 'post' ? `/post/${log.targetId}` :
                                  log.targetType === 'comment' ? `/post/${log.parentId}?comment=${log.targetId}` :
                                  log.targetType === 'reply' ? `/post/${log.parentId}?reply=${log.targetId}&comment=${log.parentId}` :
                                  log.targetType === 'job' ? `/job/${log.targetId}` :
                                  log.targetType === 'event' ? `/event/${log.targetId}` :
                                  log.targetType === 'discussion' ? `/discussion/${log.targetId}` : '#';
                                navigate(url);
                              }}
                              className="w-28 px-3 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              View {log.targetType}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetLogId(log._id);
                                setShowDeleteLogConfirm(true);
                              }}
                              title="Delete log"
                              className="p-2 rounded text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Moderation log detail modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Moderation Log</h3>
            <div className="text-sm text-gray-600 mb-2">Action: {selectedLog.action.toUpperCase()}</div>
            <div className="text-sm text-gray-600 mb-2">Target Type: {selectedLog.targetType}</div>
            <div className="text-sm text-gray-600 mb-2">Target ID: {selectedLog.targetId}</div>
            <div className="text-sm text-gray-600 mb-2">Parent ID: {selectedLog.parentId || '-'}</div>
            <div className="text-sm text-gray-600 mb-2">By: {selectedLog.performedBy?.name || selectedLog.performedBy?.username}</div>
            <div className="text-sm text-gray-600 mb-2">At: {new Date(selectedLog.performedAt).toLocaleString()}</div>
            <div className="mt-3 whitespace-pre-wrap">Reason: {selectedLog.reason || 'No reason provided'}</div>
            <div className="mt-4 flex justify-end">
              <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => { setShowLogModal(false); setSelectedLog(null); }}>Close</button>
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

      {/* Delete single moderation log confirm modal */}
      {showDeleteLogConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Moderation Log</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to permanently delete this moderation log? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => { setShowDeleteLogConfirm(false); setDeleteTargetLogId(null); }}>Cancel</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={async () => { await deleteLogMutation.mutateAsync(deleteTargetLogId); setShowDeleteLogConfirm(false); setDeleteTargetLogId(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all moderation logs confirm modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete All Moderation Logs</h3>
            <p className="text-sm text-gray-600 mb-4">This will permanently delete all moderation logs. Are you sure you want to proceed?</p>
            <div className="flex justify-end gap-3">
              <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setShowDeleteAllConfirm(false)}>Cancel</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={async () => { await deleteAllLogsMutation.mutateAsync(); setShowDeleteAllConfirm(false); }}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
