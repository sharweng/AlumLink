import { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { axiosInstance } from '../../lib/axios'

const ReportModal = ({ isOpen, onClose, defaultType = 'post', targetId = null }) => {
  const [type, setType] = useState(defaultType)
  const [details, setDetails] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setType(defaultType)
    setDetails('')
  }, [defaultType, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!targetId) {
      toast.error('No target to report')
      return
    }
    setIsLoading(true)
    try {
      await axiosInstance.post('/reports', { type, target: targetId, details })
      toast.success('Report submitted. Our team will review it.')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={onClose}>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4' onClick={e => e.stopPropagation()}>
        <div className='flex justify-between items-start mb-4'>
          <h3 className='text-lg font-semibold'>Report</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <X size={20} />
          </button>
        </div>

        <div className='space-y-3'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Category</label>
            {targetId ? (
              // When opened from a specific item, make category read-only so admins can map reports back
              <input
                type='text'
                value={
                  ({ post: 'Post', job: 'Job', event: 'Event', discussion: 'Discussion', other: 'Other' }[type] || type)
                }
                readOnly
                className='w-full border rounded p-2 bg-gray-100 cursor-default'
              />
            ) : (
              <select value={type} onChange={(e) => setType(e.target.value)} className='w-full border rounded p-2'>
                <option value='post'>Post</option>
                <option value='job'>Job</option>
                <option value='event'>Event</option>
                <option value='discussion'>Discussion</option>
                <option value='other'>Other</option>
              </select>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Details (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} className='w-full border rounded p-2' placeholder='Provide details to help moderators (optional)' />
          </div>
        </div>

        <div className='flex gap-3 justify-end mt-4'>
          <button onClick={onClose} disabled={isLoading} className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50'>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className='px-4 py-2 text-white rounded transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700 flex items-center gap-2'>
            {isLoading && <Loader className='animate-spin' size={16} />}
            {isLoading ? 'Reporting...' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportModal
