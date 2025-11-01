import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Check if a job experience is related to an academic course
 * Two-step approach:
 * 1. First check with keyword matching (fast, no API cost)
 * 2. If not related by keywords, double-check with Gemini AI (may catch edge cases)
 * 
 * @param {string} jobTitle - The job position/title
 * @param {string} company - The company name
 * @param {string} course - The academic course (e.g., "BSIT", "BSCS")
 * @returns {Promise<boolean>} - True if related, false otherwise
 */
export async function isExperienceRelatedToCourse(jobTitle, company, course) {
  // Step 1: Check with keywords first (fast and free)
  const keywordMatch = keywordBasedMatching(jobTitle, company, course);
  
  // If keywords say it's related, trust it immediately
  if (keywordMatch) {
    console.log(`[Keyword Match] ${jobTitle} is related to ${course}`);
    return true;
  }
  
  // Step 2: If keywords say NOT related, double-check with Gemini AI
  // This catches edge cases where keywords might miss relevant jobs
  console.log(`[Keyword No Match] Checking with Gemini AI: ${jobTitle} for ${course}`);
  
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.log("Gemini API key not found, relying on keyword result (not related)");
    return false;
  }

  try {
    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash for fast, cost-effective content generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze if the following job is related to the academic course.

Job Title: ${jobTitle}
Company: ${company}
Academic Course: ${course}

Is this job position related to or aligned with the academic course? Consider:
- Technical skills overlap
- Industry relevance
- Career progression typical for graduates of this course
- Job responsibilities matching course curriculum
- Transferable skills

Answer with ONLY one word: "YES" if related, "NO" if not related.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();

    // Check if the response contains YES
    const aiMatch = text.includes("YES");
    console.log(`[Gemini AI] ${jobTitle} is ${aiMatch ? 'RELATED' : 'NOT RELATED'} to ${course}`);
    return aiMatch;
  } catch (error) {
    console.error("Error using Gemini AI:", error.message);
    // If AI fails, trust the keyword matching result (not related)
    return false;
  }
}

/**
 * Keyword-based matching for quick initial check
 * @param {string} jobTitle - The job position/title
 * @param {string} company - The company name
 * @param {string} course - The academic course
 * @returns {boolean} - True if related, false otherwise
 */
function keywordBasedMatching(jobTitle, company, course) {
  const courseLower = course.toLowerCase();
  const jobLower = jobTitle.toLowerCase();
  const companyLower = company.toLowerCase();

  const courseKeywords = {
    'bsit': ['developer', 'programmer', 'software', 'it', 'web', 'tech', 'data', 'system', 'network', 'database', 'engineer', 'analyst', 'qa', 'devops', 'frontend', 'backend', 'fullstack', 'mobile', 'app', 'digital', 'cloud', 'infrastructure'],
    'bscs': ['developer', 'programmer', 'software', 'computer', 'tech', 'data', 'ai', 'ml', 'machine learning', 'algorithm', 'system', 'engineer', 'analyst', 'researcher', 'scientist', 'artificial intelligence'],
    'bsis': ['analyst', 'system', 'business', 'data', 'it', 'information', 'database', 'erp', 'crm', 'consultant', 'manager', 'coordinator'],
    'bsece': ['engineer', 'electrical', 'electronics', 'circuit', 'embedded', 'hardware', 'telecom', 'signal', 'power', 'control'],
    'bsme': ['engineer', 'mechanical', 'manufacturing', 'design', 'cad', 'production', 'maintenance', 'assembly', 'industrial'],
    'bsce': ['engineer', 'civil', 'construction', 'structural', 'infrastructure', 'building', 'project', 'architect', 'surveyor'],
  };

  // Find matching keywords for the course
  let keywords = [];
  for (const [key, words] of Object.entries(courseKeywords)) {
    if (courseLower.includes(key)) {
      keywords = words;
      break;
    }
  }

  // If no specific keywords found, use general engineering/IT terms
  if (keywords.length === 0 && (courseLower.includes('bs') || courseLower.includes('engineering'))) {
    keywords = ['engineer', 'developer', 'analyst', 'technician', 'specialist', 'coordinator'];
  }

  // Check if job title or company contains any of the keywords
  const matchFound = keywords.some(keyword => 
    jobLower.includes(keyword) || companyLower.includes(keyword)
  );

  return matchFound;
}

export default { isExperienceRelatedToCourse };
