import { createContext, useContext, useState, useCallback } from 'react';
import FeedbackModal from '../components/feedback/FeedbackModal';

const FeedbackContext = createContext();

export const useFeedback = () => useContext(FeedbackContext);

export const FeedbackProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [initialPage, setInitialPage] = useState('');

  const openFeedback = useCallback((page = '') => {
    setInitialPage(page);
    setOpen(true);
  }, []);

  const closeFeedback = useCallback(() => setOpen(false), []);

  return (
    <FeedbackContext.Provider value={{ openFeedback }}>
      {children}
      <FeedbackModal isOpen={open} onClose={closeFeedback} page={initialPage} />
    </FeedbackContext.Provider>
  );
};

export default FeedbackContext;
