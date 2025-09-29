import { useQueryClient, useMutation, mutationOptions } from "@tanstack/react-query"
import { useState } from "react"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { Link, useParams } from "react-router-dom"
import { Heart, Loader, MessageCircle, Send, Share2, Trash2, X } from "lucide-react"
import PostAction from "./PostAction"
import { formatDistanceToNow } from "date-fns"

const Post = ({ post }) => {
  const { postId } = useParams()
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(post.comments || [])
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
    onSuccess: (_, { commentId }) => {
      setComments(comments => comments.filter(c => c._id !== commentId))
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      toast.success("Comment deleted successfully")
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete comment")
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

  const handleAddComment = async (e) => {
    e.preventDefault()
    if(newComment.trim()) {
      createComment(newComment)
      setNewComment("")
      setComments([
        ...comments,
        {
          content: newComment,
          user: {
            _id: authUser._id,
            name: authUser.name,
            username: authUser.username,
            profilePicture: authUser.profilePicture
          },
          createdAt: new Date()
        }
      ])
    }
  }

  return (
    <div className="bg-secondary rounded-lg shadow mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link to={ `/profile/${post?.author?.username}` }>
              <img src={ post.author.profilePicture || "/avatar.png" } alt={ post.author.name } className="size-10 rounded-full mr-3" />
            </Link>
            <div>
              <Link to={`/profile/${ post?.author?.username }`}>
                <h3 className="font-semibold">{ post.author.name }</h3>
              </Link>
              <p className="text-xs text-info">{ post.author.headline }</p>
              <Link to={`/post/${post._id}`}>
                <p className="text-xs text-info">{ formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) }</p>
              </Link>
            </div>
          </div>
          {isOwner && (
            <button onClick={ handleDeletePost } className="text-red-500 hover:text-red-700">
              {isDeletingPost ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          )}
        </div>
        <p className="mb-4">{ post.content }</p>
        { post.image && <img src={ post.image } alt="Post content" className="rounded-lg w-full mb-4" />}

        <div className="flex justify-between text-info">
          <PostAction
            icon={<Heart size={18} className={isLiked ? "text-red-500 fill-red-300" : ""} />}
            text={`Like (${ post.likes.length })`}
            onClick={ handleLikePost }
          />

          <PostAction
            icon={<MessageCircle size={18} />}
            text={`Comment (${ comments.length })`}
            onClick={ () => setShowComments(!showComments) }
          />

          <PostAction icon={<Share2 size={18} />} text='Share' />
        </div>
      </div>
      { showComments && (
        <div className="px-4 pb-4">
          <div className="mb-4 max-h-60 overflow-y-auto">
            { comments.map((comment) => {
              const isCommentOwner = comment.user._id === authUser._id       
              return (
                <div key={ comment._id } className="mb-2 bg-base-100 p-2 rounded flex items-start relative">
                  <Link to={`/profile/${comment.user.username}`}>
                    <img src={ comment.user.profilePicture || "/avatar.png" } alt={ comment.user.name }
                      className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
                  </Link>
                  <div className="flex-grow">
                    <div className="flex items-center mb-1">
                      <Link to={`/profile/${comment.user.username}`} className="font-semibold mr-2">
                        { comment.user.name }
                      </Link>
                      <span className="text-xs text-info">{ formatDistanceToNow(new Date(comment.createdAt)) }</span>
                    </div>
                    <p>{ comment.content }</p>
                  </div>
                  {isCommentOwner && (
                    <button
                      className="absolute right-2 top-2 text-info hover:text-red-500"
                      title="Delete comment"
                      disabled={isRemovingComment}
                      onClick={() => {
                        if(window.confirm("Delete this comment?")) removeComment({ commentId: comment._id })
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <form onSubmit={ handleAddComment } className="flex items-center">
            <input type="text" value={ newComment } onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." 
            className="flex-grow p-2 rounded-l-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"/>

            <button type="submit" className="bg-primary text-white p-2 rounded-r-full hover:bg-primary-dark transition duration-300"
            disabled={ isCreatingComment }>
              { isCreatingComment ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Post