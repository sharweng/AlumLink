import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { ArrowLeft, Loader, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import DiscussionPost from '../components/discussion/DiscussionPost'
import Sidebar from '../components/Sidebar'
import { useEffect } from 'react'

const DiscussionPage = () => {
  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(['authUser'])
  const { discussionId } = useParams()
  const [searchParams] = useSearchParams()
  const commentId = searchParams.get('comment')
  const replyId = searchParams.get('reply')

  const { data: discussion, isLoading } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => axiosInstance.get(`/discussions/${discussionId}`)
  })

  // Scroll to comment or reply when the page loads
  useEffect(() => {
    if (discussion && (commentId || replyId)) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        // Determine which element to highlight
        const targetId = replyId || commentId
        const element = document.getElementById(targetId)
        
        if (element) {
          // Scroll to the element
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Find the gray background content box and highlight it
          // For replies (replyId exists), target only bg-gray-100
          // For comments (no replyId), target only bg-gray-50 (direct child, not nested in replies)
          let contentBox
          
          if (replyId) {
            // For replies, get the bg-gray-100 element (replies have gray-100)
            contentBox = element.querySelector('.bg-gray-100')
          } else {
            // For comments, get the direct bg-gray-50 child (not from nested replies)
            const children = element.children
            for (let child of children) {
              if (child.classList.contains('flex-1')) {
                contentBox = child.querySelector('.bg-gray-50')
                break
              }
            }
          }
          
          if (contentBox) {
            // Store original background class
            const originalBgClass = contentBox.className
            // Replace gray with yellow
            contentBox.className = contentBox.className.replace(/bg-gray-\d+/, 'bg-yellow-100')
            
            // Restore original background after 2 seconds
            setTimeout(() => {
              contentBox.className = originalBgClass
            }, 2000)
          }
        }
      }, 100)
    }
  }, [discussion, commentId, replyId])

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <Sidebar user={authUser} />
        </div>
        <div className='lg:col-span-3'>
          <Link
            to='/forums'
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors'
          >
            <ArrowLeft size={16} />
            Back to Forums
          </Link>
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow'>
            <Loader className='animate-spin h-10 w-10 text-primary mb-4' />
            <span className='text-lg text-info font-medium'>Loading discussion...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!discussion?.data) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <Sidebar user={authUser} />
        </div>
        <div className='lg:col-span-3'>
          <Link
            to='/forums'
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors'
          >
            <ArrowLeft size={16} />
            Back to Forums
          </Link>
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow'>
            <XCircle className='h-12 w-12 text-gray-400 mb-3' />
            <span className='text-xl font-semibold text-gray-500'>Discussion not found</span>
            <span className='text-info mt-1'>The discussion you are looking for does not exist or was removed.</span>
          </div>
        </div>
      </div>
    )
  }

  // If author is banned, show banned user UI for non-admin/non-owner
  if (discussion?.data?.author?.banned && !(authUser?.permission === 'admin' || authUser?.permission === 'superAdmin' || authUser?._id === discussion.data.author._id)) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <Sidebar user={authUser} />
        </div>
        <div className='lg:col-span-3'>
          <Link
            to='/forums'
            className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors'
          >
            <ArrowLeft size={16} />
            Back to Forums
          </Link>
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6'>
            <XCircle className='h-12 w-12 text-red-400 mb-3' />
            <h2 className='text-2xl font-semibold mb-2'>The user who created this discussion is banned</h2>
            <p className='text-gray-600'>The user who created this discussion has been banned by the admins.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
      <div className='col-span-1 lg:col-span-1'>
        <Sidebar user={authUser} />
      </div>

      <div className='col-span-1 lg:col-span-3'>
        <Link
          to='/forums'
          className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors'
        >
          <ArrowLeft size={16} />
          Back to Forums
        </Link>

        <DiscussionPost 
          discussion={discussion.data} 
          isDetailView={true}
          commentIdToExpand={commentId}
        />
      </div>
    </div>
  )
}

export default DiscussionPage
