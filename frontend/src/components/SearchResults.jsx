import { Link } from "react-router-dom";
import { User, FileText, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { formatDate } from "../utils/dateUtils";

const SearchResults = ({ results, isLoading, query, onClose }) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4 z-50">
        <div className="text-center text-gray-500">Searching...</div>
      </div>
    );
  }

  if (!results || (!results.users?.length && !results.posts?.length)) {
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
            People ({results.users.length})
          </h3>
          {results.users.map((user) => (
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
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
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
              to={`/profile/${post.author.username}`}
              onClick={onClose}
              className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <img
                src={post.author.profilePicture || "/avatar.png"}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover mr-3 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {post.author.name}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {post.author.headline}
                </p>
                <p className="text-sm text-gray-700 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                  {post.content}
                </p>
                {post.image && (
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
    </div>
  );
};

export default SearchResults;