import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Trash2, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminModeration = ({ setShowModerationModal, setSelectedModeration }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [moderationSearch, setModerationSearch] = useState("");
  const [moderationFilter, setModerationFilter] = useState("all");

  const { data: moderationLogs, isLoading: moderationLoading } = useQuery({
    queryKey: ["adminModerationLogs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/moderation-logs");
      return res.data;
    },
  });

  const deleteModerationLogMutation = useMutation({
    mutationFn: async (logId) => {
      const res = await axiosInstance.delete(`/admin/moderation-logs/${logId}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["adminModerationLogs"]),
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Moderation Logs</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => queryClient.invalidateQueries(["adminModerationLogs"])}>Refresh</button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4">
        <input type="search" placeholder="Search moderation logs" value={moderationSearch} onChange={e => setModerationSearch(e.target.value)} className="border rounded px-3 py-1 flex-1 min-w-0" />
        <select value={moderationFilter} onChange={e => setModerationFilter(e.target.value)} className="border rounded px-3 py-1 flex-shrink-0">
          <option value="all">All Actions</option>
          <option value="ban">Bans</option>
          <option value="unban">Unbans</option>
        </select>
      </div>

      {moderationLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader className="animate-spin text-primary" size={32} />
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
              {(!moderationLogs || moderationLogs.length === 0) ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 pt-4">No moderation logs</td>
                </tr>
              ) : (
                moderationLogs?.filter(log => {
                  if (!moderationSearch) return true
                  const s = moderationSearch.toLowerCase()
                  return (log.action || '').toLowerCase().includes(s) || (log.reason || '').toLowerCase().includes(s) || (log.performedBy?.name || '').toLowerCase().includes(s) || (log.performedBy?.username || '').toLowerCase().includes(s)
                }).filter(log => {
                  if (moderationFilter === 'all') return true
                  return (log.action || '') === moderationFilter
                }).map((log) => (
                  <tr key={log._id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedModeration(log); setShowModerationModal(true); }}>
                    <td className="px-3 py-2 text-center">{log.action.toUpperCase()}</td>
                    <td className="px-3 py-2 text-center">{log.targetType}</td>
                    <td className="px-3 py-2 text-center">{log.performedBy?.name || log.performedBy?.username}</td>
                    <td className="px-3 py-2 text-center">{new Date(log.performedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Allow admin to navigate to user profile if the moderation log targets a user
                            if (log.targetType === 'user') {
                              navigate(`/profile/${log.targetId}`);
                            } else {
                              const url =
                                log.targetType === 'post' ? `/post/${log.targetId}` :
                                log.targetType === 'comment' ? `/post/${log.parentId}?comment=${log.targetId}` :
                                log.targetType === 'reply' ? `/post/${log.parentId}?comment=${log.commentId}&reply=${log.targetId}` :
                                log.targetType === 'job' ? `/job/${log.targetId}` :
                                log.targetType === 'event' ? `/event/${log.targetId}` :
                                log.targetType === 'discussion' ? `/discussion/${log.targetId}` :
                                log.targetType === 'discussionComment' ? `/discussion/${log.parentId}?comment=${log.targetId}` :
                                log.targetType === 'discussionReply' ? `/discussion/${log.parentId}?comment=${log.commentId}&reply=${log.targetId}` : '#';
                              navigate(url);
                            }
                          }}
                          className="w-28 px-3 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          View
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModerationLogMutation.mutate(log._id);
                          }}
                          title="Delete log"
                          className="p-2 rounded text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;