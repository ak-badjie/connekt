import { Timestamp } from 'firebase/firestore';
import { GeminiService } from './gemini.service';
import { ExtendedUserProfile, Experience } from '@/lib/types/profile.types';

/**
 * Profile AI Service
 * Handles all AI operations related to user profiles
 */
export const ProfileAIService = {
    /**
     * Parse resume from file using Gemini's multimodal API
     * Supports images, PDFs, DOCX, TXT - AI handles everything
     */
    async parseResumeFromFile(base64Data: string, mimeType: string): Promise<Partial<ExtendedUserProfile>> {
        const schema = `{
  "displayName": "Full Name",
  "title": "Professional Title/Role",
  "bio": "Professional summary/bio (2-3 sentences)",
  "phone": "Phone number if present",
  "location": "City, Country",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "current": true/false,
      "description": "Job description"
    }
  ],
  "education": [
    {
      "school": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "location": "Location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "current": true/false,
      "description": "Description if any"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "issueDate": "YYYY-MM",
      "credentialId": "ID if present"
    }
  ]
}`;

        const prompt = `You are an expert HR assistant. Analyze this resume file (it may be an image, PDF, or document) and extract ALL structured profile information you can find.

Extract and return the data in this EXACT JSON format:
${schema}

Important:
- Extract ALL information visible in the document
- For dates, use YYYY-MM format
- Set "current" to true for ongoing positions/education
- Be thorough and extract as much detail as possible
- Return ONLY valid JSON, no markdown formatting or explanations`;

        const response = await GeminiService.generateFromFile(base64Data, mimeType, prompt);
        const parsed = GeminiService.parseJSONResponse<any>(response.text);

        // Convert date strings to Timestamps for Firestore
        if (parsed.experience) {
            parsed.experience = parsed.experience.map((exp: any) => ({
                id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...exp,
                startDate: exp.startDate ? Timestamp.fromDate(new Date(exp.startDate)) : null,
                endDate: exp.endDate ? Timestamp.fromDate(new Date(exp.endDate)) : null,
            }));
        }

        if (parsed.education) {
            parsed.education = parsed.education.map((edu: any) => ({
                id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...edu,
                startDate: edu.startDate ? Timestamp.fromDate(new Date(edu.startDate)) : null,
                endDate: edu.endDate ? Timestamp.fromDate(new Date(edu.endDate)) : null,
            }));
        }

        if (parsed.certifications) {
            parsed.certifications = parsed.certifications.map((cert: any) => ({
                id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...cert,
                issueDate: cert.issueDate ? Timestamp.fromDate(new Date(cert.issueDate)) : null,
            }));
        }

        return {
            ...parsed,
            tokensUsed: response.tokensUsed,
            estimatedCost: response.estimatedCost,
        };
    },

    /**
     * Parse resume text and extract profile data
     */
    async parseResumeToProfile(resumeText: string): Promise<Partial<ExtendedUserProfile>> {
        const schema = `{
  "displayName": "Full Name",
  "title": "Professional Title/Role",
  "bio": "Professional summary/bio (2-3 sentences)",
  "phone": "Phone number if present",
  "location": "City, Country",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "current": true/false,
      "description": "Job description"
    }
  ],
  "education": [
    {
      "school": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "location": "Location",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "current": true/false,
      "description": "Description if any"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "issueDate": "YYYY-MM",
      "credentialId": "ID if present"
    }
  ]
}`;

        const prompt = GeminiService.createJSONPrompt(
            'You are an expert HR assistant. Parse the following resume and extract structured profile information.',
            resumeText,
            schema
        );

        const response = await GeminiService.generateText(prompt);
        const parsed = GeminiService.parseJSONResponse<any>(response.text);

        // Convert date strings to Timestamps for Firestore
        if (parsed.experience) {
            parsed.experience = parsed.experience.map((exp: any) => ({
                id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...exp,
                startDate: exp.startDate ? Timestamp.fromDate(new Date(exp.startDate)) : null,
                endDate: exp.endDate ? Timestamp.fromDate(new Date(exp.endDate)) : null,
            }));
        }

        if (parsed.education) {
            parsed.education = parsed.education.map((edu: any) => ({
                id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...edu,
                startDate: edu.startDate ? Timestamp.fromDate(new Date(edu.startDate)) : null,
                endDate: edu.endDate ? Timestamp.fromDate(new Date(edu.endDate)) : null,
            }));
        }

        if (parsed.certifications) {
            parsed.certifications = parsed.certifications.map((cert: any) => ({
                id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...cert,
                issueDate: cert.issueDate ? Timestamp.fromDate(new Date(cert.issueDate)) : null,
            }));
        }

        return {
            ...parsed,
            tokensUsed: response.tokensUsed,
            estimatedCost: response.estimatedCost,
        };
    },

    /**
     * Enhance bio/description with AI
     */
    async enhanceBio(
        currentBio: string,
        skills?: string[],
        experience?: Experience[]
    ): Promise<string> {
        const contextParts: string[] = [];

        if (currentBio) {
            contextParts.push(`Current Bio: ${currentBio}`);
        }

        if (skills && skills.length > 0) {
            contextParts.push(`Skills: ${skills.join(', ')}`);
        }

        if (experience && experience.length > 0) {
            contextParts.push(`Experience: ${experience.map(e => `${e.title} at ${e.company}`).join(', ')}`);
        }

        const prompt = `You are a professional profile writer. ${currentBio ? 'Enhance' : 'Write'} a compelling professional bio based on the following information.

${contextParts.join('\n')}

Write a professional, engaging bio (2-4 sentences) that highlights strengths and expertise. Be concise, impactful, and written in first person.

Return ONLY the enhanced bio text, no explanations or formatting.`;

        const response = await GeminiService.generateText(prompt);
        return response.text.trim();
    },

    /**
     * Suggest missing skills based on experience
     */
    async suggestSkills(
        experience: Experience[],
        currentSkills: string[]
    ): Promise<string[]> {
        const prompt = `Based on the following work experience, suggest 10 relevant professional skills that are missing from the current skill list.

Experience:
${experience.map(e => `- ${e.title} at ${e.company}: ${e.description}`).join('\n')}

Current Skills: ${currentSkills.join(', ')}

Return ONLY a JSON array of skill strings: ["skill1", "skill2", ...]`;

        const response = await GeminiService.generateText(prompt);
        return GeminiService.parseJSONResponse<string[]>(response.text);
    },

    /**
     * Generate profile title/headline from experience and skills
     */
    async generateTitle(
        skills: string[],
        experience?: Experience[]
    ): Promise<string> {
        const prompt = `Generate a professional profile title/headline (5-10 words) based on:

Skills: ${skills.join(', ')}
${experience ? `\nRecent Experience: ${experience.slice(0, 2).map(e => `${e.title} at ${e.company}`).join(', ')}` : ''}

Return ONLY the title, no explanations.`;

        const response = await GeminiService.generateText(prompt);
        return response.text.trim();
    },
};
