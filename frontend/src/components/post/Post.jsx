import { useQueryClient, useMutation, mutationOptions } from "@tanstack/react-query"
import { useState, useRef, useEffect } from "react"
import { axiosInstance } from "../../lib/axios"
import toast from "react-hot-toast"
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom"
import { 
  Heart, 
  Loader, 
  MessageCircle, 
  Send, 
  Share2, 
  Trash2, 
  X, 
  Edit, 
  Check, 
  Image as ImageIcon,
  HeartOff,
  Reply as ReplyIcon,
  ChevronDown,
  ChevronRight as ChevronRightIcon
} from "lucide-react"
import PostAction from "./PostAction"
import { formatDistanceToNow } from "date-fns"

const Post = ({ post, isDetailView = false, commentIdToExpand = null }) => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [commentSortOrder, setCommentSortOrder] = useState("newest")
  const [expandedComments, setExpandedComments] = useState(new Set())
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [newReply, setNewReply] = useState("")
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editingReplyContent, setEditingReplyContent] = useState('')
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editPostContent, setEditPostContent] = useState(post.content || "")
  const [editPostImage, setEditPostImage] = useState(null)
  const [showEditError, setShowEditError] = useState(false)
  const [imageMaxHeight, setImageMaxHeight] = useState(null)
  const [isImageTall, setIsImageTall] = useState(false)
  const fileInputRef = useRef(null)
  const imageContainerRef = useRef(null)
  const isOwner = authUser._id === post.author._id
  const isLiked = post.likes.includes(authUser._id)

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

  // Format numbers with K notation
  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    }
    return count
  }

  // Get total comment count including replies
  const getTotalCommentCount = () => {
    if (!post.comments) return 0
    let total = post.comments.length
    post.comments.forEach(comment => {
      if (comment.replies) {
        total += comment.replies.length
      }
    })
    return total
  }

  // Sort comments based on selected order
  const getSortedComments = () => {
    if (!post.comments) return []
    
    const commentsCopy = [...post.comments]
    
    switch (commentSortOrder) {
      case 'topLiked':
        return commentsCopy.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      case 'oldest':
        return commentsCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      case 'newest':
      default:
        return commentsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  }

  // Handle URL-based comment/reply highlighting from notifications
  useEffect(() => {
    const commentId = searchParams.get('comment')
    const replyId = searchParams.get('reply')
    
    if (post && (commentId || replyId)) {
      setShowComments(true)
      
      if (replyId && commentId) {
        setExpandedComments(prev => new Set(prev).add(commentId))
      }
      
      setTimeout(() => {
        const targetId = replyId || commentId
        const element = document.getElementById(targetId)
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          let contentBox
          if (replyId) {
            contentBox = element.querySelector('.bg-gray-100')
          } else {
            const children = element.children
            for (let child of children) {
              if (child.classList.contains('flex-1')) {
                contentBox = child.querySelector('.bg-gray-50')
                break
              }
            }
          }
          
          if (contentBox) {
            const originalBgClass = contentBox.className
            contentBox.className = contentBox.className.replace(/bg-gray-\d+/, 'bg-yellow-100')
            
            setTimeout(() => {
              contentBox.className = originalBgClass
            }, 2000)
          }
        }
      }, 300)
    }
  }, [post, searchParams])

  useEffect(() => {
    const updateImageMaxHeight = () => {
      if (imageContainerRef.current) {
        const containerWidth = imageContainerRef.current.offsetWidth
        setImageMaxHeight(containerWidth)
      }
    }

    const checkImageAspectRatio = () => {
      if (post.image) {
        const img = new Image()
        img.onload = () => {
          setIsImageTall(img.height > img.width)
        }
        img.src = post.image
      }
    }

    updateImageMaxHeight()
    checkImageAspectRatio()
    window.addEventListener('resize', updateImageMaxHeight)

    return () => {
      window.removeEventListener('resize', updateImageMaxHeight)
    }
  }, [post.image])

  const { mutate: deletePost, isPending:isDeletingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/posts/delete/${ post._id }`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      toast.success("Post deleted successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to delete a post")
    }
  })

  const { mutate: editPost, isPending: isEditingPostMutation } = useMutation({
    mutationFn: async ({ content, image }) => {
      const payload = { content }
      if (image === "REMOVE_IMAGE") {
        payload.image = null // Explicitly remove image
      } else if (image) {
        payload.image = image // Update with new image
      }
      await axiosInstance.put(`/posts/edit/${post._id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      setIsEditingPost(false)
      setEditPostContent("")
      setEditPostImage(null)
      toast.success("Post updated successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to update post")
    }
  })

  const { mutate: createComment, isPending:isCreatingComment } = useMutation({
    mutationFn: async (newComment) => {
      const res = await axiosInstance.post(`/posts/${ post._id }/comment`, { content: newComment })
      return res.data
    },
    onSuccess: (data) => {
      setNewComment("");
      toast.success("Comment added successfully");
      
      // Clear URL parameters to prevent double highlighting
      if (searchParams.get('comment') || searchParams.get('reply')) {
        navigate(`/post/${post._id}`, { replace: true });
      }
      
      setShowComments(true);
      
      // Highlight the new comment after data refreshes
      if (data.comments && data.comments.length > 0) {
        const newComment = data.comments[data.comments.length - 1];
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["post", post._id] });
        
        // Wait for the queries to refetch and DOM to update
        setTimeout(() => {
          const element = document.getElementById(newComment._id);
          if (element) {
            // Scroll to the element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Find and highlight the comment box (look for .bg-gray-50 within flex-1 child)
            const children = element.children;
            for (let child of children) {
              if (child.classList.contains('flex-1')) {
                const contentBox = child.querySelector('.bg-gray-50');
                if (contentBox) {
                  const originalBgClass = contentBox.className;
                  contentBox.className = contentBox.className.replace(/bg-gray-\d+/, 'bg-yellow-100');
                  
                  setTimeout(() => {
                    contentBox.className = originalBgClass;
                  }, 2000);
                }
                break;
              }
            }
          }
        }, 300);
      }
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to add a comment")
    }
  })

  // Remove comment mutation
  const { mutate: removeComment, isPending: isRemovingComment } = useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.delete(`/posts/${post._id}/comment/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success("Comment deleted successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to delete comment")
    }
  })

  // Edit comment mutation
  const { mutate: editComment, isPending: isEditingComment } = useMutation({
    mutationFn: async ({ commentId, content }) => {
      await axiosInstance.put(`/posts/${post._id}/comment/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      setEditingCommentId(null)
      setEditingCommentContent('')
      toast.success("Comment updated successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to update comment")
    }
  })

  // Create reply mutation
  const { mutate: createReply, isPending: isCreatingReply } = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const res = await axiosInstance.post(`/posts/${post._id}/comment/${commentId}/reply`, { content })
      return res.data
    },
    onSuccess: ({ data, commentId }) => {
      setReplyingToCommentId(null)
      setNewReply("")
      toast.success("Reply added successfully")
      
      // Clear URL parameters to prevent double highlighting
      if (searchParams.get('comment') || searchParams.get('reply')) {
        navigate(`/post/${post._id}`, { replace: true })
      }
      
      // Ensure comments section is open
      setShowComments(true)
      
      // Highlight the new reply after data refreshes
      if (data.comments) {
        const comment = data.comments.find(c => c._id === commentId)
        if (comment && comment.replies && comment.replies.length > 0) {
          const newReply = comment.replies[comment.replies.length - 1]
          
          // Expand the replies section first
          setExpandedComments(prev => new Set(prev).add(commentId))
          
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ["posts"] })
          queryClient.invalidateQueries({ queryKey: ["post", post._id] })
          
          // Wait for the queries to refetch and DOM to update
          setTimeout(() => {
            const element = document.getElementById(newReply._id)
            if (element) {
              // Scroll to the element
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              
              // Find and highlight the reply box (bg-gray-100 for replies)
              const contentBox = element.querySelector('.bg-gray-100')
              if (contentBox) {
                const originalBgClass = contentBox.className
                contentBox.className = contentBox.className.replace(/bg-gray-\d+/, 'bg-yellow-100')
                
                setTimeout(() => {
                  contentBox.className = originalBgClass
                }, 2000)
              }
            }
          }, 300)
        }
      }
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to add reply")
    }
  })

  // Delete reply mutation
  const { mutate: deleteReply, isPending: isDeletingReply } = useMutation({
    mutationFn: async ({ commentId, replyId }) => {
      await axiosInstance.delete(`/posts/${post._id}/comment/${commentId}/reply/${replyId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success("Reply deleted successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to delete reply")
    }
  })

  // Edit reply mutation
  const { mutate: editReply, isPending: isEditingReply } = useMutation({
    mutationFn: async ({ commentId, replyId, content }) => {
      await axiosInstance.put(`/posts/${post._id}/comment/${commentId}/reply/${replyId}`, { content })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      setEditingReplyId(null)
      setEditingReplyContent('')
      toast.success("Reply updated successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to update reply")
    }
  })

  // Like comment mutation
  const { mutate: likeComment } = useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.post(`/posts/${post._id}/comment/${commentId}/like`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to like comment")
    }
  })

  // Dislike comment mutation
  const { mutate: dislikeComment } = useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.post(`/posts/${post._id}/comment/${commentId}/dislike`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to dislike comment")
    }
  })

  const { mutate: likePost, isPending:isLikingPost } = useMutation({
    mutationFn: async() => {
      await axiosInstance.post(`/posts/${ post._id }/like`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to like a post")
    }
  })

  const handleDeletePost = () => {
    if(!window.confirm("Are you sure you want to delete this post?")) return
    deletePost()
  }

  const handleEditPost = () => {
    setIsEditingPost(true)
    setEditPostContent(post.content || "")
  }

  const handleCancelPostEdit = () => {
    setIsEditingPost(false)
    setEditPostContent(post.content || "")
    setEditPostImage(null)
    setShowEditError(false)
  }

  const handleSavePostEdit = (e) => {
    e.preventDefault()
    
    // Validation: require at least content or image
    const hasContent = editPostContent.trim()
    // Check if there's an image: either a new image was uploaded, or the original image exists and wasn't removed
    const hasImage = (editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && post.image)
    
    if (!hasContent && !hasImage) {
      setShowEditError(true)
      return
    }
    
    editPost({ content: editPostContent, image: editPostImage })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setEditPostImage(reader.result)
        setShowEditError(false) // Clear error when image is added
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setEditPostImage("REMOVE_IMAGE") // Special flag to indicate image removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleLikePost = async () => {
    if (isLikingPost) return
    likePost()
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if(newComment.trim()) {
      createComment(newComment)
    }
  }

  const handleSharePost = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`)
    toast.success('Link copied to clipboard!')
  }

  const handleReplyToComment = (commentId, username) => {
    setReplyingToCommentId(commentId)
    setNewReply(`@${username} `)
  }

  const handleReplyToReply = (commentId, username) => {
    setReplyingToCommentId(commentId)
    setNewReply(`@${username} `)
  }

  const toggleReplies = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }


  return (
    <div className='bg-white rounded-lg shadow hover:shadow-md transition-shadow mb-4'>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-3 flex-1'>
            <Link to={`/profile/${post?.author?.username}`}>
              <img 
                src={post.author.profilePicture || "/avatar.png"} 
                alt={post.author.name} 
                className="w-12 h-12 rounded-full object-cover" 
              />
            </Link>
            <div className="flex-1">
              <Link to={`/profile/${post?.author?.username}`}>
                <h3 className='font-semibold hover:underline'>
                  {post.author.name}
                  <span className="text-gray-500 font-normal ml-1">@{post.author.username}</span>
                </h3>
              </Link>
              <p className='text-sm text-gray-500'>{post.author.headline}</p>
              <p className='text-xs text-gray-400'>
                <Link to={`/post/${post._id}`}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  {post.editedAt && <span className="ml-1">(edited)</span>}
              </Link>
              </p>
            </div>
          </div>
        
          <div className='flex items-center gap-2'>
            {isOwner && (
              <>
                <button 
                  onClick={handleEditPost} 
                  disabled={isEditingPost}
                  className="text-green-600 hover:bg-green-50 p-2 rounded transition-colors disabled:opacity-50"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={handleDeletePost} 
                  disabled={isDeletingPost}
                  className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50"
                >
                  {isDeletingPost ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {isEditingPost ? (
          <form onSubmit={handleSavePostEdit} className="space-y-4 px-4">
            <div>
              <textarea
                value={editPostContent}
                onChange={(e) => {
                  setEditPostContent(e.target.value)
                  if (e.target.value.trim()) setShowEditError(false) // Clear error when typing
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && post.image))
                    ? 'border-2 border-red-500' 
                    : 'border-gray-300'
                }`}
                rows={3}
                placeholder="What's on your mind?"
              />
              {showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && post.image)) && (
                <p className="text-red-500 text-sm mt-1">Content is required if no image is provided</p>
              )}
            </div>
            
            {/* Image upload */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && post.image))
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ImageIcon size={18} />
                  <span>Photo</span>
                </button>
                {showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && post.image)) && (
                  <p className="text-red-500 text-sm mt-1">Or add a photo</p>
                )}
              </div>
              
              {(editPostImage !== "REMOVE_IMAGE" && (editPostImage || post.image)) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Image preview */}
            {editPostImage && editPostImage !== "REMOVE_IMAGE" && (
              <div className="relative w-full aspect-square bg-gray-100">
                <img 
                  src={editPostImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Show current image if no new image is selected and not marked for removal */}
            {!editPostImage && post.image && (
              <div className="relative w-full aspect-square bg-gray-100">
                <img 
                  src={post.image} 
                  alt="Current image" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelPostEdit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditingPostMutation}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isEditingPostMutation ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            {post.content && (
              <p className="text-gray-700 px-4 pt-4 pb-4">{post.content}</p>
            )}
            {post.image && (
              <div ref={imageContainerRef} className="relative w-full aspect-square bg-gray-100">
                <img 
                  src={post.image} 
                  alt="Post content" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}  
      <div className='px-4 py-3 border-t flex items-center justify-between'>
        <button
          onClick={handleLikePost}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm min-w-[20px] text-left">{formatCount(post.likes?.length || 0)}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className='flex items-center gap-2 text-gray-600 hover:text-primary transition-colors'
        >
          <MessageCircle size={20} />
          <span className="text-sm min-w-[20px] text-left">{formatCount(getTotalCommentCount())}</span>
        </button>
        
        <button
          onClick={handleSharePost}
          className='flex items-center gap-2 text-gray-600 hover:text-primary transition-colors'
          title="Share post"
        >
          <Share2 size={20} />
          <span className="text-sm min-w-[20px] text-left">0</span>
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="pt-4 border-t border-gray-200 px-4 pb-4">
          {/* Comment Header with Sort */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {formatCount(getTotalCommentCount())} {getTotalCommentCount() === 1 ? 'Comment' : 'Comments'}
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

          {/* Add Comment Form */}
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
              const isCommentOwner = comment.user._id === authUser._id
              const isEditingComment = editingCommentId === comment._id
              const isCommentExpanded = expandedComments.has(comment._id)
              const repliesCount = comment.replies?.length || 0
              
              return (
                <div key={comment._id} id={comment._id} className="flex gap-3">
                  <Link to={`/profile/${comment.user.username}`}>
                    <img
                      src={comment.user.profilePicture || "/avatar.png"}
                      alt={comment.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3 transition-colors duration-500">
                        <div className="flex items-center justify-between mb-1">
                          <Link to={`/profile/${comment.user.username}`}>
                            <h4 className="font-medium text-gray-900 hover:underline">
                              {comment.user.name}
                              <span className="text-gray-500 font-normal text-sm ml-1">@{comment.user.username}</span>
                            </h4>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              {comment.editedAt && ' (edited)'}
                            </span>
                            {isCommentOwner && !isEditingComment && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment._id)
                                    setEditingCommentContent(comment.content)
                                  }}
                                  className="p-1 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                  title="Edit comment"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => removeComment(comment._id)}
                                  disabled={isRemovingComment}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                  title="Delete comment"
                                >
                                  {isRemovingComment ? (
                                    <Loader className="animate-spin" size={12} />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditingComment ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              if (!editingCommentContent.trim()) return
                              editComment({ commentId: comment._id, content: editingCommentContent })
                            }}
                            className="space-y-2"
                          >
                            <textarea
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded resize-none text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null)
                                  setEditingCommentContent('')
                                }}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isEditingComment || !editingCommentContent.trim()}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                              >
                                {isEditingComment ? (
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
                                className={`flex items-center gap-1 text-xs ${comment.likes?.includes(authUser._id) ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
                              >
                                <Heart size={14} fill={comment.likes?.includes(authUser._id) ? 'currentColor' : 'none'} />
                                <span className="min-w-[16px] text-left">{formatCount(comment.likes?.length || 0)}</span>
                              </button>
                              <button
                                onClick={() => dislikeComment(comment._id)}
                                className={`flex items-center gap-1 text-xs ${comment.dislikes?.includes(authUser._id) ? 'text-blue-500' : 'text-gray-600'} hover:text-blue-500 transition-colors`}
                              >
                                <HeartOff size={14} fill={comment.dislikes?.includes(authUser._id) ? 'currentColor' : 'none'} />
                                <span className="min-w-[16px] text-left">{formatCount(comment.dislikes?.length || 0)}</span>
                              </button>
                              <button
                                onClick={() => handleReplyToComment(comment._id, comment.user.username)}
                                className="text-xs text-primary hover:text-red-700 flex items-center gap-1"
                              >
                                <ReplyIcon size={12} />
                                Reply
                              </button>
                            </div>
                            {repliesCount > 0 && (
                              <button
                                onClick={() => toggleReplies(comment._id)}
                                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 mt-1"
                              >
                                {isCommentExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRightIcon size={14} />
                                )}
                                {formatCount(repliesCount)} {repliesCount === 1 ? 'reply' : 'replies'}
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Replies */}
                      {repliesCount > 0 && isCommentExpanded && (
                        <div className="mt-2 ml-4 space-y-2">
                          {comment.replies?.map((reply) => {
                            const isReplyOwner = reply.user._id === authUser._id
                            const isEditingReply = editingReplyId === reply._id
                            
                            return (
                              <div key={reply._id} id={reply._id} className="flex gap-2">
                                <Link to={`/profile/${reply.user.username}`}>
                                  <img
                                    src={reply.user.profilePicture || "/avatar.png"}
                                    alt={reply.user.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                </Link>
                                <div className="flex-1 bg-gray-100 rounded-lg p-2 transition-colors duration-500">
                                  <div className="flex items-center justify-between mb-1">
                                    <Link to={`/profile/${reply.user.username}`}>
                                      <h5 className="font-medium text-sm text-gray-900 hover:underline">
                                        {reply.user.name}
                                        <span className="text-gray-500 font-normal text-xs ml-1">@{reply.user.username}</span>
                                      </h5>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                        {reply.editedAt && ' (edited)'}
                                      </span>
                                      {isReplyOwner && !isEditingReply && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingReplyId(reply._id)
                                              setEditingReplyContent(reply.content)
                                            }}
                                            className="p-1 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                            title="Edit reply"
                                          >
                                            <Edit size={10} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (window.confirm("Are you sure you want to delete this reply?")) {
                                                deleteReply({ commentId: comment._id, replyId: reply._id })
                                              }
                                            }}
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
                                  {isEditingReply ? (
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault()
                                        if (!editingReplyContent.trim()) return
                                        editReply({ 
                                          commentId: comment._id, 
                                          replyId: reply._id, 
                                          content: editingReplyContent 
                                        })
                                      }}
                                      className="space-y-2"
                                    >
                                      <textarea
                                        value={editingReplyContent}
                                        onChange={(e) => setEditingReplyContent(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded resize-none text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
                                        rows={2}
                                        autoFocus
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingReplyId(null)
                                            setEditingReplyContent('')
                                          }}
                                          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          disabled={isEditingReply || !editingReplyContent.trim()}
                                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                        >
                                          {isEditingReply ? (
                                            <Loader className="animate-spin" size={10} />
                                          ) : (
                                            <Check size={10} />
                                          )}
                                          Save
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <p className="text-gray-700 text-xs">{renderTextWithMentions(reply.content)}</p>
                                      <button
                                        onClick={() => handleReplyToReply(comment._id, reply.user.username)}
                                        className="mt-1 text-xs text-primary hover:text-red-700 flex items-center gap-1"
                                      >
                                        <ReplyIcon size={10} />
                                        Reply
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Reply Input */}
                      {replyingToCommentId === comment._id && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (!newReply.trim()) return
                            createReply({ commentId: comment._id, content: newReply })
                          }}
                          className="mt-2 ml-4"
                        >
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
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Post