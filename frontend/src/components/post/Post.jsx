import { useQueryClient, useMutation } from "@tanstack/react-query"
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
  ChevronRight as ChevronRightIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  CircleCheck
} from "lucide-react"
import { MoreVertical, Flag } from 'lucide-react'
import PostAction from "./PostAction"
import { formatDistanceToNow } from "date-fns"
import ConfirmModal from "../common/ConfirmModal"
import ReportModal from '../common/ReportModal'

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
  const [newImages, setNewImages] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [showEditError, setShowEditError] = useState(false)
  const [imageMaxHeight, setImageMaxHeight] = useState(null)
  const [isImageTall, setIsImageTall] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false)
  const [showBanPostConfirm, setShowBanPostConfirm] = useState(false)
  const [showUnbanPostConfirm, setShowUnbanPostConfirm] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportSubTarget, setReportSubTarget] = useState(null)
  const [openCommentMenu, setOpenCommentMenu] = useState(null)
  const [openReplyMenu, setOpenReplyMenu] = useState(null)
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [showDeleteReplyConfirm, setShowDeleteReplyConfirm] = useState(false)
  const [replyToDelete, setReplyToDelete] = useState(null)
  // Moderation modal state for comments/replies
  const [showBanCommentConfirm, setShowBanCommentConfirm] = useState(false)
  const [showUnbanCommentConfirm, setShowUnbanCommentConfirm] = useState(false)
  const [moderationCommentId, setModerationCommentId] = useState(null)
  const [banCommentReason, setBanCommentReason] = useState("")
  const [showBanReplyConfirm, setShowBanReplyConfirm] = useState(false)
  const [showUnbanReplyConfirm, setShowUnbanReplyConfirm] = useState(false)
  const [moderationReply, setModerationReply] = useState(null) // { commentId, replyId }
  const [banReplyReason, setBanReplyReason] = useState("")
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

  // Report handled by ReportModal

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

    // Count only comments and replies that are not banned (exclude banned comments and their replies entirely)
    let total = 0
    post.comments.forEach(comment => {
      if (comment.banned) return // skip banned comment and its replies

      total += 1
      if (comment.replies) {
        // count only replies that are not banned
        total += comment.replies.filter(r => !r.banned).length
      }
    })

    return total
  }

  // Sort comments based on selected order
  const getSortedComments = () => {
    if (!post.comments) return []

    // Filter comments: include only those visible to user (not banned OR owner/admin)
    const visibleComments = post.comments.filter(c => {
      if (!c.banned) return true
      // if banned, only include if current user is admin or the comment owner
      return authUser?.role === 'admin' || authUser?._id === c.user._id
    })

    const commentsCopy = [...visibleComments]

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
      setShowDeletePostConfirm(false)
      toast.success("Post deleted successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to delete a post")
    }
  })

  const { mutate: editPost, isPending: isEditingPostMutation } = useMutation({
    mutationFn: async ({ content, image, removedImages, newImages }) => {
      const payload = { content }
      if (image === "REMOVE_IMAGE") {
        payload.image = null // Explicitly remove image
      } else if (image) {
        payload.image = image // Update with new image
      }
      if (removedImages && removedImages.length > 0) {
        payload.removedImages = removedImages
      }
      if (newImages && newImages.length > 0) {
        payload.newImages = newImages
      }
      await axiosInstance.put(`/posts/edit/${post._id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      setIsEditingPost(false)
      setEditPostContent("")
      setEditPostImage(null)
      setNewImages([])
      setNewImagePreviews([])
      setRemovedImages([])
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
      setShowDeleteCommentConfirm(false)
      setCommentToDelete(null)
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
      setShowDeleteReplyConfirm(false)
      setReplyToDelete(null)
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

  // Ban/Unban mutations for admin moderation
  const { mutate: banPostMutate, isPending:isBanningPost } = useMutation({
    mutationFn: async ({ reason } = {}) => {
      await axiosInstance.put(`/posts/${post._id}/ban`, { reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success('Post banned')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to ban post')
    }
  })

  const { mutate: unbanPostMutate, isPending:isUnbanningPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.put(`/posts/${post._id}/unban`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success('Post unbanned')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unban post')
    }
  })

  const { mutate: banCommentMutate, isLoading: isBanningComment } = useMutation({
    mutationFn: async ({ commentId, reason } = {}) => {
      await axiosInstance.put(`/posts/${post._id}/comment/${commentId}/ban`, { reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success('Comment banned')
    }
  })

  const { mutate: unbanCommentMutate, isLoading: isUnbanningComment } = useMutation({
    mutationFn: async ({ commentId }) => {
      await axiosInstance.put(`/posts/${post._id}/comment/${commentId}/unban`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success('Comment unbanned')
    }
  })

  const { mutate: banReplyMutate, isLoading: isBanningReply } = useMutation({
    mutationFn: async ({ commentId, replyId, reason } = {}) => {
      await axiosInstance.put(`/posts/${post._id}/comment/${commentId}/reply/${replyId}/ban`, { reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success('Reply banned')
    }
  })

  const { mutate: unbanReplyMutate, isLoading: isUnbanningReply } = useMutation({
    mutationFn: async ({ commentId, replyId }) => {
      await axiosInstance.put(`/posts/${post._id}/comment/${commentId}/reply/${replyId}/unban`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      toast.success('Reply unbanned')
    }
  })

  const handleDeletePost = () => {
    setShowDeletePostConfirm(true)
  }

  const handleEditPost = () => {
    setIsEditingPost(true)
    setEditPostContent(post.content || "")
  }

  const handleCancelPostEdit = () => {
    setIsEditingPost(false)
    setEditPostContent(post.content || "")
    setEditPostImage(null)
    setNewImages([])
    setNewImagePreviews([])
    setRemovedImages([])
    setShowEditError(false)
  }

  const handleSavePostEdit = (e) => {
    e.preventDefault()
    
    // Validation: require at least content or image
    const hasContent = editPostContent.trim()
    // Check if there's an image: either a new image was uploaded, or there are remaining images after removals
    const remainingImages = post.images ? post.images.filter(img => !removedImages.includes(img)) : []
    const hasImage = (editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && post.image) || remainingImages.length > 0 || newImages.length > 0
    
    if (!hasContent && !hasImage) {
      setShowEditError(true)
      return
    }
    
    editPost({ content: editPostContent, image: editPostImage, removedImages, newImages })
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const newImageFiles = []
      const newPreviews = []
      
      let loadedCount = 0
      
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          newImageFiles.push(reader.result)
          newPreviews.push(reader.result)
          loadedCount++
          
          if (loadedCount === files.length) {
            setNewImages(prev => [...prev, ...newImageFiles])
            setNewImagePreviews(prev => [...prev, ...newPreviews])
            setShowEditError(false)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = () => {
    setEditPostImage("REMOVE_IMAGE") // Special flag to indicate image removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeExistingImage = (imageUrl) => {
    setRemovedImages(prev => [...prev, imageUrl])
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
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


  // If post is banned or author is banned and the current user is neither the owner nor an admin, don't render
  if ((post.banned || post.author?.banned) && authUser?._id !== post.author._id && authUser?.role !== 'admin') {
    return null
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
            {/* Show banned badge left of actions for admins/owners */}
            {(post.banned && (authUser?.role === 'admin' || isOwner)) && (
              <span className="mr-1 inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">BANNED</span>
            )}

            {isOwner ? (
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
              ) : (
              <div className='relative'>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActionsDropdown(!showActionsDropdown); }}
                  className='p-2 hover:bg-gray-50 rounded-full transition-colors'
                  title='More actions'
                >
                  <MoreVertical size={18} className='text-gray-700' />
                </button>
                {showActionsDropdown && (
                  <>
                    <div className='fixed inset-0 z-10' onClick={() => setShowActionsDropdown(false)} />
                    <div className='absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                              {/* Admins only see Ban/Unban, regular users see Report */}
                                {authUser?.role === 'admin' ? (
                                post.banned ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowUnbanPostConfirm(true); setShowActionsDropdown(false); }}
                                    className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                  >
                                    <CheckCircle size={16} className='text-red-600' />
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowBanPostConfirm(true); setShowActionsDropdown(false); }}
                                    className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                  >
                                    <XCircle size={16} className='text-red-500' />
                                    Ban
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReportSubTarget(null); setShowReportModal(true); setShowActionsDropdown(false); }}
                                  className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                >
                                  <Flag size={14} className='text-red-500' />
                                  Report
                                </button>
                              )}
                        </div>
                  </>
                )}
              </div>
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
                  showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && (post.image || (post.images && post.images.length > 0))))
                    ? 'border-2 border-red-500' 
                    : 'border-gray-300'
                }`}
                rows={3}
                placeholder="What's on your mind?"
              />
              {showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && (post.image || (post.images && post.images.length > 0)))) && (
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
                multiple
                className="hidden"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && (post.image || (post.images && post.images.length > 0))))
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ImageIcon size={18} />
                  <span>Photo</span>
                </button>
                {showEditError && !editPostContent.trim() && !((editPostImage && editPostImage !== "REMOVE_IMAGE") || (!editPostImage && (post.image || (post.images && post.images.length > 0)))) && (
                  <p className="text-red-500 text-sm mt-1">Or add a photo</p>
                )}
              </div>
            </div>

            {/* Combined image grid: existing + new images */}
            {(post.images && post.images.length > 0) || newImagePreviews.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {/* Existing images */}
                {post.images && post.images
                  .filter(img => !removedImages.includes(img))
                  .map((image, index) => (
                    <div key={`existing-${index}`} className="relative group aspect-square">
                      <img 
                        src={image} 
                        alt={`Current image ${index + 1}`} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                
                {/* New images */}
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative group aspect-square">
                    <img 
                      src={preview} 
                      alt={`New image ${index + 1}`} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      New
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* Show current single image (backward compatibility) */}
            {!post.images && post.image && (
              <div className="relative w-full aspect-square bg-gray-100">
                <img 
                  src={post.image} 
                  alt="Current image" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pb-4">
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
            
            {/* Display multiple images */}
            {post.images && post.images.length > 0 && (
              <>
                {post.images.length === 1 ? (
                  // Single image - Facebook style
                  <div ref={imageContainerRef} className="relative w-full bg-gray-100 justify-center flex">
                    <img 
                      src={post.images[0]} 
                      alt="Post image" 
                      className="h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '600px' }}
                      onClick={() => setSelectedImageIndex(0)}
                      onLoad={(e) => {
                        const img = e.target;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        
                        // If portrait (height > width), make container square and use object-cover
                        if (aspectRatio < 1) {
                          img.parentElement.classList.add('aspect-square');
                          img.classList.remove('object-contain', 'h-auto');
                          img.classList.add('object-cover', 'h-full');
                        }
                      }}
                    />
                  </div>
                ) : (
                  // Multiple images - Grid layout
                  <div className={`grid ${
                    post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                  }`}>
                    {post.images.slice(0, post.images.length > 4 ? 4 : post.images.length).map((image, index) => (
                      <div key={index} className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                        <img 
                          src={image} 
                          alt={`Post image ${index + 1}`} 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImageIndex(index)}
                        />
                        {/* Overlay for 4th image when there are more than 4 images */}
                        {post.images.length > 4 && index === 3 && (
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-opacity"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <span className="text-white text-4xl font-bold">
                              +{post.images.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Display single image (backward compatibility) - Facebook style */}
            {!post.images && post.image && (
              <div ref={imageContainerRef} className="relative w-full bg-gray-100">
                <img 
                  src={post.image} 
                  alt="Post content" 
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '600px' }}
                  onLoad={(e) => {
                    const img = e.target;
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    
                    // If portrait (height > width), make container square and use object-cover
                    if (aspectRatio < 1) {
                      img.parentElement.classList.add('aspect-square');
                      img.classList.remove('object-contain', 'h-auto');
                      img.classList.add('object-cover', 'h-full');
                    }
                  }}
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
              // If comment is banned and current user is neither comment owner nor admin, skip rendering
              if (comment.banned && authUser?._id !== comment.user._id && authUser?.role !== 'admin') {
                return null
              }
              const isCommentOwner = comment.user._id === authUser._id
              const isEditingComment = editingCommentId === comment._id
              const isCommentExpanded = expandedComments.has(comment._id)
              // Count only replies visible to the current user (exclude banned replies unless admin or reply owner)
              const visibleReplies = (comment.replies || []).filter(r => !r.banned || authUser?._id === r.user._id || authUser?.role === 'admin')
              const repliesCount = visibleReplies.length
              
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
                            {comment.banned && (authUser?.role === 'admin' || isCommentOwner) && (
                              <span className="inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">BANNED</span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              {comment.editedAt && ' (edited)'}
                            </span>
                            {!isCommentOwner && (
                              <div className='relative'>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenCommentMenu(openCommentMenu === comment._id ? null : comment._id); }}
                                  className='p-1 hover:bg-gray-100 rounded-full'
                                  title='More'
                                >
                                  <MoreVertical size={12} />
                                </button>
                                {openCommentMenu === comment._id && (
                                  <>
                                    <div className='fixed inset-0 z-10' onClick={() => setOpenCommentMenu(null)} />
                                    <div className='absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                                      {authUser?.role === 'admin' ? (
                                        comment.banned ? (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setModerationCommentId(comment._id); setShowUnbanCommentConfirm(true); setOpenCommentMenu(null); }}
                                            className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                          >
                                            <CheckCircle size={16} className='text-red-600' />
                                            Unban
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setModerationCommentId(comment._id); setShowBanCommentConfirm(true); setOpenCommentMenu(null); }}
                                            className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                          >
                                            <XCircle size={16} className='text-red-500' />
                                            Ban
                                          </button>
                                        )
                                      ) : (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setReportSubTarget(comment._id); setShowReportModal(true); setOpenCommentMenu(null); }}
                                          className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                        >
                                          <Flag size={12} className='text-red-500' />
                                          Report
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
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
                                  onClick={() => {
                                    setCommentToDelete(comment._id)
                                    setShowDeleteCommentConfirm(true)
                                  }}
                                  disabled={isRemovingComment}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                  title="Delete comment"
                                >
                                  {isRemovingComment && commentToDelete === comment._id ? (
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
                            <div className="flex items-center gap-2">
                              <p className="text-gray-700 text-sm">{renderTextWithMentions(comment.content)}</p>
                              {/* BANNED badge shown near timestamp instead; avoid duplicate here */}
                            </div>
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
                                  // If reply is banned and current user is neither reply owner nor admin, skip
                                  if (reply.banned && authUser?._id !== reply.user._id && authUser?.role !== 'admin') return null
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
                                      {reply.banned && (authUser?.role === 'admin' || isReplyOwner) && (
                                        <span className="inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">BANNED</span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                        {reply.editedAt && ' (edited)'}
                                      </span>
                                      {!isReplyOwner && (
                                        <div className='relative'>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setOpenReplyMenu(openReplyMenu === reply._id ? null : reply._id); }}
                                            className='p-1 hover:bg-gray-100 rounded-full'
                                            title='More'
                                          >
                                            <MoreVertical size={10} />
                                          </button>
                                          {openReplyMenu === reply._id && (
                                            <>
                                              <div className='fixed inset-0 z-10' onClick={() => setOpenReplyMenu(null)} />
                                              <div className='absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20'>
                                                {authUser?.role === 'admin' ? (
                                                  reply.banned ? (
                                                    <button
                                                      onClick={(e) => { e.stopPropagation(); setModerationReply({ commentId: comment._id, replyId: reply._id }); setShowUnbanReplyConfirm(true); setOpenReplyMenu(null); }}
                                                      className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                                    >
                                                      <CheckCircle size={16} className='text-red-500' />
                                                      Unban
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={(e) => { e.stopPropagation(); setModerationReply({ commentId: comment._id, replyId: reply._id }); setShowBanReplyConfirm(true); setOpenReplyMenu(null); }}
                                                      className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                                    >
                                                      <XCircle size={16} className='text-red-500' />
                                                      Ban
                                                    </button>
                                                  )
                                                ) : (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); setReportSubTarget(reply._id); setShowReportModal(true); setOpenReplyMenu(null); }}
                                                    className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                                  >
                                                    <Flag size={12} className='text-red-500' />
                                                    Report
                                                  </button>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      )}
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
                                              setReplyToDelete({ commentId: comment._id, replyId: reply._id })
                                              setShowDeleteReplyConfirm(true)
                                            }}
                                            disabled={isDeletingReply}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                            title="Delete reply"
                                          >
                                            {isDeletingReply && replyToDelete?.replyId === reply._id ? (
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

      {/* Image Lightbox Modal */}
      {selectedImageIndex !== null && post?.images && post.images.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X size={32} />
          </button>
          
          {/* Previous Button */}
          {post.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((selectedImageIndex - 1 + post.images.length) % post.images.length);
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img
            src={post.images[selectedImageIndex]}
            alt={`Full size - Image ${selectedImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {post.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((selectedImageIndex + 1) % post.images.length);
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full"
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Image Counter */}
          {post.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {post.images.length}
            </div>
          )}
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeletePostConfirm}
        onClose={() => setShowDeletePostConfirm(false)}
        onConfirm={() => deletePost()}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeletingPost}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
      {/* Ban/Unban Post Confirmation Modals */}
      <ConfirmModal
        isOpen={showBanPostConfirm}
        onClose={() => { setShowBanPostConfirm(false); setBanReason(""); }}
        onConfirm={() => { banPostMutate({ reason: banReason }); setShowBanPostConfirm(false); setBanReason(""); }}
        title="Ban Post"
        message="Are you sure you want to ban this post? Banned posts are hidden from regular users."
        confirmText="Yes, Ban"
        cancelText="Cancel"
        isLoading={isBanningPost}
        loadingText="Banning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        showTextArea={true}
        textAreaValue={banReason}
        onTextAreaChange={(v) => setBanReason(v)}
      />
      <ConfirmModal
        isOpen={showUnbanPostConfirm}
        onClose={() => setShowUnbanPostConfirm(false)}
        onConfirm={() => { unbanPostMutate(); setShowUnbanPostConfirm(false); }}
        title="Unban Post"
        message="Unban this post and restore it for regular users?"
        confirmText="Yes, Unban"
        cancelText="Cancel"
        isLoading={isUnbanningPost}
        loadingText="Unbanning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportSubTarget(null); }}
        defaultType='post'
        targetId={post._id}
        subTarget={reportSubTarget}
      />

      {/* Delete Comment Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteCommentConfirm}
        onClose={() => {
          setShowDeleteCommentConfirm(false)
          setCommentToDelete(null)
        }}
        onConfirm={() => removeComment(commentToDelete)}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isRemovingComment}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />

      {/* Ban/Unban Comment Confirmation Modals */}
      <ConfirmModal
        isOpen={showBanCommentConfirm}
        onClose={() => { setShowBanCommentConfirm(false); setModerationCommentId(null); setBanCommentReason(""); }}
        onConfirm={() => { banCommentMutate({ commentId: moderationCommentId, reason: banCommentReason }); setShowBanCommentConfirm(false); setModerationCommentId(null); setBanCommentReason(""); }}
        title="Ban Comment"
        message="Are you sure you want to ban this comment? This will hide it (and its replies) from regular users."
        confirmText="Yes, Ban"
        cancelText="Cancel"
        isLoading={isBanningComment}
        loadingText="Banning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        showTextArea={true}
        textAreaValue={banCommentReason}
        onTextAreaChange={(v) => setBanCommentReason(v)}
      />
      <ConfirmModal
        isOpen={showUnbanCommentConfirm}
        onClose={() => { setShowUnbanCommentConfirm(false); setModerationCommentId(null); }}
        onConfirm={() => { unbanCommentMutate({ commentId: moderationCommentId }); setShowUnbanCommentConfirm(false); setModerationCommentId(null); }}
        title="Unban Comment"
        message="Unban this comment and restore it for regular users?"
        confirmText="Yes, Unban"
        cancelText="Cancel"
        isLoading={isUnbanningComment}
        loadingText="Unbanning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />

      {/* Delete Reply Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteReplyConfirm}
        onClose={() => {
          setShowDeleteReplyConfirm(false)
          setReplyToDelete(null)
        }}
        onConfirm={() => deleteReply(replyToDelete)}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeletingReply}
        loadingText="Deleting..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />

      {/* Ban/Unban Reply Confirmation Modals */}
      <ConfirmModal
        isOpen={showBanReplyConfirm}
        onClose={() => { setShowBanReplyConfirm(false); setModerationReply(null); setBanReplyReason(""); }}
        onConfirm={() => { if (moderationReply) banReplyMutate({ ...moderationReply, reason: banReplyReason }); setShowBanReplyConfirm(false); setModerationReply(null); setBanReplyReason(""); }}
        title="Ban Reply"
        message="Are you sure you want to ban this reply? Banned replies are hidden from regular users."
        confirmText="Yes, Ban"
        cancelText="Cancel"
        isLoading={isBanningReply}
        loadingText="Banning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        showTextArea={true}
        textAreaValue={banReplyReason}
        onTextAreaChange={(v) => setBanReplyReason(v)}
      />
      <ConfirmModal
        isOpen={showUnbanReplyConfirm}
        onClose={() => { setShowUnbanReplyConfirm(false); setModerationReply(null); }}
        onConfirm={() => { if (moderationReply) unbanReplyMutate(moderationReply); setShowUnbanReplyConfirm(false); setModerationReply(null); }}
        title="Unban Reply"
        message="Unban this reply and restore it for regular users?"
        confirmText="Yes, Unban"
        cancelText="Cancel"
        isLoading={isUnbanningReply}
        loadingText="Unbanning..."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
    </div>
  )
}

export default Post