import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trash2, 
  Edit, 
  FileText,
  Download,
  Tag,
  Loader,
  Send,
  Check,
  Reply as ReplyIcon,
  HeartOff,
  Image as ImageIcon,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DiscussionPost = ({ discussion, isDetailView = false, commentIdToExpand = null }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [showComments, setShowComments] = useState(isDetailView);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [commentSortOrder, setCommentSortOrder] = useState("newest"); // newest, oldest, topLiked
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(discussion.title || "");
  const [editContent, setEditContent] = useState(discussion.content || "");
  const [editCategory, setEditCategory] = useState(discussion.category || "General");
  const [editTags, setEditTags] = useState(discussion.tags || []);
  const [editTagInput, setEditTagInput] = useState("");
  const [editImages, setEditImages] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [editFileError, setEditFileError] = useState("");
  
  const isOwner = authUser?._id === discussion.author._id;
  const isLiked = discussion.likes?.includes(authUser?._id);

  // Auto-expand comment if commentIdToExpand is provided
  useEffect(() => {
    if (commentIdToExpand) {
      setShowComments(true);
      setExpandedComments(new Set([commentIdToExpand]));
    }
  }, [commentIdToExpand]);

  // Helper function to render text with @mentions highlighted
  const renderTextWithMentions = (text) => {
    if (!text) return null;
    
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Calculate total comment count including replies
  const getTotalCommentCount = () => {
    if (!discussion.comments) return 0;
    
    let total = discussion.comments.length;
    discussion.comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.length;
      }
    });
    return total;
  };

  // Sort comments based on selected order
  const getSortedComments = () => {
    if (!discussion.comments) return [];
    
    const comments = [...discussion.comments];
    
    switch (commentSortOrder) {
      case "newest":
        return comments.reverse(); // Newest first (reverse chronological)
      case "oldest":
        return comments; // Oldest first (chronological)
      case "topLiked":
        return comments.sort((a, b) => {
          const aLikes = (a.likes?.length || 0) - (a.dislikes?.length || 0);
          const bLikes = (b.likes?.length || 0) - (b.dislikes?.length || 0);
          
          // If net likes are equal, sort by newest first
          if (bLikes === aLikes) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          
          return bLikes - aLikes; // Sort by net likes (likes - dislikes)
        });
      default:
        return comments.reverse();
    }
  };

  const { mutate: updateDiscussion, isPending: isUpdatingDiscussion } = useMutation({
    mutationFn: async () => {
      // Validate file sizes before uploading (25MB limit)
      const maxFileSize = 25 * 1024 * 1024;
      const oversizedFiles = editFiles.filter(file => file.size > maxFileSize);
      if (oversizedFiles.length > 0) {
        throw new Error(`File "${oversizedFiles[0].name}" is larger than 25MB`);
      }

      const updateData = {
        title: editTitle,
        content: editContent,
        category: editCategory,
        tags: editTags,
        removedImages,
        removedFiles,
      };

      // Convert new images to base64
      if (editImages.length > 0) {
        const imageDataURLs = await Promise.all(
          editImages.map(img => readFileAsDataURL(img))
        );
        updateData.newImages = imageDataURLs;
      }

      // Convert new files to base64 with metadata
      if (editFiles.length > 0) {
        const fileData = await Promise.all(
          editFiles.map(async (file) => ({
            data: await readFileAsDataURL(file),
            name: file.name,
            type: file.type,
            size: file.size
          }))
        );
        updateData.newFiles = fileData;
      }

      const response = await axiosInstance.put(`/discussions/${discussion._id}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      setIsEditing(false);
      setEditImages([]);
      setEditImagePreviews([]);
      setEditFiles([]);
      setRemovedImages([]);
      setRemovedFiles([]);
      setEditFileError("");
      toast.success("Discussion updated successfully");
    },
    onError: (error) => {
      const errorMessage = error.message || error.response?.data?.message || "Failed to update discussion";
      setEditFileError(errorMessage);
      
      // Only show toast for non-file-size errors (file size errors already have visual indicators)
      if (!errorMessage.includes("larger than 25MB")) {
        toast.error(errorMessage);
      }
    },
  });

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
      const response = await axiosInstance.post(`/discussions/${discussion._id}/comment`, { content });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      setNewComment("");
      toast.success("Comment added successfully");
      
      // Get the newly created comment (last one in the array)
      if (data.comments && data.comments.length > 0) {
        const newComment = data.comments[data.comments.length - 1];
        // Navigate to the new comment
        navigate(`/discussion/${discussion._id}?comment=${newComment._id}`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add comment");
    },
  });

  const { mutate: deleteComment, isPending: isDeletingComment } = useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.delete(`/discussions/${discussion._id}/comment/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      toast.success("Comment deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    },
  });

  const { mutate: updateComment, isPending: isUpdatingComment } = useMutation({
    mutationFn: async ({ commentId, content }) => {
      await axiosInstance.put(`/discussions/${discussion._id}/comment/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      setEditingCommentId(null);
      setEditingCommentContent("");
      toast.success("Comment updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update comment");
    },
  });

  const { mutate: createReply, isPending: isCreatingReply } = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await axiosInstance.post(`/discussions/${discussion._id}/comment/${commentId}/reply`, { content });
      return { data: response.data, commentId };
    },
    onSuccess: ({ data, commentId }) => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      setReplyingToCommentId(null);
      setNewReply("");
      toast.success("Reply added successfully");
      
      // Find the comment and get the newly created reply
      if (data.comments) {
        const comment = data.comments.find(c => c._id === commentId);
        if (comment && comment.replies && comment.replies.length > 0) {
          const newReply = comment.replies[comment.replies.length - 1];
          // Navigate to the new reply
          navigate(`/discussion/${discussion._id}?comment=${commentId}&reply=${newReply._id}`);
        }
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add reply");
    },
  });

  const { mutate: deleteReply, isPending: isDeletingReply } = useMutation({
    mutationFn: async ({ commentId, replyId }) => {
      await axiosInstance.delete(`/discussions/${discussion._id}/comment/${commentId}/reply/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      toast.success("Reply deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete reply");
    },
  });

  const { mutate: updateReply, isPending: isUpdatingReply } = useMutation({
    mutationFn: async ({ commentId, replyId, content }) => {
      await axiosInstance.put(`/discussions/${discussion._id}/comment/${commentId}/reply/${replyId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
      setEditingReplyId(null);
      setEditingReplyContent("");
      toast.success("Reply updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update reply");
    },
  });

  const { mutate: likeComment } = useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.post(`/discussions/${discussion._id}/comment/${commentId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like comment");
    },
  });

  const { mutate: dislikeComment } = useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.post(`/discussions/${discussion._id}/comment/${commentId}/dislike`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussion._id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to dislike comment");
    },
  });

  // Helper function to read file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload for edit
  const handleEditImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setEditImages([...editImages, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      readFileAsDataURL(file).then(preview => {
        setEditImagePreviews(prev => [...prev, preview]);
      });
    });
  };

  // Handle file upload for edit
  const handleEditFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setEditFiles([...editFiles, ...selectedFiles]);
    // Clear error when new files are selected
    if (editFileError) {
      setEditFileError("");
    }
  };

  // Remove new image from edit
  const removeEditImage = (index) => {
    setEditImages(editImages.filter((_, i) => i !== index));
    setEditImagePreviews(editImagePreviews.filter((_, i) => i !== index));
  };

  // Remove new file from edit
  const removeEditFile = (index) => {
    const updatedFiles = editFiles.filter((_, i) => i !== index);
    setEditFiles(updatedFiles);
    
    // Clear error if all oversized files are removed
    const maxFileSize = 25 * 1024 * 1024;
    const hasOversizedFiles = updatedFiles.some(file => file.size > maxFileSize);
    if (!hasOversizedFiles) {
      setEditFileError("");
    }
  };

  // Mark existing image for removal
  const removeExistingImage = (imageUrl) => {
    setRemovedImages([...removedImages, imageUrl]);
  };

  // Mark existing file for removal
  const removeExistingFile = (fileUrl) => {
    setRemovedFiles([...removedFiles, fileUrl]);
  };

  // Add tag in edit mode
  const addEditTag = () => {
    const trimmedTag = editTagInput.trim();
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      setEditTags([...editTags, trimmedTag]);
      setEditTagInput("");
    }
  };

  // Remove tag in edit mode
  const removeEditTag = (tagToRemove) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input keydown in edit mode
  const handleEditTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEditTag();
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createComment(newComment);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentContent(comment.content);
  };

  const handleSaveCommentEdit = (e, commentId) => {
    e.preventDefault();
    if (editingCommentContent.trim()) {
      updateComment({ commentId, content: editingCommentContent });
    }
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleReplyToComment = (commentId, username) => {
    setReplyingToCommentId(commentId);
    setNewReply(`@${username} `);
  };

  const handleReplyToReply = (commentId, username) => {
    setReplyingToCommentId(commentId);
    setNewReply(`@${username} `);
  };

  const handleAddReply = (e, commentId) => {
    e.preventDefault();
    if (newReply.trim()) {
      createReply({ commentId, content: newReply });
    }
  };

  const handleEditReply = (reply) => {
    setEditingReplyId(reply._id);
    setEditingReplyContent(reply.content);
  };

  const handleSaveReplyEdit = (e, commentId, replyId) => {
    e.preventDefault();
    if (editingReplyContent.trim()) {
      updateReply({ commentId, replyId, content: editingReplyContent });
    }
  };

  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditingReplyContent("");
  };

  const toggleReplies = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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
                <h3 className="font-semibold hover:underline">
                  {discussion.author?.name}
                  <span className="text-gray-500 font-normal ml-1">@{discussion.author?.username}</span>
                </h3>
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
                onClick={() => setIsEditing(true)}
                className="text-green-600 hover:bg-green-50 p-2 rounded"
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
            {isDetailView ? (
              <h2 className="text-xl font-bold flex-1">
                {discussion.title}
              </h2>
            ) : (
              <Link to={`/discussion/${discussion._id}`} className="flex-1">
                <h2 className="text-xl font-bold hover:text-primary cursor-pointer">
                  {discussion.title}
                </h2>
              </Link>
            )}
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

        {/* Edit Form or Display Content */}
        {isEditing ? (
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Discussion title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What's on your mind?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Career">Career</option>
                <option value="Events">Events</option>
                <option value="Help">Help</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleEditTagInputKeyDown}
                />
                <button
                  type="button"
                  onClick={addEditTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <Tag size={14} />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeEditTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Images */}
            {discussion.images && discussion.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Images</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {discussion.images.filter(img => !removedImages.includes(img)).map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Images</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                  <ImageIcon size={20} />
                  <span className="text-sm">Choose Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              {editImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {editImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Files */}
            {discussion.files && discussion.files.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Files</label>
                <div className="space-y-2">
                  {discussion.files.filter(file => !removedFiles.includes(file.url)).map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingFile(file.url)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Files</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <FileText size={20} />
                  <span className="text-sm">Choose Files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleEditFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              {editFiles.length > 0 && (
                <div className={`space-y-2 mt-2 ${editFileError ? 'border-2 border-red-500 rounded-lg p-2' : ''}`}>
                  {editFiles.map((file, index) => {
                    const fileSizeMB = file.size / (1024 * 1024);
                    const isOversized = fileSizeMB > 25;
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 rounded-lg group ${
                          isOversized ? 'bg-red-50 border border-red-300' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <FileText size={16} className={isOversized ? "text-red-500" : "text-gray-500"} />
                          <span className={`text-sm truncate ${isOversized ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                            {file.name}
                          </span>
                          <span className={`text-xs ${isOversized ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            ({fileSizeMB >= 1 
                              ? `${fileSizeMB.toFixed(2)} MB` 
                              : `${(file.size / 1024).toFixed(1)} KB`}
                            {isOversized && ' - Too large!'})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditFile(index)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {editFileError && (
                <p className="text-red-500 text-sm mt-1">{editFileError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => updateDiscussion()}
                disabled={isUpdatingDiscussion || !editTitle.trim() || !editContent.trim()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {isUpdatingDiscussion ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(discussion.title);
                  setEditContent(discussion.content);
                  setEditCategory(discussion.category);
                  setEditTags(discussion.tags);
                  setEditTagInput("");
                  setEditImages([]);
                  setEditImagePreviews([]);
                  setEditFiles([]);
                  setRemovedImages([]);
                  setRemovedFiles([]);
                  setEditFileError("");
                }}
                disabled={isUpdatingDiscussion}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Discussion Content */}
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{discussion.content}</p>

            {/* Images - Full view in detail, count in list */}
          </>
        )}

        {!isEditing && (
          <>
        {/* Images - Full view in detail, count in list */}
        {discussion.images && discussion.images.length > 0 && (
          isDetailView ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {discussion.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Discussion image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon size={16} />
              <span>{discussion.images.length} {discussion.images.length === 1 ? 'image' : 'images'} attached</span>
            </div>
          )
        )}

        {/* Files - Full view in detail, count in list */}
        {discussion.files && discussion.files.length > 0 && (
          isDetailView ? (
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
          ) : (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
              <FileText size={16} />
              <span>{discussion.files.length} {discussion.files.length === 1 ? 'file' : 'files'} attached</span>
            </div>
          )
        )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t flex items-center gap-6">
        <button
          onClick={() => likeDiscussion()}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm min-w-[20px] text-left">{discussion.likes?.length || 0}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-sm min-w-[20px] text-left">{getTotalCommentCount()}</span>
        </button>
        
        <button
          onClick={() => {
            // Share functionality will be implemented later
            console.log("Share clicked");
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          title="Share discussion"
        >
          <Share2 size={20} />
          <span className="text-sm">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 px-4 pb-4">
          {/* Sort Options */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {getTotalCommentCount()} {getTotalCommentCount() === 1 ? 'Comment' : 'Comments'}
            </h3>
            <select
              value={commentSortOrder}
              onChange={(e) => setCommentSortOrder(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="topLiked">Top Liked</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Add Comment */}
          <form onSubmit={handleAddComment} className="mb-4">
            <div className="flex gap-3">
              <img
                src={authUser?.profilePicture || "/avatar.png"}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingComment || !newComment.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isCreatingComment ? (
                      <Loader className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {getSortedComments().map((comment) => {
              const isCommentOwner = comment.user?._id === authUser?._id;
              const isEditingThisComment = editingCommentId === comment._id;
              
              return (
                <div key={comment._id} id={comment._id} className="flex gap-3">
                  <Link to={`/profile/${comment.user?.username}`}>
                    <img
                      src={comment.user?.profilePicture || "/avatar.png"}
                      alt={comment.user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3 transition-colors duration-500">
                      <div className="flex items-center justify-between mb-1">
                        <Link to={`/profile/${comment.user?.username}`}>
                          <h4 className="font-medium text-gray-900 hover:underline">
                            {comment.user?.name}
                            <span className="text-gray-500 font-normal text-sm ml-1">@{comment.user?.username}</span>
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            {comment.editedAt && ' (edited)'}
                          </span>
                          {isCommentOwner && !isEditingThisComment && (
                            <>
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="p-1 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                title="Edit comment"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => deleteComment(comment._id)}
                                disabled={isDeletingComment}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                title="Delete comment"
                              >
                                {isDeletingComment ? (
                                  <Loader className="animate-spin" size={12} />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {isEditingThisComment ? (
                        <form onSubmit={(e) => handleSaveCommentEdit(e, comment._id)} className="space-y-2">
                          <textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded resize-none text-sm"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={handleCancelCommentEdit}
                              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isUpdatingComment || !editingCommentContent.trim()}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                            >
                              {isUpdatingComment ? (
                                <Loader className="animate-spin" size={12} />
                              ) : (
                                <Check size={12} />
                              )}
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="text-gray-700 text-sm">{renderTextWithMentions(comment.content)}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => likeComment(comment._id)}
                              className={`flex items-center gap-1 text-xs ${comment.likes?.includes(authUser?._id) ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
                            >
                              <Heart size={14} fill={comment.likes?.includes(authUser?._id) ? 'currentColor' : 'none'} />
                              <span className="min-w-[16px] text-left">{comment.likes?.length || 0}</span>
                            </button>
                            <button
                              onClick={() => dislikeComment(comment._id)}
                              className={`flex items-center gap-1 text-xs ${comment.dislikes?.includes(authUser?._id) ? 'text-blue-500' : 'text-gray-600'} hover:text-blue-500 transition-colors`}
                            >
                              <HeartOff size={14} fill={comment.dislikes?.includes(authUser?._id) ? 'currentColor' : 'none'} />
                              <span className="min-w-[16px] text-left">{comment.dislikes?.length || 0}</span>
                            </button>
                            <button
                              onClick={() => handleReplyToComment(comment._id, comment.user?.username)}
                              className="text-xs text-primary hover:text-red-700 flex items-center gap-1"
                            >
                              <ReplyIcon size={12} />
                              Reply
                            </button>
                          </div>
                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment._id)}
                              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 mt-1"
                            >
                              {expandedComments.has(comment._id) ? '▼ ' : '▶ '} 
                              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && expandedComments.has(comment._id) && (
                      <div className="mt-2 ml-4 space-y-2">
                        {comment.replies.map((reply) => {
                          const isReplyOwner = reply.user?._id === authUser?._id;
                          const isEditingThisReply = editingReplyId === reply._id;
                          
                          return (
                            <div key={reply._id} id={reply._id} className="flex gap-2">
                              <Link to={`/profile/${reply.user?.username}`}>
                                <img
                                  src={reply.user?.profilePicture || "/avatar.png"}
                                  alt={reply.user?.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              </Link>
                              <div className="flex-1 bg-gray-100 rounded-lg p-2 transition-colors duration-500">
                                <div className="flex items-center justify-between mb-1">
                                  <Link to={`/profile/${reply.user?.username}`}>
                                    <h5 className="font-medium text-sm text-gray-900 hover:underline">
                                      {reply.user?.name}
                                      <span className="text-gray-500 font-normal text-xs ml-1">@{reply.user?.username}</span>
                                    </h5>
                                  </Link>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                      {reply.editedAt && ' (edited)'}
                                    </span>
                                    {isReplyOwner && !isEditingThisReply && (
                                      <>
                                        <button
                                          onClick={() => handleEditReply(reply)}
                                          className="p-1 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                          title="Edit reply"
                                        >
                                          <Edit size={10} />
                                        </button>
                                        <button
                                          onClick={() => deleteReply({ commentId: comment._id, replyId: reply._id })}
                                          disabled={isDeletingReply}
                                          className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                          title="Delete reply"
                                        >
                                          {isDeletingReply ? (
                                            <Loader className="animate-spin" size={10} />
                                          ) : (
                                            <Trash2 size={10} />
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isEditingThisReply ? (
                                  <form onSubmit={(e) => handleSaveReplyEdit(e, comment._id, reply._id)} className="space-y-2">
                                    <textarea
                                      value={editingReplyContent}
                                      onChange={(e) => setEditingReplyContent(e.target.value)}
                                      className="w-full p-2 border border-gray-300 rounded resize-none text-xs"
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        type="button"
                                        onClick={handleCancelReplyEdit}
                                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isUpdatingReply || !editingReplyContent.trim()}
                                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {isUpdatingReply ? (
                                          <Loader className="animate-spin" size={10} />
                                        ) : (
                                          <Check size={10} />
                                        )}
                                        Save
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <p className="text-gray-700 text-xs">{renderTextWithMentions(reply.content)}</p>
                                )}
                                {/* Reply to Reply button */}
                                {!isEditingThisReply && (
                                  <button
                                    onClick={() => handleReplyToReply(comment._id, reply.user?.username)}
                                    className="mt-1 text-xs text-primary hover:text-red-700 flex items-center gap-1"
                                  >
                                    <ReplyIcon size={10} />
                                    Reply
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingToCommentId === comment._id && (
                      <form onSubmit={(e) => handleAddReply(e, comment._id)} className="mt-2 ml-4">
                        <div className="flex gap-2">
                          <img
                            src={authUser?.profilePicture || "/avatar.png"}
                            alt="Your avatar"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                autoFocus
                              />
                              <button
                                type="submit"
                                disabled={isCreatingReply || !newReply.trim()}
                                className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                              >
                                {isCreatingReply ? (
                                  <Loader className="animate-spin" size={14} />
                                ) : (
                                  <Send size={14} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyingToCommentId(null)}
                                className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default DiscussionPost;
