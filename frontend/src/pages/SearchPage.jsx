import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { User, FileText, Briefcase, MessageSquare, Calendar, GraduationCap, MapPin, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Loader } from "lucide-react";
import { useState } from "react";

const SearchPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [activeFilter, setActiveFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["searchResults", query],
    queryFn: async () => {
      if (!query) return {};
      const res = await axiosInstance.get(`/search?query=${encodeURIComponent(query)}`);
      return res.data;
    },
    enabled: !!query
  });

  const results = data && typeof data === 'object' ? data : {};
  
  // Calculate counts for each category
  const counts = {
    all: [
      ...(results.users || []),
      ...(results.posts || []),
      ...(results.jobPosts || []),
      ...(results.discussions || []),
      ...(results.events || [])
    ].length,
    people: (results.users || []).length,
    posts: (results.posts || []).length,
    jobs: (results.jobPosts || []).length,
    discussions: (results.discussions || []).length,
    events: (results.events || []).length
  };

  const navigate = useNavigate();

  // Card click handlers
  const goToProfile = username => navigate(`/profile/${username}`);
  const goToPost = id => navigate(`/post/${id}`);
  const goToJob = id => navigate(`/job/${id}`);
  const goToDiscussion = id => navigate(`/discussion/${id}`);
  const goToEvent = id => navigate(`/event/${id}`);

  // Filter tabs
  const filters = [
    { id: "all", label: "All", icon: Filter, count: counts.all },
    { id: "people", label: "People", icon: User, count: counts.people },
    { id: "posts", label: "Posts", icon: FileText, count: counts.posts },
    { id: "jobs", label: "Jobs", icon: Briefcase, count: counts.jobs },
    { id: "discussions", label: "Discussions", icon: MessageSquare, count: counts.discussions },
    { id: "events", label: "Events", icon: Calendar, count: counts.events }
  ];

  const shouldShow = (type) => {
    if (activeFilter === "all") return true;
    return activeFilter === type;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-3">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-gray-600">
            {query ? (
              <>
                Showing results for <span className="font-semibold text-primary">"{query}"</span>
              </>
            ) : (
              "Enter a search query to get started"
            )}
          </p>
          {counts.all > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {counts.all} {counts.all === 1 ? 'result' : 'results'} found
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-3 overflow-x-auto">
          <div className="flex border-b">
            {filters.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeFilter === filter.id
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === filter.id
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow">
            <Loader className="animate-spin h-12 w-12 text-primary mb-4" />
            <span className="text-lg text-gray-600">Searching...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error loading results</div>
            <p className="text-red-500">Please try again later</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && counts.all === 0 && query && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Results Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find anything matching <span className="font-semibold">"{query}"</span>
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Go to Home
            </button>
          </div>
        )}

        {/* Results Sections */}
        <div className="space-y-6">
          {/* People Section */}
          {shouldShow("people") && results.users?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold">People</h3>
                  <span className="text-sm text-gray-500">({results.users.length})</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.filter(user => !user.isSuperAdmin).map(user => (
                  <div
                    key={user._id}
                    onClick={() => goToProfile(user.username)}
                    className="flex items-center p-4 border rounded-lg hover:border-primary hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={user.profilePicture || "/avatar.png"}
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        {user.role && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium text-xs">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{user.headline}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {user.batch && (
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} />
                            Batch {user.batch}
                          </span>
                        )}
                        {user.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {user.location}
                          </span>
                        )}
                      </div>
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="text-xs text-gray-400 py-0.5">
                              +{user.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No People Results */}
          {shouldShow("people") && activeFilter === "people" && (!results.users || results.users.length === 0) && !isLoading && query && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <User size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No People Found</h3>
              <p className="text-gray-600">Try adjusting your search or browse all results</p>
            </div>
          )}

          {/* Posts Section */}
          {shouldShow("posts") && results.posts?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold">Posts</h3>
                  <span className="text-sm text-gray-500">({results.posts.length})</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.posts.map(post => (
                  <div
                    key={post._id}
                    onClick={() => goToPost(post._id)}
                    className="flex items-start p-4 border rounded-lg hover:border-primary hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={post.author?.profilePicture || "/avatar.png"}
                      alt={post.author?.name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {post.author?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">{post.author?.headline || ""}</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{post.content || ""}</p>
                      {post.image && (
                        <div className="mt-3">
                          <img
                            src={post.image}
                            alt="Post content"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Posts Results */}
          {shouldShow("posts") && activeFilter === "posts" && (!results.posts || results.posts.length === 0) && !isLoading && query && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Found</h3>
              <p className="text-gray-600">Try adjusting your search or browse all results</p>
            </div>
          )}

          {/* Job Posts Section */}
          {shouldShow("jobs") && results.jobPosts?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Briefcase size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold">Job Opportunities</h3>
                  <span className="text-sm text-gray-500">({results.jobPosts.length})</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.jobPosts.map(job => (
                  <div
                    key={job._id}
                    onClick={() => goToJob(job._id)}
                    className="flex items-start p-4 border rounded-lg hover:border-primary hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Briefcase size={24} className="text-gray-600" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {job.title || "Job Post"}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {job.type === 'job' ? 'Full-time' : 
                           job.type === 'part-time' ? 'Part-time' :
                           job.type ? job.type.charAt(0).toUpperCase() + job.type.slice(1) : 'Job'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">{job.company || "Company"}</span> • {job.location || "Location"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {job.workType ? job.workType.charAt(0).toUpperCase() + job.workType.slice(1) : "Remote"}
                        </span>
                      </div>
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="text-xs text-gray-400 py-0.5">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Jobs Results */}
          {shouldShow("jobs") && activeFilter === "jobs" && (!results.jobPosts || results.jobPosts.length === 0) && !isLoading && query && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600">Try adjusting your search or browse all results</p>
            </div>
          )}

          {/* Discussions Section */}
          {shouldShow("discussions") && results.discussions?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold">Discussions</h3>
                  <span className="text-sm text-gray-500">({results.discussions.length})</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.discussions.map(discussion => (
                  <div
                    key={discussion._id}
                    onClick={() => goToDiscussion(discussion._id)}
                    className="flex items-start p-4 border rounded-lg hover:border-primary hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={discussion.author?.profilePicture || "/avatar.png"}
                      alt={discussion.author?.name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {discussion.title || "Discussion"}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {discussion.category || "General"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        by {discussion.author?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">{discussion.content || ""}</p>
                      {discussion.tags && discussion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {discussion.tags.slice(0, 4).map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                          {discussion.tags.length > 4 && (
                            <span className="text-xs text-gray-400 py-0.5">
                              +{discussion.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Discussions Results */}
          {shouldShow("discussions") && activeFilter === "discussions" && (!results.discussions || results.discussions.length === 0) && !isLoading && query && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Discussions Found</h3>
              <p className="text-gray-600">Try adjusting your search or browse all results</p>
            </div>
          )}

          {/* Events Section */}
          {shouldShow("events") && results.events?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold">Events</h3>
                  <span className="text-sm text-gray-500">({results.events.length})</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.events.map(event => (
                  <div
                    key={event._id}
                    onClick={() => goToEvent(event._id)}
                    className="flex items-start p-4 border rounded-lg hover:border-primary hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar size={24} className="text-gray-600" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {event.title || "Event"}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "Upcoming"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">{event.type || "Event"}</span> • {event.location || 'Online'}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">{event.description || ""}</p>
                      {event.eventDate && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                          {event.startTime && <span>• {event.startTime}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Events Results */}
          {shouldShow("events") && activeFilter === "events" && (!results.events || results.events.length === 0) && !isLoading && query && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600">Try adjusting your search or browse all results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
