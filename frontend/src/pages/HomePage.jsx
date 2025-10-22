import { useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import PostCreation from '../components/post/PostCreation'
import Post from '../components/post/Post'
import RecommendedUser from '../components/network/RecommendedUser'
// RecognitionWall removed from sidebar (moved to centralized Achievements page)
import { Users } from "lucide-react"

const HomePage = () => {
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])

  const { data:recommendedUsers } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/users/suggestions")
        return res.data
      } catch (error) {
        toast.error(error.response.data.message || "Something went wrong")
      }
    }
  })

  const { data:posts } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/posts")
      return res.data
    }
  })


  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='hidden lg:block lg:col-sp1'>
        <Sidebar user={ authUser } />
      </div>
      <div className='col-span-1 lg:col-span-2 order-first lg:order-none'>
        <PostCreation user={ authUser } />
  { posts?.filter(post => !post.author?.banned).map(post=> <Post key={ post._id } post={ post } />)}

  { posts?.filter(post => !post.author?.banned).length === 0 && (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <div className='mb-6'>
              <Users size={64} className="mx-auto text-red-500" />
            </div>
            <h2 className='text-2xl font-bold mb-4 '>No Posts Yet</h2>
            <p className='text-gray-600 mb-6'>Link with others to start seeing posts in your feed!</p>
          </div>
        )}
      </div>

      { recommendedUsers?.length > 0 && (
        <div className='col-span-1 lg:col-span-1 lg:block'>
          <div className='bg-secondary rounded-lg shadow p-4'>
            <h2 className='font-semibold mb-4'>People you may know</h2>
            { recommendedUsers?.map((user) => (
              <RecommendedUser key={ user._id } user={ user } />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage