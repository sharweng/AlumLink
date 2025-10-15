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
  Loader
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedUserId, setExpandedUserId] = useState(null);
  const authUser = queryClient.getQueryData(["authUser"]);

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

  if (statsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <Users className="text-blue-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Users</p>
              <p className="text-3xl font-bold mt-1">{stats?.activeUsers || 0}</p>
            </div>
            <UserCheck className="text-green-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Inactive Users</p>
              <p className="text-3xl font-bold mt-1">{stats?.inactiveUsers || 0}</p>
            </div>
            <UserX className="text-red-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Admins</p>
              <p className="text-3xl font-bold mt-1">{stats?.adminUsers || 0}</p>
            </div>
            <Shield className="text-purple-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Regular Users</p>
              <p className="text-3xl font-bold mt-1">{stats?.regularUsers || 0}</p>
            </div>
            <Activity className="text-orange-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">New (7 days)</p>
              <p className="text-3xl font-bold mt-1">{stats?.recentUsers || 0}</p>
            </div>
            <TrendingUp className="text-teal-500" size={40} />
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
              {users?.map((user) => (
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
    </div>
  );
};

export default AdminDashboard;
