import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { axiosInstance } from '../lib/axios'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import DiscussionPost from '../components/DiscussionPost'
import { useEffect } from 'react'

const DiscussionPage = () => {
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
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (!discussion?.data) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>Discussion not found</p>
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-4'>
        <Link
          to='/forums'
          className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
        >
          <ArrowLeft size={20} />
          Back to Forums
        </Link>
      </div>

      <DiscussionPost 
        discussion={discussion.data} 
        commentIdToExpand={commentId}
      />
    </div>
  )
}

export default DiscussionPage
