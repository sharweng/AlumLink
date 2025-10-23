import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { User, FileText, Briefcase, MessageSquare, Calendar, GraduationCap, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Loader } from "lucide-react";

const SearchPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["searchResults", query],
    queryFn: async () => {
      if (!query) return [];
      const res = await axiosInstance.get(`/search?query=${encodeURIComponent(query)}`);
      return res.data;
    },
    enabled: !!query
  });

  const results = data && typeof data === 'object' ? data : {};
  const hasResults = [
    ...(results.users || []),
    ...(results.posts || []),
    ...(results.jobPosts || []),
    ...(results.discussions || []),
    ...(results.events || [])
  ].length > 0;
    const totalResults = [
      ...(results.users || []),
      ...(results.posts || []),
      ...(results.jobPosts || []),
      ...(results.discussions || []),
      ...(results.events || [])
    ].length;
  const navigate = useNavigate();

  // Card click handlers
  const goToProfile = username => navigate(`/profile/${username}`);
  const goToPost = id => navigate(`/post/${id}`);
  const goToJob = id => navigate(`/job/${id}`);
  const goToDiscussion = id => navigate(`/discussion/${id}`);
  const goToEvent = id => navigate(`/event/${id}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Search Results for "{query}"</h1>
          <div className="text-gray-500 mb-4 text-sm">{totalResults} result{totalResults === 1 ? '' : 's'} found</div>
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
              <span className="text-lg text-info font-medium">Searching...</span>
            </div>
          )}
          {error && <div className="text-red-500">Error loading results</div>}
          {!isLoading && !hasResults && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" stroke="#CC0000" strokeWidth="2" fill="#F3F4F6" /><path stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
              <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
              <p className="text-gray-600 mb-6">Try a different search term or check your spelling.</p>
            </div>
          )}
          {/* Users Section */}
          {results.users?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100 flex items-center"><User size={16} className="inline mr-2" />People ({results.users.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map(user => (
                  <div key={user._id} className="flex items-center p-4 bg-white hover:bg-gray-50 rounded-lg shadow transition cursor-pointer" onClick={() => goToProfile(user.username)}>
                    <img src={user.profilePicture || "/avatar.png"} alt={user.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.headline}</p>
                      <div className="flex items-center text-xs text-gray-400 mt-1 space-x-3">
                        {user.batch && <span className="flex items-center"><GraduationCap size={12} className="mr-1" />Batch {user.batch}</span>}
                        {user.course && <span>{user.course}</span>}
                        {user.location && <span className="flex items-center"><MapPin size={12} className="mr-1" />{user.location}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Posts Section */}
          {results.posts?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100 flex items-center"><FileText size={16} className="inline mr-2" />Posts ({results.posts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.posts.map(post => (
                  <div key={post._id} className="flex items-start p-4 bg-white hover:bg-gray-50 rounded-lg shadow transition cursor-pointer" onClick={() => goToPost(post._id)}>
                    <img src={post.author?.profilePicture || "/avatar.png"} alt={post.author?.name || "User"} className="w-10 h-10 rounded-full object-cover mr-3 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{post.author?.name || "Unknown"}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{post.author?.headline || ""}</p>
                      <p className="text-sm text-gray-700 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{post.content || ""}</p>
                      {post.image && (
                        <div className="mt-2">
                          <img src={post.image} alt="Post content" className="w-full max-w-xs h-20 object-cover rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Job Posts Section */}
          {results.jobPosts?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100 flex items-center"><Briefcase size={16} className="inline mr-2" />Jobs ({results.jobPosts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.jobPosts.map(job => (
                  <div key={job._id} className="flex items-start p-4 bg-white hover:bg-gray-50 rounded-lg shadow transition cursor-pointer" onClick={() => goToJob(job._id)}>
                    <img src={job.author?.profilePicture || "/avatar.png"} alt={job.author?.name || "User"} className="w-10 h-10 rounded-full object-cover mr-3 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{job.title || "Job Post"}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>{job.type === 'job' ? 'Full-time' : job.type === 'part-time' ? 'Part-time' : job.type ? job.type.charAt(0).toUpperCase() + job.type.slice(1) : 'Job'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{job.company || "Company"} • {job.location || "Location"}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className="flex items-center"><MapPin size={12} className="mr-1" />{job.workType ? job.workType.charAt(0).toUpperCase() + job.workType.slice(1) : "Remote"}</span>
                        {job.skills && job.skills.length > 0 && (
                          <span>{job.skills.slice(0, 3).join(", ")}{job.skills.length > 3 ? ` +${job.skills.length - 3} more` : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Discussions Section */}
          {results.discussions?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100 flex items-center"><MessageSquare size={16} className="inline mr-2" />Discussions ({results.discussions.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.discussions.map(discussion => (
                  <div key={discussion._id} className="flex items-start p-4 bg-white hover:bg-gray-50 rounded-lg shadow transition cursor-pointer" onClick={() => goToDiscussion(discussion._id)}>
                    <img src={discussion.author?.profilePicture || "/avatar.png"} alt={discussion.author?.name || "User"} className="w-10 h-10 rounded-full object-cover mr-3 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{discussion.title || "Discussion"}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{discussion.category || "General"}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">by {discussion.author?.name || "Unknown"}</p>
                      <p className="text-sm text-gray-700 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{discussion.content || ""}</p>
                      {discussion.tags && discussion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {discussion.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">#{tag}</span>
                          ))}
                          {discussion.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{discussion.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Events Section */}
          {results.events?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100 flex items-center"><Calendar size={16} className="inline mr-2" />Events ({results.events.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.events.map(event => (
                  <div key={event._id} className="flex items-start p-4 bg-white hover:bg-gray-50 rounded-lg shadow transition cursor-pointer" onClick={() => goToEvent(event._id)}>
                    <img src={event.organizer?.profilePicture || "/avatar.png"} alt={event.organizer?.name || "Event"} className="w-10 h-10 rounded-full object-cover mr-3 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{event.title || "Event"}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${event.status === 'upcoming' ? 'bg-green-100 text-green-800' : event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : event.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>{event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "Upcoming"}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{event.type || "Event"} • {event.location || 'Online'}</p>
                      <p className="text-sm text-gray-700 overflow-hidden mt-1" style={{display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical'}}>{event.description || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
