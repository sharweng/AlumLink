import { Filter } from 'bad-words';

const filter = new Filter();

// Add any custom bad words specific to your application
// filter.addWords('customword1', 'customword2');

export const sanitizeMessage = (message) => {
  return filter.clean(message);
};

export default filter;
