import { useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import PostCreation from '../components/PostCreation'

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

  console.log("authUser", authUser)

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='hidden lg:block lg:col-sp1'>
        <Sidebar user={ authUser } />
      </div>
      <div className='col-span-1 lg:col-span-2 order-first lg:order-none'>
        <PostCreation user={ authUser } />
      </div>
    </div>
  )
}

export default HomePage