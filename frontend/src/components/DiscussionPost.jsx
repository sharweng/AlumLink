import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Trash2, 
  Edit, 
  FileText,
  Download,
  Tag,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DiscussionPost = ({ discussion, isDetailView = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [showComments, setShowComments] = useState(isDetailView);
  const [newComment, setNewComment] = useState("");
  
  const isOwner = authUser?._id === discussion.author._id;
  const isLiked = discussion.likes?.includes(authUser?._id);

  const { mutate: deleteDiscussion, isPending: isDeletingDiscussion } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/discussions/${discussion._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      toast.success("Discussion deleted successfully");
      if (isDetailView) {
        navigate("/forums");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete discussion");
    },
  });

  const { mutate: likeDiscussion } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/discussions/${discussion._id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like discussion");
    },
  });

  const { mutate: createComment, isPending: isCreatingComment } = useMutation({
    mutationFn: async (content) => {
      await axiosInstance.post(`/discussions/${discussion._id}/comment`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      setNewComment("");
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add comment");
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      createComment(newComment);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      General: 'bg-blue-100 text-blue-800',
      Technical: 'bg-purple-100 text-purple-800',
      Career: 'bg-green-100 text-green-800',
      Events: 'bg-yellow-100 text-yellow-800',
      Help: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Link to={`/profile/${discussion.author?.username}`}>
              <img
                src={discussion.author?.profilePicture || "/avatar.png"}
                alt={discussion.author?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            </Link>
            <div className="flex-1">
              <Link to={`/profile/${discussion.author?.username}`}>
                <h3 className="font-semibold hover:underline">{discussion.author?.name}</h3>
              </Link>
              <p className="text-sm text-gray-500">{discussion.author?.headline}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                </span>
                {discussion.editedAt && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/forums/${discussion._id}/edit`)}
                className="text-blue-600 hover:bg-blue-50 p-2 rounded"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this discussion?")) {
                    deleteDiscussion();
                  }
                }}
                disabled={isDeletingDiscussion}
                className="text-red-600 hover:bg-red-50 p-2 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Category */}
        <div className="mb-3">
          <div className="flex items-start gap-2 mb-2">
            <Link to={`/forums/${discussion._id}`} className="flex-1">
              <h2 className="text-xl font-bold hover:text-primary cursor-pointer">
                {discussion.title}
              </h2>
            </Link>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(discussion.category)}`}>
              {discussion.category}
            </span>
          </div>
          
          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {discussion.tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Discussion Content */}
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{discussion.content}</p>

        {/* Images */}
        {discussion.images && discussion.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {discussion.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Discussion image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Files */}
        {discussion.files && discussion.files.length > 0 && (
          <div className="mb-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Attachments:</h4>
            {discussion.files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="text-primary" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  {file.size && (
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
                <Download size={18} className="text-gray-400" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t flex items-center gap-6">
        <button
          onClick={() => likeDiscussion()}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm">{discussion.likes?.length || 0}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-sm">{discussion.comments?.length || 0}</span>
        </button>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Eye size={20} />
          <span className="text-sm">{discussion.views || 0}</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t p-4 bg-gray-50">
          {/* Comment Input */}
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <button
              onClick={handleAddComment}
              disabled={isCreatingComment || !newComment.trim()}
              className="mt-2 btn btn-primary btn-sm"
            >
              {isCreatingComment ? "Posting..." : "Post Comment"}
            </button>
          </div>

          {/* Comments List */}
          {discussion.comments && discussion.comments.length > 0 && (
            <div className="space-y-3">
              {discussion.comments.map((comment) => (
                <div key={comment._id} className="bg-white p-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${comment.user?.username}`}>
                      <img
                        src={comment.user?.profilePicture || "/avatar.png"}
                        alt={comment.user?.name}
                        className="w-8 h-8 rounded-full"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/profile/${comment.user?.username}`}>
                        <p className="font-semibold text-sm hover:underline">
                          {comment.user?.name}
                        </p>
                      </Link>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscussionPost;
