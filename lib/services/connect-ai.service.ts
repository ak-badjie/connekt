import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SubscriptionService } from './subscription.service';
import { AIUsageQuota, AIRequestLog } from '@/lib/types/subscription-tiers.types';
import { ExtendedUserProfile, Experience } from '@/lib/types/profile.types';
import { Task, ProjectMember } from '@/lib/types/workspace.types';
import { ExtendedMailMessage, ContractType } from '@/lib/types/mail.types';

// Initialize Gemini AI - Check NEXT_PUBLIC_ prefix first for client-side usage
const GOOGLE_AI_API_KEY =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

/**
 * AI Response Types
 */
export interface CandidateMatch {
    userId: string;
    username: string;
    displayName: string;
    photoURL?: string;
    matchScore: number; // 0-100
    matchReasons: string[];
    strengths: string[];
    weaknesses: string[];
    skills: string[];
    experience: number; // years
    availability?: string;
    hourlyRate?: number;
}

export interface CandidateComparison {
    candidates: CandidateMatch[];
    comparison: {
        skillsMatrix: Record<string, Record<string, boolean>>; // skill -> { candidateId: hasSkill }
        strengthsComparison: string[];
        recommendation: string;
        topCandidate: string; // userId
    };
}

export interface TaskSuggestion {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedHours?: number;
    suggestedAssignee?: string; // username
    skills: string[];
}

export interface TaskAssignment {
    taskId: string;
    assigneeId: string;
    assigneeUsername: string;
    confidence: number; // 0-100
    reason: string;
}

export interface UserMatch {
    userId: string;
    username: string;
    displayName: string;
    matchScore: number;
    relevantSkills: string[];
    recommendationReason: string;
}

/**
 * Connect AI Service
 * Central AI orchestration using Gemini 2.5 Pro
 */
