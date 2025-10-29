
import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import {
  getPostStatusData,
  getPostTimeData,
  getJobTypeData,
  getJobWorkTypeData,
  getJobStatusData,
  getJobTimeData,
  getDiscussionCategoryData,
  getDiscussionStatusData,
  getDiscussionTimeData,
  getEventTypeData,
  getEventPhysicalVirtualData,
  getEventStatusData,
  getEventBannedData,
  getEventTimeData
} from "./adminDetailsUtils";

const pieColors = ["#6366f1", "#f59e42", "#10b981", "#f43f5e", "#a78bfa", "#fbbf24", "#3b82f6"];

const AdminDetails = ({ stats = {} }) => {
  const [postTimeMode, setPostTimeMode] = useState("month");
  const [jobTimeMode, setJobTimeMode] = useState("month");

  // Fetch all posts, jobs, discussions, events (admin endpoints)

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError
  } = useQuery({
    queryKey: ["adminAllPosts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/all-posts");
      return res.data;
    },
  });

  const {
    data: jobs,
    isLoading: jobsLoading,
    error: jobsError
  } = useQuery({
    queryKey: ["adminAllJobs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/all-jobs");
      return res.data;
    },
  });

  const {
    data: discussions,
    isLoading: discussionsLoading,
    error: discussionsError
  } = useQuery({
    queryKey: ["adminAllDiscussions"],
    queryFn: async () => {
      const res = await axiosInstance.get("/discussions");
      return res.data;
    },
  });

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery({
    queryKey: ["adminAllEvents"],
    queryFn: async () => {
      const res = await axiosInstance.get("/events");
      return res.data;
    },
  });

  // Compute chart data
  const postStatusData = posts ? getPostStatusData(posts) : [];
  const postTimeData = posts ? getPostTimeData(posts, postTimeMode) : [];
  const jobTypeData = jobs ? getJobTypeData(jobs) : [];
  const jobWorkTypeData = jobs ? getJobWorkTypeData(jobs) : [];
  const jobStatusData = jobs ? getJobStatusData(jobs) : [];
  const jobTimeData = jobs ? getJobTimeData(jobs, jobTimeMode) : [];
  // Discussion
  const [discussionTimeMode, setDiscussionTimeMode] = useState("month");
  const discussionCategoryData = discussions ? getDiscussionCategoryData(discussions) : [];
  const discussionStatusData = discussions ? getDiscussionStatusData(discussions) : [];
  const discussionTimeData = discussions ? getDiscussionTimeData(discussions, discussionTimeMode) : [];
  // Event
  const [eventTimeMode, setEventTimeMode] = useState("month");
  const eventTypeData = events ? getEventTypeData(events) : [];
  const eventPhysicalVirtualData = events ? getEventPhysicalVirtualData(events) : [];
  // Capitalize first letter of event status for chart display
  const eventStatusData = events ? getEventStatusData(events).map(e => ({ ...e, status: e.status.charAt(0).toUpperCase() + e.status.slice(1) })) : [];
  const eventBannedData = events ? getEventBannedData(events) : [];
  const eventTimeData = events ? getEventTimeData(events, eventTimeMode) : [];

  if (postsLoading || jobsLoading || discussionsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-lg text-gray-500">Loading detailed charts...</span>
      </div>
    );
  }
  if (postsError || jobsError || discussionsError || eventsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-lg text-red-500">Error loading data. Please try again.</span>
      </div>
    );
  }
      

  return (
    <div className="space-y-10">
      {/* Posts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Posts</h2>
          <span className="text-base text-gray-700">Total Posts: <span className="font-bold">{posts ? posts.length : 0}</span></span>
        </div>
        <div className="grid gap-3 mb-4 md:grid-cols-2 grid-cols-1">
          {/* Active/Banned Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Active vs Banned Posts</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={postStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {postStatusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* New Posts Over Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">New Posts / {postTimeMode === "month" ? "Month" : "Week"}</h3>
              <div className="space-x-1">
                <button className={`px-2 py-1 rounded text-xs ${postTimeMode === "month" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setPostTimeMode("month")}>Month</button>
                <button className={`px-2 py-1 rounded text-xs ${postTimeMode === "week" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setPostTimeMode("week")}>Week</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={postTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="posts" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Add more post graphs here for 2x2 layout if needed */}
        </div>
      </div>

      {/* Jobs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Job Posts</h2>
          <span className="text-base text-gray-700">Total Job Posts: <span className="font-bold">{jobs ? jobs.length : 0}</span></span>
        </div>
  <div className="grid gap-3 mb-4 md:grid-cols-2 grid-cols-1">
          {/* Job by Type Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Job Posts by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={jobTypeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label>
                  {jobTypeData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Job by Worktype Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Job Posts by Worktype</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={jobWorkTypeData} dataKey="count" nameKey="worktype" cx="50%" cy="50%" outerRadius={70} label>
                  {jobWorkTypeData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Job by Status Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Active vs Banned Job Posts</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={jobStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {jobStatusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">New Job Posts / {jobTimeMode === "month" ? "Month" : "Week"}</h3>
                <div className="space-x-1">
                <button className={`px-2 py-1 rounded text-xs ${jobTimeMode === "month" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setJobTimeMode("month")}>Month</button>
                <button className={`px-2 py-1 rounded text-xs ${jobTimeMode === "week" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setJobTimeMode("week")}>Week</button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={jobTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jobs" fill="#f59e42" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        
      </div>
      {/* Discussion Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Discussions</h2>
          <span className="text-base text-gray-700">Total Discussions: <span className="font-bold">{discussions ? discussions.length : 0}</span></span>
        </div>
        <div className="grid gap-3 mb-4 md:grid-cols-3 grid-cols-1">
          {/* By Category Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Discussion Posts by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={discussionCategoryData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} label>
                  {discussionCategoryData.map((entry, idx) => (
                    <Cell key={`cell-disc-cat-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* By Status Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Active vs Banned Discussions</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={discussionStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {discussionStatusData.map((entry, idx) => (
                    <Cell key={`cell-disc-status-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* New Discussions Over Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">New Discussion Posts / {discussionTimeMode === "month" ? "Month" : "Week"}</h3>
              <div className="space-x-1">
                <button className={`px-2 py-1 rounded text-xs ${discussionTimeMode === "month" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setDiscussionTimeMode("month")}>Month</button>
                <button className={`px-2 py-1 rounded text-xs ${discussionTimeMode === "week" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setDiscussionTimeMode("week")}>Week</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={discussionTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="discussions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Event Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Events</h2>
          <span className="text-base text-gray-700">Total Events: <span className="font-bold">{events ? events.length : 0}</span></span>
        </div>
        {/* First row: 3 graphs */}
        <div className="grid gap-3 mb-4 md:grid-cols-3 grid-cols-1">
          {/* Event by Type Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Event Posts by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={eventTypeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label>
                  {eventTypeData.map((entry, idx) => (
                    <Cell key={`cell-event-type-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Event by Physical/Virtual Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Event by Physical/Virtual</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={eventPhysicalVirtualData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label>
                  {eventPhysicalVirtualData.map((entry, idx) => (
                    <Cell key={`cell-event-pv-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Event by Status Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Event by Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={eventStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {eventStatusData.map((entry, idx) => (
                    <Cell key={`cell-event-status-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Second row: 2 graphs */}
        <div className="grid gap-3 mb-4 md:grid-cols-2 grid-cols-1">
          {/* Event by Active/Banned Pie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Active vs Banned Events</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={eventBannedData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {eventBannedData.map((entry, idx) => (
                    <Cell key={`cell-event-banned-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* New Events Over Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">New Event Posts / {eventTimeMode === "month" ? "Month" : "Week"}</h3>
              <div className="space-x-1">
                <button className={`px-2 py-1 rounded text-xs ${eventTimeMode === "month" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setEventTimeMode("month")}>Month</button>
                <button className={`px-2 py-1 rounded text-xs ${eventTimeMode === "week" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setEventTimeMode("week")}>Week</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="events" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDetails;
