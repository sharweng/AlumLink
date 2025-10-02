import { useQueryClient, useMutation, mutationOptions } from "@tanstack/react-query"
import { useState } from "react"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { Link, useParams } from "react-router-dom"
import { Heart, Loader, MessageCircle, Send, Share2, Trash2, X, Edit, Check } from "lucide-react"
import PostAction from "./PostAction"
import { formatDistanceToNow } from "date-fns"

const Post = ({ post }) => {
  const { postId } = useParams()
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(post.comments || [])
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const isOwner = authUser._id === post.author._id
  const isLiked = post.likes.includes(authUser._id)

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

  const { mutate: createComment, isPending:isCreatingComment } = useMutation({
    mutationFn: async (newComment) => {
      await axiosInstance.post(`/posts/${ post._id }/comment`, { content: newComment })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      toast.success("Comment created successfully")
    },
    onError: (error) => {
      toast.error(error.response.data.message || "Failed to add a comment")
    }
  })

    // Remove comment mutation
  const { mutate: removeComment, isPending: isRemovingComment } = useMutation({
    mutationFn: async ({ commentId }) => {
      await axiosInstance.delete(`/posts/${post._id}/comment/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
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

  const handleLikePost = async () => {
    if (isLikingPost) return
    likePost()
  }

    const handleAddComment = (e) => {
    e.preventDefault()
    if(newComment.trim()) {
      createComment(newComment)
      setNewComment("")
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
              <p className='text-xs text-gray-500'>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
            </Link>
          </div>
        </div>
        
        <div className='flex items-center gap-2'>
          {isOwner && (
            <button 
              onClick={handleDeletePost} 
              disabled={isDeletingPost}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            >
              {isDeletingPost ? (
                <div className='w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin' />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='mb-4'>
        <p className="text-gray-700 mb-4">{post.content}</p>
        {post.image && <img src={post.image} alt="Post content" className="rounded-lg w-full" />}
      </div>

      {/* Actions */}  
      <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
        <div className='flex items-center justify-between gap-4'>
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
            <span>{comments.length || 0}</span>
          </button>

          <button className='flex items-center gap-2 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors'>
            <Share2 size={18} />
            <span>Share</span>
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
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
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
            {comments?.map((comment, index) => {
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
                              className='p-1 text-blue-500 hover:bg-blue-50 rounded-full transition-colors'
                              title='Edit comment'
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => removeComment({ commentId: comment._id })}
                              disabled={isRemovingComment}
                              className='p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50'
                              title='Delete comment'
                            >
                              {isRemovingComment ? (
                                <div className='w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin' />
                              ) : (
                                <X size={12} />
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
                            className='px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1'
                          >
                            {isEditingComment ? (
                              <div className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
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