export const ConnectAIService = {
    /**
     * Get or create AI model instance
     */
    getModel(): GenerativeModel {
        if (!genAI) {
            throw new Error('Google AI API key not configured');
        }
        return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    },

    /**
     * Check if user has AI quota remaining
     */
    async checkQuota(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        try {
            // Check if user has Connect AI subscription
            const hasAI = await SubscriptionService.hasFeature(userId, 'aiResumeParser');
            if (!hasAI) {
                return { allowed: false, remaining: 0, limit: 0 };
            }

            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const quotaRef = doc(db, 'ai_usage_quotas', `${userId}_${currentMonth}`);
            const quotaSnap = await getDoc(quotaRef);

            if (!quotaSnap.exists()) {
                // Create new quota for the month
                const tier = await SubscriptionService.getUserTier(userId);
                const features = SubscriptionService.getTierFeatures(tier);
                const limit = features.aiRequestsPerMonth;

                const quota: AIUsageQuota = {
                    userId,
                    tier,
                    month: currentMonth,
                    requestsUsed: 0,
                    requestsLimit: limit,
                    costAccrued: 0,
                    tokensUsed: 0,
                    lastResetDate: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };

                await setDoc(quotaRef, quota);
                return { allowed: true, remaining: limit, limit };
            }

            const quota = quotaSnap.data() as AIUsageQuota;
            const remaining = quota.requestsLimit - quota.requestsUsed;

            return {
                allowed: remaining > 0,
                remaining,
                limit: quota.requestsLimit,
            };
        } catch (error) {
            console.error('Error checking AI quota:', error);
            return { allowed: false, remaining: 0, limit: 0 };
        }
    },

    /**
     * Track AI usage
     */
    async trackUsage(
        userId: string,
        feature: string,
        tokensUsed: number,
        costUSD: number,
        success: boolean,
        error?: string
    ): Promise<void> {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const quotaRef = doc(db, 'ai_usage_quotas', `${userId}_${currentMonth}`);

            // Update quota
            await updateDoc(quotaRef, {
                requestsUsed: (await getDoc(quotaRef)).data()?.requestsUsed + 1 || 1,
                tokensUsed: (await getDoc(quotaRef)).data()?.tokensUsed + tokensUsed || tokensUsed,
                costAccrued: (await getDoc(quotaRef)).data()?.costAccrued + costUSD || costUSD,
                updatedAt: serverTimestamp(),
            });

            // Log request
            const log: any = {
                userId,
                feature,
                model: 'gemini-2.0-flash-exp',
                tokensUsed,
                costUSD,
                success,
                timestamp: serverTimestamp(),
            };

            // Only add error field if it exists (Firestore doesn't accept undefined)
            if (error) {
                log.error = error;
            }

            await setDoc(doc(collection(db, 'ai_request_logs')), log);
        } catch (error) {
            console.error('Error tracking AI usage:', error);
        }
    },

    /**
     * Generate text with Gemini
     */
    async generateText(prompt: string, userId: string, feature: string): Promise<string> {
        const startTime = Date.now();

        try {
            // Check quota
            const { allowed } = await this.checkQuota(userId);
            if (!allowed) {
                throw new Error('AI quota exceeded. Please upgrade your plan or wait until next month.');
            }

            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Estimate tokens and cost (rough estimate)
            const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
            const costUSD = tokensUsed * 0.000001; // Example rate

            await this.trackUsage(userId, feature, tokensUsed, costUSD, true);

            return text;
        } catch (error: any) {
            console.error('AI generation error:', error);
            await this.trackUsage(userId, feature, 0, 0, false, error.message);
            throw error;
        }
    },

    // ===========================================
    // PROFILE AI FEATURES
    // ===========================================

    /**
     * Parse resume and extract profile data
     */
    async parseResumeToProfile(resumeText: string, userId: string): Promise<Partial<ExtendedUserProfile>> {
        const prompt = `You are an expert HR assistant. Parse the following resume and extract structured profile information.

Resume:
${resumeText}

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, just raw JSON):
{
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

        try {
            const response = await this.generateText(prompt, userId, 'resume_parser');

            // Clean up response (remove markdown if present)
            let cleanedResponse = response.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(cleanedResponse);

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

            return parsed;
        } catch (error: any) {
            console.error('Resume parsing error:', error);
            throw new Error('Failed to parse resume. Please try again or enter information manually.');
        }
    },

    /**
     * Enhance profile bio/description
     */
    async enhanceProfileDescription(currentBio: string, skills: string[], experience: Experience[], userId: string): Promise<string> {
        const prompt = `You are a professional profile writer. Enhance the following bio to be more compelling and professional.

Current Bio: ${currentBio || 'None provided'}
Skills: ${skills.join(', ')}
Experience: ${experience.map(e => `${e.title} at ${e.company}`).join(', ')}

Write a professional, engaging bio (2-3 sentences) that highlights strengths and expertise. Be concise and impactful.`;

        return await this.generateText(prompt, userId, 'profile_enhancer');
    },

    /**
     * Suggest skills based on experience
     */
    async suggestSkillsFromExperience(experience: Experience[], currentSkills: string[], userId: string): Promise<string[]> {
        const prompt = `Based on the following work experience, suggest 10 relevant professional skills that are missing from the current skill list.

Experience:
${experience.map(e => `- ${e.title} at ${e.company}: ${e.description}`).join('\n')}

Current Skills: ${currentSkills.join(', ')}

Return ONLY a JSON array of skill strings: ["skill1", "skill2", ...]`;

        const response = await this.generateText(prompt, userId, 'skill_suggester');

        try {
            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }
            return JSON.parse(cleaned);
        } catch {
            return [];
        }
    },

    // ===========================================
    // RECRUITING AI FEATURES
    // ===========================================

    /**
     * Find best candidates for a job
     */
    async findBestCandidates(
        jobDescription: string,
        requirements: string[],
        maxResults: number = 10,
        userId: string
    ): Promise<CandidateMatch[]> {
        try {
            // Get all user profiles from database
            const profilesQuery = query(
                collection(db, 'user_profiles'),
                where('role', 'in', ['va', 'employer']) // VAs and freelancers
            );
            const profilesSnap = await getDocs(profilesQuery);
            const profiles: ExtendedUserProfile[] = profilesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ExtendedUserProfile));

            // Use AI to rank candidates
            const candidatesData = profiles.slice(0, 50).map(p => ({ // Limit to 50 for token constraints
                userId: p.uid,
                username: p.username,
                displayName: p.displayName,
                skills: p.skills || [],
                title: p.title,
                experience: p.experience?.length || 0,
                bio: p.bio,
                availability: p.availability,
                hourlyRate: p.hourlyRate,
            }));

            const prompt = `You are an expert recruiter. Rank these ${candidatesData.length} candidates for the following job.

Job Description: ${jobDescription}
Requirements: ${requirements.join(', ')}

Candidates:
${JSON.stringify(candidatesData, null, 2)}

Return ONLY a JSON array of the top ${maxResults} candidates ranked by match score (0-100), with this structure:
[{
  "userId": "user_id",
  "username": "username",
  "displayName": "Name",
  "matchScore": 85,
  "matchReasons": ["reason1", "reason2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}]`;

            const response = await this.generateText(prompt, userId, 'candidate_matching');

            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }

            const rankings = JSON.parse(cleaned);

            // Enrich with full profile data
            return rankings.map((r: any) => {
                const profile = profiles.find(p => p.uid === r.userId);
                return {
                    ...r,
                    photoURL: profile?.photoURL,
                    skills: profile?.skills || [],
                    experience: profile?.experience?.length || 0,
                    availability: profile?.availability,
                    hourlyRate: profile?.hourlyRate,
                };
            });
        } catch (error: any) {
            console.error('Candidate matching error:', error);
            throw error;
        }
    },

    /**
     * Compare multiple candidates
     */
    async compareCandidates(
        candidateIds: string[],
        jobDescription: string,
        userId: string
    ): Promise<CandidateComparison> {
        try {
            // Fetch candidate profiles
            const candidates: CandidateMatch[] = [];
            for (const candidateId of candidateIds) {
                const profileRef = doc(db, 'user_profiles', candidateId);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    const profile = profileSnap.data() as ExtendedUserProfile;
                    candidates.push({
                        userId: profile.uid,
                        username: profile.username,
                        displayName: profile.displayName,
                        photoURL: profile.photoURL,
                        matchScore: 0, // Will be filled by AI
                        matchReasons: [],
                        strengths: [],
                        weaknesses: [],
                        skills: profile.skills || [],
                        experience: profile.experience?.length || 0,
                        availability: profile.availability,
                        hourlyRate: profile.hourlyRate,
                    });
                }
            }

            const prompt = `Compare these candidates for the job and provide detailed analysis.

Job: ${jobDescription}

Candidates:
${JSON.stringify(candidates, null, 2)}

Return ONLY valid JSON with this structure:
{
  "comparison": {
    "skillsMatrix": { "skill1": { "user1": true, "user2": false }, ... },
    "strengthsComparison": ["Candidate A has X", "Candidate B excels at Y"],
    "recommendation": "Detailed recommendation explaining who to hire and why",
    "topCandidate": "userId_of_best_match"
  }
}`;

            const response = await this.generateText(prompt, userId, 'candidate_comparison');

            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }

            const result = JSON.parse(cleaned);
            return { candidates, ...result };
        } catch (error: any) {
            console.error('Candidate comparison error:', error);
            throw error;
        }
    },

    /**
     * Generate job description from title and requirements
     */
    async generateJobDescription(title: string, skills: string[], userId: string): Promise<string> {
        const prompt = `Generate a comprehensive, professional job description for:

Job Title: ${title}
Required Skills: ${skills.join(', ')}

Include:
- Brief company/role overview
- Key responsibilities (5-7 bullet points)
- Required qualifications 
- Preferred qualifications
- What we offer

Be professional and compelling. Format in markdown.`;

        return await this.generateText(prompt, userId, 'job_description_generator');
    },

    // ===========================================
    // CONTRACT & MAIL AI FEATURES
    // ===========================================

    /**
     * Draft a contract
     */
    async draftContract(
        type: ContractType,
        variables: Record<string, any>,
        userId: string
    ): Promise<string> {
        const prompt = `Draft a professional ${type.replace(/_/g, ' ')} contract with the following details:

${JSON.stringify(variables, null, 2)}

Include:
- Professional legal language
- Clear terms and conditions
- Payment terms
- Timeline
- Termination clause
- Signature section

Format in professional markdown. Be thorough but concise.`;

        return await this.generateText(prompt, userId, 'contract_drafter');
    },

    /**
     * Draft an email
     */
    async draftEmail(
        description: string,
        tone: 'formal' | 'casual' | 'persuasive',
        userId: string
    ): Promise<{ subject: string; body: string }> {
        const prompt = `Write a ${tone} email based on this description:

${description}

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Email body in markdown format"
}`;

        const response = await this.generateText(prompt, userId, 'email_composer');

        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        return JSON.parse(cleaned);
    },

    /**
     * Summarize email thread
     */
    async summarizeConversation(mailThread: ExtendedMailMessage[], userId: string): Promise<string> {
        const prompt = `Summarize this email conversation:

${mailThread.map((m, i) => `Email ${i + 1} (${m.senderName}): ${m.subject}\n${m.body}`).join('\n\n---\n\n')}

Provide:
1. Brief summary (2-3 sentences)
2. Key points discussed
3. Action items (if any)
4. Decisions made`;

        return await this.generateText(prompt, userId, 'email_summarizer');
    },

    // ===========================================
    // PROJECT & TASK AI FEATURES
    // ===========================================

    /**
     * Generate tasks from project description
     */
    async generateTasksFromProject(
        projectDescription: string,
        teamMembers: ProjectMember[],
        userId: string
    ): Promise<TaskSuggestion[]> {
        const prompt = `Break down this project into specific, actionable tasks:

Project: ${projectDescription}

Team Members: ${teamMembers.map(m => `${m.username} (${m.role})`).join(', ')}

Generate 5-10 tasks. Return ONLY valid JSON array:
[{
  "title": "Task title",
  "description": "Detailed task description",
  "priority": "low|medium|high|urgent",
  "estimatedHours": 8,
  "suggestedAssignee": "username or null",
  "skills": ["skill1", "skill2"]
}]`;

        const response = await this.generateText(prompt, userId, 'task_generator');

        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        return JSON.parse(cleaned);
    },

    /**
     * Auto-assign tasks to team members
     */
    async autoAssignTasks(
        tasks: TaskSuggestion[],
        teamProfiles: ExtendedUserProfile[],
        userId: string
    ): Promise<TaskAssignment[]> {
        const prompt = `Assign these tasks to the most suitable team members based on their skills:

Tasks:
${JSON.stringify(tasks, null, 2)}

Team:
${JSON.stringify(teamProfiles.map(p => ({
            userId: p.uid,
            username: p.username,
            skills: p.skills,
            title: p.title
        })), null, 2)}

Return ONLY valid JSON array:
[{
  "taskTitle": "Task title",
  "assigneeId": "userId",
  "assigneeUsername": "username",
  "confidence": 85,
  "reason": "Why this person is best fit"
}]`;

        const response = await this.generateText(prompt, userId, 'task_auto_assignment');

        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        return JSON.parse(cleaned);
    },

    /**
     * Suggest team members for a project
     */
    async suggestTeamMembers(
        projectDescription: string,
        requiredSkills: string[],
        maxMembers: number,
        userId: string
    ): Promise<UserMatch[]> {
        try {
            // Get available users
            const usersQuery = query(
                collection(db, 'user_profiles'),
                where('availability', '==', 'available'),
                limit(50)
            );
            const usersSnap = await getDocs(usersQuery);
            const users = usersSnap.docs.map(doc => doc.data() as ExtendedUserProfile);

            const prompt = `Find the best ${maxMembers} team members for this project:

Project: ${projectDescription}
Required Skills: ${requiredSkills.join(', ')}

Available Users:
${JSON.stringify(users.map(u => ({
                userId: u.uid,
                username: u.username,
                displayName: u.displayName,
                title: u.title,
                skills: u.skills,
                hourlyRate: u.hourlyRate
            })), null, 2)}

Return ONLY valid JSON array (top ${maxMembers}):
[{
  "userId": "user_id",
  "username": "username",
  "displayName": "name",
  "matchScore": 90,
  "relevantSkills": ["skill1", "skill2"],
  "recommendationReason": "Why they're a good fit"
}]`;

            const response = await this.generateText(prompt, userId, 'team_recommender');

            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }

            return JSON.parse(cleaned);
        } catch (error: any) {
            console.error('Team suggestion error:', error);
            throw error;
        }
    },
};
