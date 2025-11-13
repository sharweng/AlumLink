import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../../lib/axios';

const FeedbackModal = ({ isOpen, onClose, targetType, targetId }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter feedback');
      return;
    }
    setIsLoading(true);
    try {
      // If this feedback targets an event, post to event-specific endpoint so it doesn't go to admin feedbacks
      if (targetType === 'event' && targetId) {
        await axiosInstance.post(`/events/${targetId}/feedback`, { message });
      } else {
        const payload = { message };
        if (targetType) payload.targetType = targetType;
        if (targetId) payload.targetId = targetId;
        await axiosInstance.post('/feedbacks', payload);
      }
      toast.success('Thank you for your feedback');
      setMessage('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='flex justify-between items-start mb-4'>
          <h3 className='text-lg font-semibold'>Send Feedback</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X size={20} />
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className='w-full border rounded p-2 mb-4'
          placeholder={targetType === 'event' ? 'Share feedback about this event (what went well, issues, suggestions)...' : 'Share any general feedback about the app, bugs, or suggestions.'}
        />
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className='px-4 py-2 text-white rounded bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2'
          >
            {isLoading && (
              <Loader className='animate-spin' size={16} />
            )}
            {isLoading ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
