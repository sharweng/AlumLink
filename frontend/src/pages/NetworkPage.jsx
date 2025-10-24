import { useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../lib/axios'
import Sidebar from '../components/Sidebar'
import { UserPlus } from 'lucide-react'
import  FriendRequest  from '../components/network/FriendRequest'
import UserCard from '../components/UserCard'
import { useState } from 'react'

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

  const [search, setSearch] = useState("");
  const filteredLinks = links?.data?.filter(link =>
    link.name.toLowerCase().includes(search.toLowerCase()) ||
    link.headline?.toLowerCase().includes(search.toLowerCase()) ||
    link.username?.toLowerCase().includes(search.toLowerCase())
  ) || [];


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
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold'>My Links</h2>
                <input
                  type='text'
                  className='px-3 py-2 border border-gray-300 rounded w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-primary ml-4'
                  placeholder='Search links...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className='grid grid-cols-4 gap-3'>
                {filteredLinks.length > 0 ? (
                  filteredLinks.map((link) => (
                    <UserCard key={link._id} user={link} isLink={true} />
                  ))
                ) : (
                  <div className='col-span-full text-center text-gray-500 py-8'>No links found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NetworkPage