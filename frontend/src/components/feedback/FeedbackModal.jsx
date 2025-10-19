import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import { useQueryClient } from '@tanstack/react-query';

const FeedbackModal = ({ isOpen, onClose, page = '' }) => {
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qc = useQueryClient();

  if (!isOpen) return null;

  const handleFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/feedback', { message, page, imageBase64 });
      qc.invalidateQueries(['feedback']);
      setMessage('');
      setImageBase64('');
      onClose();
    } catch (err) {
      console.error('Feedback submit error', err);
      alert('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Send Feedback</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X /></button>
        </div>
        <form onSubmit={submit} className="p-4">
          <p className="text-sm text-gray-600 mb-2">Page: <span className="font-medium">{page || 'General'}</span></p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue or suggestion..."
            className="w-full h-32 p-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="mb-3">
            <label className="inline-block mb-2 text-sm font-medium">Attach screenshot (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {imageBase64 && (
              <div className="mt-3">
                <img src={imageBase64} alt="preview" className="max-h-40 object-contain rounded" />
                <button type="button" onClick={() => setImageBase64('')} className="text-sm text-red-500 mt-1">Remove</button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-primary text-white flex items-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader className="animate-spin" size={16} /> : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
