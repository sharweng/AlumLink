import { useFeedback } from '../../contexts/FeedbackContext';
import { MessageSquare } from 'lucide-react';

const FeedbackButton = ({ page }) => {
  const { openFeedback } = useFeedback();
  return (
    <button
      onClick={() => openFeedback(page)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded bg-primary text-white hover:bg-primary-dark"
    >
      <MessageSquare size={16} />
      Feedback
    </button>
  );
};

export default FeedbackButton;
