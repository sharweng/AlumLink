import { Link } from "react-router-dom";
import { User, FileText, MapPin, GraduationCap, Briefcase, MessageSquare, Calendar } from "lucide-react";
import { formatDate } from "../utils/dateUtils";

const SearchResults = ({ results, isLoading, query, onClose }) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4 z-50">
        <div className="text-center text-gray-500">Searching...</div>
      </div>
    );
  }

  if (!results || (!results.users?.length && !results.posts?.length && !results.jobPosts?.length && !results.discussions?.length && !results.events?.length)) {
    if (query) {
      return (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4 z-50">
          <div className="text-center text-gray-500">No results found for "{query}"</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto z-50">
      {/* Users Section */}
      {results.users?.length > 0 && (
        <div className="p-2">
          <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100">
            <User size={16} className="inline mr-2" />
            People ({results.users.filter(u => !u.isSuperAdmin).length})
          </h3>
          {results.users.filter(user => !user.isSuperAdmin).map((user) => (
            <Link
              key={user._id}
              to={`/profile/${user.username}`}
              onClick={onClose}
              className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <img
                src={user.profilePicture || "/avatar.png"}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  {user.role && (
                    <span className="px-2 py-0.5 bg-primary bg-opacity-10 text-primary rounded-full font-medium text-xs">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {user.headline}
                </p>
                <div className="flex items-center text-xs text-gray-400 mt-1 space-x-3">
                  {user.batch && (
                    <span className="flex items-center">
                      <GraduationCap size={12} className="mr-1" />
                      Batch {user.batch}
                    </span>
                  )}
                  {user.course && (
                    <span>{user.course}</span>
                  )}
                  {user.location && (
                    <span className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      {user.location}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Posts Section */}
      {results.posts?.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100">
            <FileText size={16} className="inline mr-2" />
            Posts ({results.posts.length})
          </h3>
          {results.posts.map((post) => (
            <Link
              key={post._id}
              to={`/post/${post._id}`}
              onClick={onClose}
              className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <img
                src={post?.author?.profilePicture || "/avatar.png"}
                alt={post?.author?.name || "User"}
                className="w-10 h-10 rounded-full object-cover mr-3 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {post?.author?.name || "Unknown"}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDate(post?.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {post?.author?.headline || ""}
                </p>
                <p className="text-sm text-gray-700 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                  {post?.content || ""}
                </p>
                {post?.image && (
                  <div className="mt-2">
                    <img
                      src={post.image}
                      alt="Post content"
                      className="w-full max-w-xs h-20 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Job Posts Section */}
      {results.jobPosts?.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100">
            <Briefcase size={16} className="inline mr-2" />
            Jobs ({results.jobPosts.length})
          </h3>
          {results.jobPosts.map((jobPost) => (
            <Link
              key={jobPost._id}
              to={`/job/${jobPost._id}`}
              onClick={onClose}
              className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <img
                src={jobPost?.author?.profilePicture || "/avatar.png"}
                alt={jobPost?.author?.name || "User"}
                className="w-10 h-10 rounded-full object-cover mr-3 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {jobPost?.title || "Job Post"}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    jobPost?.type === 'job' ? 'bg-green-100 text-green-800' :
                    jobPost?.type === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
                    jobPost?.type === 'internship' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {jobPost?.type === 'job' ? 'Full-time' : 
                     jobPost?.type === 'part-time' ? 'Part-time' :
                     jobPost?.type ? jobPost.type.charAt(0).toUpperCase() + jobPost.type.slice(1) : 'Job'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {jobPost?.company || "Company"} • {jobPost?.location || "Location"}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span className="flex items-center">
                    <MapPin size={12} className="mr-1" />
                    {jobPost?.workType ? jobPost.workType.charAt(0).toUpperCase() + jobPost.workType.slice(1) : "Remote"}
                  </span>
                  <span>
                    {formatDate(jobPost?.createdAt)}
                  </span>
                </div>
                {jobPost?.skills && jobPost.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {jobPost.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {jobPost.skills.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{jobPost.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Discussions Section */}
      {results.discussions?.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100">
            <MessageSquare size={16} className="inline mr-2" />
            Discussions ({results.discussions.length})
          </h3>
          {results.discussions.map((discussion) => (
            <Link
              key={discussion._id}
              to={`/discussion/${discussion._id}`}
              onClick={onClose}
              className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <img
                src={discussion?.author?.profilePicture || "/avatar.png"}
                alt={discussion?.author?.name || "User"}
                className="w-10 h-10 rounded-full object-cover mr-3 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {discussion?.title || "Discussion"}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {discussion?.category || "General"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  by {discussion?.author?.name || "Unknown"} • {formatDate(discussion?.createdAt)}
                </p>
                <p className="text-sm text-gray-700 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                  {discussion?.content || ""}
                </p>
                {discussion?.tags && discussion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {discussion.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {discussion.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{discussion.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Events Section */}
      {results.events?.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100">
            <Calendar size={16} className="inline mr-2" />
            Events ({results.events.length})
          </h3>
          {results.events.map((event) => (
            <Link
              key={event._id}
              to={`/event/${event._id}`}
              onClick={onClose}
              className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <img
                src={event.organizer?.profilePicture || "/avatar.png"}
                alt={event.organizer?.name || "Event"}
                className="w-10 h-10 rounded-full object-cover mr-3 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {event?.title || "Event"}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    event?.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                    event?.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                    event?.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event?.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "Upcoming"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {event?.type || "Event"} • {event?.location || 'Online'}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(event?.eventDate)}
                  </span>
                  {event?.startTime && (
                    <span>
                      {event.startTime}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 overflow-hidden mt-1" style={{display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical'}}>
                  {event?.description || ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;