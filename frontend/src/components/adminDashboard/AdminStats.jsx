import React from "react";
import { Users, UserCheck, UserX, Flag, MessageSquare } from "lucide-react";

const AdminStats = ({ stats, reports, feedbacks }) => {
  return (
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
  );
};

export default AdminStats;