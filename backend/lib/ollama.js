import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Call Ollama API with a specific model
 * @param {string} model - Model name (e.g., 'neural-chat', 'mistral')
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options (temperature, etc.)
 * @returns {Promise<string>} - The generated response
 */
async function callOllama(model, prompt, options = {}) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        ...options
      }
    });

    return response.data.response;
  } catch (error) {
    console.error(`Error calling Ollama with ${model}:`, error.message);
    throw new Error(`Failed to generate response from ${model}`);
  }
}

/**
 * Check if a job experience is related to an academic course using neural-chat
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
  
  // Step 2: If keywords say NOT related, double-check with neural-chat
  console.log(`[Keyword No Match] Checking with neural-chat: ${jobTitle} for ${course}`);
  
  try {
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

    const response = await callOllama('neural-chat', prompt, { temperature: 0.3 });
    const text = response.trim().toUpperCase();

    // Check if the response contains YES
    const aiMatch = text.includes("YES");
    console.log(`[neural-chat] ${jobTitle} is ${aiMatch ? 'RELATED' : 'NOT RELATED'} to ${course}`);
    return aiMatch;
  } catch (error) {
    console.error("Error using neural-chat:", error.message);
    // If AI fails, trust the keyword matching result (not related)
    return false;
  }
}

/**
 * Extract work experience and skills from CV using Mistral
 * @param {string} cvText - The extracted text from the CV
 * @returns {Promise<{experience: Array, skills: Array}>} - Extracted experience and skills
 */
export async function extractCVData(cvText) {
  try {
    const prompt = `Extract work experience and skills from the following CV text. Return ONLY a valid JSON object with no additional text, explanation, or markdown formatting.

The JSON must have this exact structure:
{
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "description": "Job description"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

CV Text:
${cvText}

Remember: Return ONLY the JSON object, nothing else.`;

    const response = await callOllama('mistral', prompt, { temperature: 0.3 });
    
    // Try to extract JSON from the response
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!data.experience || !data.skills) {
      throw new Error('Invalid JSON structure: missing experience or skills');
    }
    
    // Ensure experience is an array
    if (!Array.isArray(data.experience)) {
      data.experience = [];
    }
    
    // Ensure skills is an array
    if (!Array.isArray(data.skills)) {
      data.skills = [];
    }
    
    console.log(`[Mistral] Extracted ${data.experience.length} experiences and ${data.skills.length} skills`);
    
    return {
      experience: data.experience,
      skills: data.skills
    };
  } catch (error) {
    console.error("Error extracting CV data with Mistral:", error.message);
    throw new Error('Failed to extract CV data. Please try again or enter manually.');
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

export default { isExperienceRelatedToCourse, extractCVData };
