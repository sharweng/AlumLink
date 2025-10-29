import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Flag, MessageSquare, Eye } from "lucide-react";

const AdminFeedbackReports = ({
  setShowFeedbackModal,
  setSelectedFeedback,
  setShowReportModal,
  setSelectedReport
}) => {
  const queryClient = useQueryClient();
  const [reportsView, setReportsView] = useState("recent");
  const [feedbackView, setFeedbackView] = useState("recent");
  const [reportSearch, setReportSearch] = useState("");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("all");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [feedbackFilter, setFeedbackFilter] = useState("all");

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
      // toast.success("All reports marked as seen");
    },
  });

  const markAllFeedbacksSeenMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.put("/feedbacks/mark-all-seen");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminFeedbacks"]);
      // toast.success("All feedbacks marked as seen");
    },
  });

  return (
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
            <div className="flex items-center gap-2">
              {reportsView === 'recent' ? (
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => queryClient.invalidateQueries(["adminReports"])}>Refresh</button>
                  <button className="text-sm text-primary underline" onClick={() => setReportsView('all')}>View All</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm" onClick={() => markAllReportsSeenMutation.mutate()}>Mark All as Seen</button>
                  <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => queryClient.invalidateQueries(["adminReports"])}>Refresh</button>
                  <button className="text-sm text-primary underline" onClick={() => setReportsView('recent')}>Back to Recent</button>
                </div>
              )}
            </div>
          </div>

          {(!reports || reports.length === 0) ? (
            <div className="text-center text-gray-400">No reports</div>
          ) : (reportsView === 'recent' ? (
            <div className="space-y-2 max-h-72 overflow-auto">
              {reports && reports.slice(0, 5).map(r => (
                <div key={r._id} className={`p-3 border rounded flex items-start justify-between cursor-pointer ${!r.seen ? 'border-red-500' : ''}`} onClick={() => { setSelectedReport(r); setShowReportModal(true); markReportSeenMutation.mutate(r._id); }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{r.type.toUpperCase()}</div>
                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                    <div className="text-sm mt-2 truncate">{r.details || <span className="text-gray-400">No details provided</span>}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <a
                      href={
                        r.type === 'post' ? `/post/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` :
                        r.type === 'discussion' ? `/discussion/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` :
                        r.type === 'job' ? `/job/${r.target}` :
                        r.type === 'event' ? `/event/${r.target}` :
                        (r.type === 'other' && r.target) ? `/profile/${r.target}` : '#'
                      }
                      className="text-sm text-primary underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View {r.type === 'other' && r.target ? 'User' : r.type}
                    </a>
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
                  <div key={r._id} className={`p-3 border rounded flex items-start justify-between cursor-pointer ${!r.seen ? 'border-red-500' : ''}`} onClick={() => { setSelectedReport(r); setShowReportModal(true); markReportSeenMutation.mutate(r._id); }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{r.type.toUpperCase()}</div>
                      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                      <div className="text-sm mt-2 truncate">{r.details || <span className="text-gray-400">No details provided</span>}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <a
                        href={
                          r.type === 'post' ? `/post/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` :
                          r.type === 'discussion' ? `/discussion/${r.target}${r.subTarget ? `?comment=${r.subTarget}` : ''}` :
                          r.type === 'job' ? `/job/${r.target}` :
                          r.type === 'event' ? `/event/${r.target}` :
                          (r.type === 'other' && r.target) ? `/profile/${r.target}` : '#'
                        }
                        className="text-sm text-primary underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View {r.type === 'other' && r.target ? 'User' : r.type}
                      </a>
                      <button className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded" onClick={(e) => { e.stopPropagation(); markReportSeenMutation.mutate(r._id); }}>Mark Seen</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{feedbackView === 'recent' ? 'Recent Feedback' : 'All Feedback'}</h3>
            <div className="flex items-center gap-2">
              {feedbackView === 'recent' ? (
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => queryClient.invalidateQueries(["adminFeedbacks"])}>Refresh</button>
                  <button className="text-sm text-primary underline" onClick={() => setFeedbackView('all')}>View All</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm" onClick={() => markAllFeedbacksSeenMutation.mutate()}>Mark All as Seen</button>
                  <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => queryClient.invalidateQueries(["adminFeedbacks"])}>Refresh</button>
                  <button className="text-sm text-primary underline" onClick={() => setFeedbackView('recent')}>Back to Recent</button>
                </div>
              )}
            </div>
          </div>

          {(!feedbacks || feedbacks.length === 0) ? (
            <div className="text-center text-gray-400">No feedback</div>
          ) :(feedbackView === 'recent' ? (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedbackReports;