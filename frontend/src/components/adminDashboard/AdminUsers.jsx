import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import BanUnbanButton from "../common/BanUnbanButton";

const AdminUsers = ({ users, authUser, updatePermissionMutation, toggleStatusMutation }) => {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");



  // prepare sortedUsers: super-admins, admins, then users; each group newest-first
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

  return (
    <>
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Users</h2>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search users"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="border rounded px-3 py-1 min-w-0 w-48"
            />
            <button
              type="button"
              className="ml-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-gray-700 flex items-center"
              onClick={() => queryClient.invalidateQueries(["adminUsers"])}
              title="Refresh users"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  User
                </th>
                <th className="px-8 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  TUPT-ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Permission
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.filter(user => {
                const q = userSearch?.toLowerCase() || "";
                return (
                  user.name.toLowerCase().includes(q) ||
                  user.username.toLowerCase().includes(q) ||
                  user.email.toLowerCase().includes(q) ||
                  user.tuptId?.toLowerCase().includes(q)
                );
              }).map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 w-1/4">
                    <div className="flex items-center group" title={`${user.name} — ${user.email}`}>
                      <a href={`/profile/${user.username}`} className="block">
                        <img
                          className="h-8 w-8 rounded-full flex-shrink-0 hover:ring-2 hover:ring-primary transition"
                          src={user.profilePicture || "/avatar.png"}
                          alt={user.name}
                        />
                      </a>
                      <div className="ml-3 min-w-0 flex-1 relative">
                        <a href={`/profile/${user.username}`} className="text-sm font-medium text-gray-900 truncate hover:underline">
                          {user.name}
                        </a>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={`@${user.username}`}
                        >
                          @{user.username}
                        </div>
                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-normal" title={`${user.name} — ${user.email}`}>
                            <div className="font-semibold text-sm">{user.name}</div>
                            <div className="text-[11px] opacity-90">{user.email}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 w-1/4 text-center">
                    {authUser?.permission === 'superAdmin' ? (
                      <input
                        type="text"
                        className="px-2 py-1 w-full text-center bg-transparent outline-none"
                        style={{ minWidth: '160px' }}
                        defaultValue={user.tuptId}
                        onBlur={e => {
                          if (e.target.value !== user.tuptId) {
                            axiosInstance.put(`/users/${user._id}`, { tuptId: e.target.value })
                              .then(() => { toast.success('TUPT-ID updated'); queryClient.invalidateQueries(["adminUsers"]); })
                              .catch(() => toast.error('Failed to update TUPT-ID'));
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                        }}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 truncate" style={{ minWidth: '160px', display: 'inline-block' }} title={user.tuptId}>{user.tuptId}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/6 text-center">
                    <span className={`w-20 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 w-1/6 text-center">
                    {(authUser?.permission === 'admin' || authUser?.permission === 'superAdmin') && user._id !== authUser?._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') ? (
                      <select
                        value={user.permission}
                        onChange={(e) => updatePermissionMutation.mutate({ userId: user._id, permission: e.target.value })}
                        disabled={updatePermissionMutation.isPending}
                        className={`w-24 px-2 py-1 text-xs leading-5 font-semibold rounded-full border text-center ${
                          user.permission === 'superAdmin' ? 'bg-purple-100 text-purple-800 border-purple-300' : user.permission === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                        } cursor-pointer hover:opacity-80`}
                      >
                        <option value="regular">Regular</option>
                        <option value="admin">Admin</option>
                        {authUser?.permission === 'superAdmin' && <option value="superAdmin">Admin+</option>}
                      </select>
                    ) : (
                      <span className={`w-24 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                        user.permission === 'superAdmin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.permission === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.permission === 'superAdmin' ? 'Admin+' : user.permission === 'admin' ? 'Admin' : 'Regular'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/6 text-center">
                    <span className={`w-24 px-2 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full ${
                      !user.isActive
                        ? 'bg-red-100 text-red-800'
                        : user.banned
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {!user.isActive
                        ? 'Inactive'
                        : user.banned
                          ? 'Banned'
                          : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium w-1/12 text-center">
                    {user._id !== authUser._id && !(user.permission === 'superAdmin' && authUser?.permission !== 'superAdmin') && (
                      <div className="flex flex-col gap-1 items-center">
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
                        <BanUnbanButton user={user} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminUsers;