import React from 'react';
import { Flag } from 'lucide-react';
import { useFeedback } from '../../contexts/FeedbackContext';

const ReportMenuItem = ({ page, className = '', onClickExtra }) => {
  const { openFeedback } = useFeedback();

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClickExtra) onClickExtra();
    openFeedback(page);
  };

  return (
    <button onClick={handleClick} className={`w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 ${className}`}>
      <Flag size={16} />
      Report
    </button>
  );
};

export default ReportMenuItem;
