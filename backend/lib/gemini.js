// This file now redirects to Ollama for local AI processing
// Keep for backward compatibility
import { isExperienceRelatedToCourse as ollamaCheck } from './ollama.js';

export async function isExperienceRelatedToCourse(jobTitle, company, course) {
  return ollamaCheck(jobTitle, company, course);
}

export default { isExperienceRelatedToCourse };
