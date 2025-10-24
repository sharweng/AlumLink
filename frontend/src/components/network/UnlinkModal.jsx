import { X, Loader } from 'lucide-react';

const UnlinkModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Unlink User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <p className="mb-6 text-gray-700">Are you sure you want to unlink this user? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader className="animate-spin inline-block mr-2" size={18} /> : null}
            {isLoading ? "Unlinking..." : "Unlink"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlinkModal;
