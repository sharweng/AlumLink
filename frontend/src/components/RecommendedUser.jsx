import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { axiosInstance } from '../lib/axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Clock, UserPlus, UserCheck, Check, X } from 'lucide-react'

const RecommendedUser = ({ user }) => {
  const queryClient = useQueryClient()

  const { data:linkStatus, isLoading } = useQuery({
    queryKey: ["linkStatus", user._id],
    queryFn: () => axiosInstance.get(`/links/status/${ user._id }`)
  })
  
  const { mutate: sendLinkRequest } = useMutation({
    mutationFn: (userId) => axiosInstance.post(`/links/request/${ userId} `),
    onSuccess: () => {
      toast.success("Link request sent successfully")
      queryClient.invalidateQueries({ queryKey: ["linkStatus", user._id] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to send a link request")
    }
  })

  const { mutate: acceptRequest } = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/links/accept/${ requestId }`),
    onSuccess: () => {
      toast.success("Link request accepted")
      queryClient.invalidateQueries({ queryKey: ["linkStatus", user._id] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to accept a link request")
    }
  })

  const { mutate: rejectRequest } = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/links/reject/${ requestId }`),
    onSuccess: () => {
      toast.success("Link request rejected")
      queryClient.invalidateQueries({ queryKey: ["linkStatus", user._id] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to reject a link request")
    }
  })

  const renderButton = () => {
    if(isLoading){
      return (
        <button className='px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-500' disabled>Loading...</button>
      )
    }
    switch(linkStatus?.data?.status){
      case "pending":
        return (
          <button className='px-3 py-1 rounded-full text-sm bg-yellow-500 text-white flex items-center' disabled>
            <Clock size={16} className='mr-1' />
            Pending
          </button>
        )
      case "received":
        console.log(linkStatus.data.requestId)
        return (
          <div className='flex gap-2 justify-center'>
						<button
							onClick={() => acceptRequest(linkStatus.data.requestId)}
							className={`rounded-full p-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white`}>
							<Check size={16} />
						</button>
            
						<button
							onClick={() => rejectRequest(linkStatus.data.requestId)}
							className={`rounded-full p-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white`}>
							<X size={16} />
						</button>
					</div>
        )
      case "linked":
        return (
          <button
						className='px-3 py-1 rounded-full text-sm bg-green-500 text-white flex items-center'
						disabled >
						<UserCheck size={16} className='mr-1' />
						Linked
					</button>
        )
      default:
        return (
          <button
						className='px-3 py-1 rounded-full text-sm border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center'
						onClick={handleLink}>
						<UserPlus size={16} className='mr-1' />
						Link
					</button>
        )
    }
  }

  const handleLink = () => {
    if(linkStatus?.data?.status === "not_linked"){
      sendLinkRequest(user._id)
    }
  }

  return (
    <div className='flex items-center justify-between mb-4'>
      <Link to={`/profile/${ user.username }`} className='flex items-center flex-grow min-w-0'>
        <img src={ user.profilePicture || "avatar.png" } alt={ user.name } className='w-12 h-12 rounded-full mr-3 flex-shrink-0' />
        <div className='min-w-0'>
          <h3 className='font-semibold text-sm truncate max-w-[120px] leading-5'>{ user.name }</h3>
          <p className='text-xs text-info truncate max-w-[120px] leading-4'>{ user.headline }</p>
        </div>
      </Link>
      { renderButton() }
    </div>
  )
}

export default RecommendedUser