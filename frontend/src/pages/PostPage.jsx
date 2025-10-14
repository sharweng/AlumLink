import { useParams } from "react-router-dom"
import { axiosInstance } from "../lib/axios"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Sidebar from "../components/Sidebar"
import Post from "../components/post/Post"
import { Loader, XCircle } from "lucide-react"

const PostPage = () => {
  const { postId } = useParams()

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
    } else {
      return <Post post={post.data} />;
    }
  };

  // todo make the post reactions work in post page

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="col-span-1 lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        { renderPost() }
      </div>
    </div>
  )
}

export default PostPage