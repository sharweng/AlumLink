import { useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import Sidebar from '../components/Sidebar'
import { UserPlus } from 'lucide-react'
import  FriendRequest  from '../components/network/FriendRequest'
import UserCard from '../components/UserCard'

const NetworkPage = () => {
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(["authUser"])

  const { data: linkRequests } = useQuery({
    queryKey: ["linkRequests"],
    queryFn: () => axiosInstance.get("/links/requests")
  })

  const { data: links } = useQuery({
    queryKey: ["links"],
    queryFn: () => axiosInstance.get("/links")
  })


  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='col-span-1 lg:col-span-1'>
        <Sidebar user = { authUser } />
      </div>
      <div className='col-span-1 lg:col-span-3'>
        <div className='bg-secondary rounded-lg shadow p-6 mb-6'>
          <h1 className='text-2xl font-bold mb-6'>My Network</h1>
          { linkRequests?.data?.length > 0 ? (
            <div className='mb-8'>
							<h2 className='text-xl font-semibold mb-2'>Link Request</h2>
							<div className='space-y-4'>
								{linkRequests.data.map((request) => (
									<FriendRequest key={request.id} request={request} />
								))}
							</div>
						</div>
          ) : (
            <div className='bg-white rounded-lg shadow p-6 text-center mb-6'>
							<UserPlus size={48} className='mx-auto text-gray-400 mb-4' />
							<h3 className='text-xl font-semibold mb-2'>No Connection Requests</h3>
							<p className='text-gray-600'>
								You don&apos;t have any pending link requests at the moment.
							</p>
							<p className='text-gray-600 mt-2'>
								Check out the links below to grow your network!
							</p>
						</div>
          )}
          { links?.data?.length > 0 && (
						<div className='mb-8'>
							<h2 className='text-xl font-semibold mb-4'>My Links</h2>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{links.data.map((link) => (
									<UserCard key={link._id} user={link} isLink={true} />
								))}
							</div>
						</div>
					)}
        </div>
      </div>
    </div>
  )
}

export default NetworkPage