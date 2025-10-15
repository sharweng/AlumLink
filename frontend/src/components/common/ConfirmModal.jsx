import { X, Loader } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isLoading = false,
  loadingText = "Processing...",
  confirmButtonClass = "bg-red-500 hover:bg-red-600"
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='flex justify-between items-start mb-4'>
          <h3 className='text-lg font-semibold'>{title}</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X size={20} />
          </button>
        </div>
        <p className='text-gray-600 mb-6'>
          {message}
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmButtonClass}`}
          >
            {isLoading && (
              <Loader className='animate-spin' size={16} />
            )}
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
