
import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Loader, Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
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
  getEventTimeData,
  getUserStatusData,
  getUserPermissionData,
  getUserRoleData,
  getAlumniByWorkExperienceData,
  getAlumniWorkRelevanceData,
  getFeedbackStatusData,
  getReportsByTypeData,
  getReportsByStatusData,
  getModerationActionData,
  getModerationTimeData,
  getModerationTargetData
} from "../../lib/adminDetailsUtils";

const pieColors = ["#6366f1", "#f59e42", "#10b981", "#f43f5e", "#a78bfa", "#fbbf24", "#3b82f6"];

const AdminDetails = ({ stats = {} }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [postTimeMode, setPostTimeMode] = useState("month");
  const [jobTimeMode, setJobTimeMode] = useState("month");
  const [discussionTimeMode, setDiscussionTimeMode] = useState("month");
  const [eventTimeMode, setEventTimeMode] = useState("month");
  const [moderationTimeMode, setModerationTimeMode] = useState("month");
  const [showAlumniWorkExpModal, setShowAlumniWorkExpModal] = useState(false);
  const [showAlumniRelevanceModal, setShowAlumniRelevanceModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState({
    users: false,
    alumni: false,
    feedback: false,
    reports: false,
    moderation: false,
    posts: false,
    jobs: false,
    discussions: false,
    events: false,
  });

  // Download handler functions
  const handleSelectAll = () => {
    const allSelected = Object.values(selectedTabs).every(val => val);
    const newState = {};
    Object.keys(selectedTabs).forEach(key => {
      newState[key] = !allSelected;
    });
    setSelectedTabs(newState);
  };

  const handleTabToggle = (tab) => {
    setSelectedTabs(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
  };

  const handleDownload = async () => {
    const selectedSections = Object.entries(selectedTabs)
      .filter(([_, isSelected]) => isSelected)
      .map(([tab]) => tab);

    if (selectedSections.length === 0) return;

    try {
      // Hide the modal during capture
      setShowDownloadModal(false);
      
      // Wait for modal to close
      await new Promise(resolve => setTimeout(resolve, 300));

      const pdf = new jsPDF("l", "mm", "a4"); // "l" for landscape orientation
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let isFirstPage = true;

      // Add title page
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("AlumLink Analytics Report", pageWidth / 2, 40, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 50, { align: "center" });

      for (const section of selectedSections) {
        // Switch to the tab to render its content
        setActiveTab(section);
        
        // Wait for tab to render and charts to fully load (increased wait time)
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Get the section content by ID
        const contentElement = document.getElementById(`${section}-section`);
        
        if (contentElement) {
          if (!isFirstPage) {
            pdf.addPage();
          } else {
            pdf.addPage();
          }
          isFirstPage = false;

          // Capture using html2canvas-pro (supports oklch)
          const canvas = await html2canvas(contentElement, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
          });

          const imgData = canvas.toDataURL("image/png");
          const imgWidth = pageWidth - 20;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // If content is taller than one page, split across multiple pages
          if (imgHeight > pageHeight - 20) {
            let yPos = 0;
            let heightLeft = imgHeight;
            
            while (heightLeft > 0) {
              pdf.addImage(imgData, "PNG", 10, 10 - yPos, imgWidth, imgHeight);
              heightLeft -= (pageHeight - 20);
              yPos += (pageHeight - 20);
              
              if (heightLeft > 0) {
                pdf.addPage();
              }
            }
          } else {
            pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
          }
        }
      }

      // Save the PDF
      pdf.save(`alumnilink-analytics-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

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

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError
  } = useQuery({
    queryKey: ["adminAllUsers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/users");
      return res.data;
    },
  });

  const {
    data: feedbacks,
    isLoading: feedbacksLoading,
    error: feedbacksError
  } = useQuery({
    queryKey: ["adminAllFeedbacks"],
    queryFn: async () => {
      const res = await axiosInstance.get("/feedbacks");
      return res.data;
    },
  });

  const {
    data: reports,
    isLoading: reportsLoading,
    error: reportsError
  } = useQuery({
    queryKey: ["adminAllReports"],
    queryFn: async () => {
      const res = await axiosInstance.get("/reports");
      return res.data;
    },
  });

  const {
    data: moderationLogs,
    isLoading: moderationLogsLoading,
    error: moderationLogsError
  } = useQuery({
    queryKey: ["adminAllModerationLogs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/moderation-logs");
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
  const discussionCategoryData = discussions ? getDiscussionCategoryData(discussions) : [];
  const discussionStatusData = discussions ? getDiscussionStatusData(discussions) : [];
  const discussionTimeData = discussions ? getDiscussionTimeData(discussions, discussionTimeMode) : [];
  // Event
  const eventTypeData = events ? getEventTypeData(events) : [];
  const eventPhysicalVirtualData = events ? getEventPhysicalVirtualData(events) : [];
  const eventStatusData = events ? getEventStatusData(events) : [];
  const eventBannedData = events ? getEventBannedData(events) : [];
  const eventTimeData = events ? getEventTimeData(events, eventTimeMode) : [];

  // User
  const userStatusData = users ? getUserStatusData(users) : [];
  const userPermissionData = users ? getUserPermissionData(users) : [];
  const userRoleData = users ? getUserRoleData(users) : [];

  // Alumni
  const alumniByWorkExperienceData = users ? getAlumniByWorkExperienceData(users) : [];
  const alumniWorkRelevanceData = users ? getAlumniWorkRelevanceData(users) : [];

  // Get detailed alumni lists for modal
  const getAlumniDetails = () => {
    if (!users) return { related: [], notRelated: [], withoutExperience: [] };
    
    const alumni = users.filter(user => user.role === 'alumni');
    const withoutExperience = alumni.filter(user => !user.experience || user.experience.length === 0);
    const withExperience = alumni.filter(user => user.experience && user.experience.length > 0);
    
    const isWorkRelatedToCourse = (user) => {
      if (!user.course || !user.experience || user.experience.length === 0) return false;
      
      // Find the latest experience by start date
      const latestExperience = user.experience.reduce((latest, exp) => {
        if (!exp.startDate) return latest;
        if (!latest || !latest.startDate) return exp;
        
        const expDate = new Date(exp.startDate);
        const latestDate = new Date(latest.startDate);
        
        return expDate > latestDate ? exp : latest;
      }, null);
      
      // If no valid experience found, return false
      if (!latestExperience) return false;
      
      // If AI has already determined relevance, use that
      if (latestExperience.isRelatedToCourse !== undefined) {
        return latestExperience.isRelatedToCourse;
      }
      
      // Otherwise, fall back to keyword matching
      const course = user.course.toLowerCase();
      const jobTitle = (latestExperience.title || '').toLowerCase();
      const company = (latestExperience.company || '').toLowerCase();
      
      const courseKeywords = {
        'bsit': ['developer', 'programmer', 'software', 'it', 'web', 'tech', 'data', 'system', 'network', 'database', 'engineer', 'analyst', 'qa', 'devops', 'frontend', 'backend', 'fullstack'],
        'bscs': ['developer', 'programmer', 'software', 'computer', 'tech', 'data', 'ai', 'ml', 'algorithm', 'system', 'engineer', 'analyst', 'researcher'],
        'bsis': ['analyst', 'system', 'business', 'data', 'it', 'information', 'database', 'erp', 'crm', 'consultant'],
        'bsece': ['engineer', 'electrical', 'electronics', 'circuit', 'embedded', 'hardware', 'telecom', 'signal'],
        'bsme': ['engineer', 'mechanical', 'manufacturing', 'design', 'cad', 'production', 'maintenance'],
        'bsce': ['engineer', 'civil', 'construction', 'structural', 'infrastructure', 'building', 'project'],
      };
      
      let keywords = [];
      for (const [key, words] of Object.entries(courseKeywords)) {
        if (course.includes(key)) {
          keywords = words;
          break;
        }
      }
      
      if (keywords.length === 0 && (course.includes('bs') || course.includes('engineering'))) {
        keywords = ['engineer', 'developer', 'analyst', 'technician', 'specialist'];
      }
      
      return keywords.some(keyword => jobTitle.includes(keyword) || company.includes(keyword));
    };
    
    const related = withExperience.filter(user => isWorkRelatedToCourse(user));
    const notRelated = withExperience.filter(user => !isWorkRelatedToCourse(user));
    
    return { related, notRelated, withoutExperience };
  };

  const alumniDetails = getAlumniDetails();

  // Feedback
  const feedbackStatusData = feedbacks ? getFeedbackStatusData(feedbacks) : [];

  // Reports
  const reportsByTypeData = reports ? getReportsByTypeData(reports) : [];
  const reportsByStatusData = reports ? getReportsByStatusData(reports) : [];

  // Moderation
  const moderationActionData = moderationLogs ? getModerationActionData(moderationLogs) : [];
  const moderationTimeData = moderationLogs ? getModerationTimeData(moderationLogs, moderationTimeMode) : [];
  const moderationTargetData = moderationLogs ? getModerationTargetData(moderationLogs) : [];

  if (postsLoading || jobsLoading || discussionsLoading || eventsLoading || usersLoading || feedbacksLoading || reportsLoading || moderationLogsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary" size={48} />
      </div>
    );
  }
  if (postsError || jobsError || discussionsError || eventsError || usersError || feedbacksError || reportsError || moderationLogsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-lg text-red-500">Error loading data. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alumni Work Experience Modal */}
      {showAlumniWorkExpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Alumni Work Experience Details</h3>
              <button
                onClick={() => setShowAlumniWorkExpModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {/* With Work Experience */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-700 mb-3">
                  With Work Experience ({alumniDetails.related.length + alumniDetails.notRelated.length})
                </h4>
                {(alumniDetails.related.length + alumniDetails.notRelated.length) > 0 ? (
                  <div className="space-y-2">
                    {[...alumniDetails.related, ...alumniDetails.notRelated].map((user) => (
                      <div key={user._id} className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link to={`/profile/${user.username}`} className="font-medium text-blue-600">
                              {user.name}
                            </Link>
                            <p className="text-sm text-gray-600">Course: {user.course}</p>
                            <p className="text-sm text-gray-600">
                              Work: {user.experience?.[0]?.title || 'N/A'} at {user.experience?.[0]?.company || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Has Experience</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No alumni with work experience</p>
                )}
              </div>

              {/* Without Work Experience */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3">
                  Without Work Experience ({alumniDetails.withoutExperience.length})
                </h4>
                {alumniDetails.withoutExperience.length > 0 ? (
                  <div className="space-y-2">
                    {alumniDetails.withoutExperience.map((user) => (
                      <div key={user._id} className="bg-gray-50 border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link to={`/profile/${user.username}`} className="font-medium text-blue-600">
                              {user.name}
                            </Link>
                            <p className="text-sm text-gray-600">Course: {user.course}</p>
                            <p className="text-sm text-gray-600">No work experience added</p>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">No Experience</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No alumni without work experience</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowAlumniWorkExpModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Work Relevance Modal */}
      {showAlumniRelevanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Work Relevance to Course Details</h3>
              <button
                onClick={() => setShowAlumniRelevanceModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {/* Related to Course */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-700 mb-3">
                  Work Related to Course ({alumniDetails.related.length})
                </h4>
                {alumniDetails.related.length > 0 ? (
                  <div className="space-y-2">
                    {alumniDetails.related.map((user) => (
                      <div key={user._id} className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link to={`/profile/${user.username}`} className="font-medium text-blue-600">
                              {user.name}
                            </Link>
                            <p className="text-sm text-gray-600">Course: {user.course}</p>
                            <p className="text-sm text-gray-600">
                              Work: {user.experience?.[0]?.title || 'N/A'} at {user.experience?.[0]?.company || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Related</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No alumni in this category</p>
                )}
              </div>

              {/* Not Related to Course */}
              <div>
                <h4 className="text-lg font-semibold text-orange-700 mb-3">
                  Work Not Related to Course ({alumniDetails.notRelated.length})
                </h4>
                {alumniDetails.notRelated.length > 0 ? (
                  <div className="space-y-2">
                    {alumniDetails.notRelated.map((user) => (
                      <div key={user._id} className="bg-orange-50 border border-orange-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link to={`/profile/${user.username}`} className="font-medium text-blue-600">
                              {user.name}
                            </Link>
                            <p className="text-sm text-gray-600">Course: {user.course}</p>
                            <p className="text-sm text-gray-600">
                              Work: {user.experience?.[0]?.title || 'N/A'} at {user.experience?.[0]?.company || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Not Related</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No alumni in this category</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowAlumniRelevanceModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "users" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("alumni")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "alumni" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Alumni
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "feedback" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Feedback
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "reports" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "moderation" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Moderation Logs
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "posts" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "jobs" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab("discussions")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "discussions" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "events" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Events
          </button>
        </div>
        
        {/* Download Button */}
        <button
          onClick={() => setShowDownloadModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Download size={16} />
          Download Data
        </button>
      </div>

      {/* Users Section */}
      {activeTab === "users" && (
        <div id="users-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Users</h2>
            <span className="text-base text-gray-700">Total Users: <span className="font-bold">{users ? users.length : 0}</span></span>
          </div>
          {users && users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Users Available</h3>
                <p className="text-gray-500 max-w-md">There are currently no users in the system. User analytics and data will appear here once users are registered.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 mb-4 md:grid-cols-3 grid-cols-1">
              {/* User by Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Users by Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={userStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                      {userStatusData.map((entry, idx) => (
                        <Cell key={`cell-user-status-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* User by Permission Level */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Users by Permission Level</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={userPermissionData} dataKey="count" nameKey="permission" cx="50%" cy="50%" outerRadius={70} label>
                      {userPermissionData.map((entry, idx) => (
                        <Cell key={`cell-user-perm-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* User by Role */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Users by Role</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={userRoleData} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={70} label>
                      {userRoleData.map((entry, idx) => (
                        <Cell key={`cell-user-role-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alumni Section */}
      {activeTab === "alumni" && (
        <div id="alumni-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Alumni</h2>
            <span className="text-base text-gray-700">Total Alumni: <span className="font-bold">{users ? users.filter(u => u.role === 'alumni').length : 0}</span></span>
          </div>
          {users && users.filter(u => u.role === 'alumni').length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Alumni Data Available</h3>
                <p className="text-gray-500 max-w-md">There are currently no alumni users in the system. Alumni data and analytics will appear here once users with the alumni role are added.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 mb-4 md:grid-cols-2 grid-cols-1">
            {/* Alumni by Work Experience */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Alumni by Work Experience</h3>
                <button
                  onClick={() => setShowAlumniWorkExpModal(true)}
                  className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                  title="View detailed list"
                >
                  View Details
                </button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={alumniByWorkExperienceData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                    {alumniByWorkExperienceData.map((entry, idx) => (
                      <Cell key={`cell-alumni-exp-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Work Relevance to Course */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Work Relevance to Course</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Alumni with work: <span className="font-bold">{users ? users.filter(u => u.role === 'alumni' && u.experience && u.experience.length > 0).length : 0}</span></span>
                  <button
                    onClick={() => setShowAlumniRelevanceModal(true)}
                    className="ml-2 px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                    title="View detailed list"
                  >
                    View Details
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={alumniWorkRelevanceData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                    {alumniWorkRelevanceData.map((entry, idx) => (
                      <Cell key={`cell-alumni-relevance-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      {activeTab === "feedback" && (
        <div id="feedback-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Feedback</h2>
            <span className="text-base text-gray-700">Total Feedback: <span className="font-bold">{feedbacks ? feedbacks.length : 0}</span></span>
          </div>
          {feedbacks && feedbacks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Submitted</h3>
                <p className="text-gray-500 max-w-md">There is currently no feedback from users. Feedback data and analytics will appear here once users submit their feedback.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 mb-4 md:grid-cols-1 grid-cols-1">
              {/* Feedback Seen/Unseen */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Feedback Seen vs Unseen</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={feedbackStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                      {feedbackStatusData.map((entry, idx) => (
                        <Cell key={`cell-feedback-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Section */}
      {activeTab === "reports" && (
        <div id="reports-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Reports</h2>
            <span className="text-base text-gray-700">Total Reports: <span className="font-bold">{reports ? reports.length : 0}</span></span>
          </div>
          {reports && reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Submitted</h3>
                <p className="text-gray-500 max-w-md">There are currently no user reports. Report data and analytics will appear here once users submit reports about content or users.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 mb-4 md:grid-cols-2 grid-cols-1">
              {/* Reports by Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Reports by Type</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={reportsByTypeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label>
                      {reportsByTypeData.map((entry, idx) => (
                        <Cell key={`cell-reports-type-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Reports by Seen/Unseen */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Reports Seen vs Unseen</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={reportsByStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                      {reportsByStatusData.map((entry, idx) => (
                        <Cell key={`cell-reports-status-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Moderation Logs Section */}
      {activeTab === "moderation" && (
        <div id="moderation-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Moderation Logs</h2>
            <span className="text-base text-gray-700">Total Logs: <span className="font-bold">{moderationLogs ? moderationLogs.length : 0}</span></span>
          </div>
          {moderationLogs && moderationLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Moderation Logs</h3>
                <p className="text-gray-500 max-w-md">There are currently no moderation actions recorded. Logs of ban and unban actions will appear here once moderation activities occur.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 mb-4 md:grid-cols-3 grid-cols-1">
              {/* Moderation Logs by Target */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Moderation Logs by Target</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={moderationTargetData} dataKey="count" nameKey="target" cx="50%" cy="50%" outerRadius={70} label>
                      {moderationTargetData.map((entry, idx) => (
                        <Cell key={`cell-mod-target-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Ban and Unban Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-2">Ban and Unban Actions</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={moderationActionData} dataKey="count" nameKey="action" cx="50%" cy="50%" outerRadius={70} label>
                      {moderationActionData.map((entry, idx) => (
                        <Cell key={`cell-mod-action-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Ban and Unbans Over Time */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Ban and Unban Actions / {moderationTimeMode === "month" ? "Month" : "Week"}</h3>
                  <div className="space-x-1">
                    <button className={`px-2 py-1 rounded text-xs ${moderationTimeMode === "month" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setModerationTimeMode("month")}>Month</button>
                    <button className={`px-2 py-1 rounded text-xs ${moderationTimeMode === "week" ? "bg-primary text-white" : "bg-gray-200"}`} onClick={() => setModerationTimeMode("week")}>Week</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={moderationTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="bans" fill="#f59e42" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="unbans" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts Section */}
      {activeTab === "posts" && (
        <div id="posts-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Posts</h2>
            <span className="text-base text-gray-700">Total Posts: <span className="font-bold">{posts ? posts.length : 0}</span></span>
          </div>
          {posts && posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Available</h3>
                <p className="text-gray-500 max-w-md">There are currently no posts in the system. Post analytics and data will appear here once users start creating posts.</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Jobs Section */}
      {activeTab === "jobs" && (
        <div id="jobs-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Job Posts</h2>
            <span className="text-base text-gray-700">Total Job Posts: <span className="font-bold">{jobs ? jobs.length : 0}</span></span>
          </div>
          {jobs && jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Job Posts Available</h3>
                <p className="text-gray-500 max-w-md">There are currently no job posts in the system. Job analytics and data will appear here once users start posting job opportunities.</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Discussion Section */}
      {activeTab === "discussions" && (
        <div id="discussions-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Discussions</h2>
            <span className="text-base text-gray-700">Total Discussions: <span className="font-bold">{discussions ? discussions.length : 0}</span></span>
          </div>
          {discussions && discussions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Discussion Posts Available</h3>
                <p className="text-gray-500 max-w-md">There are currently no discussion posts in the system. Discussion analytics and data will appear here once users start creating discussion topics.</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Event Section */}
      {activeTab === "events" && (
        <div id="events-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Events</h2>
            <span className="text-base text-gray-700">Total Events: <span className="font-bold">{events ? events.length : 0}</span></span>
          </div>
          {events && events.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Event Posts Available</h3>
                <p className="text-gray-500 max-w-md">There are currently no event posts in the system. Event analytics and data will appear here once users start creating events.</p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Download Analytics Data</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Select which sections to include in the PDF:
              </p>
              
              {/* Select All */}
              <div className="mb-4 pb-4 border-b">
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={Object.values(selectedTabs).every(val => val)}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="font-semibold text-gray-900">Select All</span>
                </label>
              </div>

              {/* Individual Sections */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.keys(selectedTabs).map(tab => (
                  <label key={tab} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedTabs[tab]}
                      onChange={() => handleTabToggle(tab)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-gray-700 capitalize">{tab}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={!Object.values(selectedTabs).some(val => val)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDetails;
