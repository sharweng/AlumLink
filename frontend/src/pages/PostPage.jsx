import { useParams, Link, useSearchParams } from "react-router-dom"
import { axiosInstance } from "../lib/axios"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Sidebar from "../components/Sidebar"
import Post from "../components/post/Post"
import { Loader, XCircle, ArrowLeft } from "lucide-react"

const PostPage = () => {
  const { postId } = useParams()
  const [searchParams] = useSearchParams()
  const commentId = searchParams.get('comment')

  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => axiosInstance.get(`/posts/${postId}`)
  })

  const renderPost = () => {
    if (postLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
          <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
          <span className="text-lg text-info font-medium">Loading post...</span>
        </div>
      );
    } else if (!post?.data) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow">
          <XCircle className="h-12 w-12 text-gray-400 mb-3" />
          <span className="text-xl font-semibold text-gray-500">Post not found</span>
          <span className="text-info mt-1">The post you are looking for does not exist or was removed.</span>
        </div>
      );
    } else if (post.data.banned && !(authUser?.role === 'admin' || authUser?._id === post.data.author._id)) {
      // Explicit banned page for non-admin and non-owner
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
          <XCircle className="h-12 w-12 text-red-400 mb-3" />
          <h2 className="text-2xl font-semibold mb-2">This post has been banned</h2>
          <p className="text-gray-600">The content you're trying to view has been removed by the admins.</p>
        </div>
      )
    } else {
      return <Post post={post.data} isDetailView={true} commentIdToExpand={commentId} />;
    }
  };

  // todo make the post reactions work in post page

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      <div className="lg:col-span-3">
        {/* Back Button */}
        <Link
          to='/'
          className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors'
        >
          <ArrowLeft size={16} />
          Back to Feed
        </Link>
        
        { renderPost() }
      </div>
    </div>
  )
}

export default PostPage