import { useQueryClient, useMutation, mutationOptions } from "@tanstack/react-query"
import { useState, useRef, useEffect } from "react"
import { axiosInstance } from "../../lib/axios"
import toast from "react-hot-toast"
import { Link, useParams } from "react-router-dom"
import { Heart, Loader, MessageCircle, Send, Share2, Trash2, X, Edit, Check, Image as ImageIcon } from "lucide-react"
import PostAction from "./PostAction"
import { formatDistanceToNow } from "date-fns"

const Post = ({ post }) => {
  const { postId } = useParams()
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
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
      await axiosInstance.post(`/posts/${ post._id }/comment`, { content: newComment })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["post", post._id] })
      setNewComment('')
      toast.success("Comment created successfully")
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

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditingCommentContent(comment.content)
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingCommentContent.trim()) return
    editComment({ commentId: editingCommentId, content: editingCommentContent })
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  return (
    <div className='bg-white rounded-lg shadow border border-gray-200 p-4 mb-4'>
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-start gap-3'>
          <Link to={`/profile/${post?.author?.username}`}>
            <img 
              src={post.author.profilePicture || "/avatar.png"} 
              alt={post.author.name} 
              className="w-12 h-12 rounded-full object-cover" 
            />
          </Link>
          <div>
            <Link to={`/profile/${post?.author?.username}`}>
              <h3 className='font-semibold text-gray-900'>{post.author.name}</h3>
            </Link>
            <p className='text-sm text-gray-600'>{post.author.headline}</p>
            <Link to={`/post/${post._id}`}>
              <p className='text-xs text-gray-500'>
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {post.editedAt && <span className="ml-1">(edited)</span>}
              </p>
            </Link>
          </div>
        </div>
        
        <div className='flex items-center gap-2'>
          {isOwner && (
            <>
              <button 
                onClick={handleEditPost} 
                disabled={isEditingPost}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={handleDeletePost} 
                disabled={isDeletingPost}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
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

      {/* Content */}
      <div className='mb-4'>
        {isEditingPost ? (
          <form onSubmit={handleSavePostEdit} className="space-y-4">
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
              <div className="relative w-full bg-gray-100 rounded-lg" style={{ height: imageMaxHeight ? `${imageMaxHeight}px` : '400px' }}>
                <img 
                  src={editPostImage} 
                  alt="Preview" 
                  className="rounded-lg w-full h-full object-contain"
                />
              </div>
            )}
            
            {/* Show current image if no new image is selected and not marked for removal */}
            {!editPostImage && post.image && (
              <div className={`relative w-full rounded-lg ${isImageTall ? 'bg-gray-100' : ''}`} style={isImageTall ? { height: imageMaxHeight ? `${imageMaxHeight}px` : '400px' } : {}}>
                <img 
                  src={post.image} 
                  alt="Current image" 
                  className={`rounded-lg w-full ${isImageTall ? 'h-full object-contain' : 'object-cover'}`}
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
            <p className="text-gray-700 mb-4">{post.content}</p>
            {post.image && (
              <div ref={imageContainerRef} className={`relative w-full rounded-lg ${isImageTall ? 'bg-gray-100' : ''}`} style={isImageTall ? { height: imageMaxHeight ? `${imageMaxHeight}px` : '400px' } : {}}>
                <img 
                  src={post.image} 
                  alt="Post content" 
                  className={`rounded-lg w-full ${isImageTall ? 'h-full object-contain' : 'object-cover'}`}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}  
      <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
        <div className='flex w-full items-center justify-between gap-4'>
          <button
            onClick={handleLikePost}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
              isLiked 
                ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            <span>{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className='flex items-center gap-2 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors'
          >
            <MessageCircle size={18} />
            <span>{post.comments?.length || 0}</span>
          </button>

          <button className='flex items-center gap-2 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors'>
            <Share2 size={18} />
            <span>0</span>
          </button>
        </div>
      </div>
      {/* Comments Section */}
      {showComments && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          {/* Add Comment */}
          <form onSubmit={handleAddComment} className='mb-4'>
            <div className='flex gap-3'>
              <img
                src={authUser.profilePicture || '/avatar.png'}
                alt='Your avatar'
                className='w-8 h-8 rounded-full object-cover'
              />
              <div className='flex-1'>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder='Add a comment...'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  />
                  <button
                    type='submit'
                    disabled={isCreatingComment || !newComment.trim()}
                    className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50'
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
          <div className='space-y-3'>
            {post.comments?.map((comment, index) => {
              const isCommentOwner = comment.user._id === authUser._id;
              const isEditing = editingCommentId === comment._id;
              
              return (
                <div key={comment._id || index} className='flex gap-3'>
                  <img
                    src={comment.user.profilePicture || '/avatar.png'}
                    alt={comment.user.name}
                    className='w-8 h-8 rounded-full object-cover'
                  />
                  <div className='flex-1 bg-gray-50 rounded-lg p-3'>
                    <div className='flex items-center justify-between mb-1'>
                      <h4 className='font-medium text-gray-900'>{comment.user.name}</h4>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-500'>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          {comment.editedAt && ' (edited)'}
                        </span>
                        {isCommentOwner && !isEditing && (
                          <>
                            <button
                              onClick={() => handleEditComment(comment)}
                              className='p-1 text-green-500 hover:bg-green-50 rounded-full transition-colors'
                              title='Edit comment'
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => removeComment(comment._id)}
                              disabled={isRemovingComment}
                              className='p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50'
                              title='Delete comment'
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
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className='space-y-2'>
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className='w-full p-2 border border-gray-300 rounded resize-none text-sm'
                          rows={2}
                          autoFocus
                        />
                        <div className='flex gap-2 justify-end'>
                          <button
                            type='button'
                            onClick={handleCancelEdit}
                            className='px-2 py-1 text-xs text-gray-600 hover:text-gray-800'
                          >
                            Cancel
                          </button>
                          <button
                            type='submit'
                            disabled={isEditingComment || !editingCommentContent.trim()}
                            className='px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1'
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
                      <p className='text-gray-700'>{comment.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Post