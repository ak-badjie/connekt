import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Gemini Service
 * Core wrapper for Google Gemini AI API
 */

const GOOGLE_AI_API_KEY =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;
const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

export interface GeminiGenerationOptions {
    temperature?: number;
    maxOutputTokens?: number;
    topK?: number;
    topP?: number;
}

export interface GeminiResponse {
    text: string;
    tokensUsed: number;
    estimatedCost: number;
}

export const GeminiService = {
    /**
     * Check if API is configured
     */
    isConfigured(): boolean {
        return !!genAI;
    },

    /**
     * Get model instance
     */
    getModel(modelName: string = 'gemini-2.0-flash-exp'): GenerativeModel {
        if (!genAI) {
            throw new Error('Google AI API key not configured');
        }
        return genAI.getGenerativeModel({ model: modelName });
    },

    /**
     * Generate text from prompt
     */
    async generateText(
        prompt: string,
        options?: GeminiGenerationOptions
    ): Promise<GeminiResponse> {
        if (!genAI) {
            throw new Error(
                'Google AI API key not configured. ' +
                'Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file. ' +
                'Note: Client-side components require the NEXT_PUBLIC_ prefix!'
            );
        }

        try {
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Estimate tokens and cost
            const tokensUsed = this.estimateTokens(prompt, text);
            const estimatedCost = this.estimateCost(tokensUsed);

            return {
                text,
                tokensUsed,
                estimatedCost,
            };
        } catch (error: any) {
            console.error('Gemini generation error:', error);
            throw new Error(`AI generation failed: ${error.message}`);
        }
    },

    /**
     * Generate text from file using multimodal API (supports images, PDFs, etc.)
     */
    async generateFromFile(
        base64Data: string,
        mimeType: string,
        prompt: string,
        options?: GeminiGenerationOptions
    ): Promise<GeminiResponse> {
        if (!genAI) {
            throw new Error(
                'Google AI API key not configured. ' +
                'Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file. ' +
                'Note: Client-side components require the NEXT_PUBLIC_ prefix!'
            );
        }

        try {
            const model = this.getModel();

            // Create multimodal content
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = result.response;
            const text = response.text();

            // Estimate tokens and cost
            const tokensUsed = this.estimateTokens(prompt, text);
            const estimatedCost = this.estimateCost(tokensUsed);

            return {
                text,
                tokensUsed,
                estimatedCost,
            };
        } catch (error: any) {
            console.error('Gemini file generation error:', error);
            throw new Error(`AI file processing failed: ${error.message}`);
        }
    },


    /**
     * Generate text with streaming (for real-time display)
     */
    async *generateTextStream(
        prompt: string,
        options?: GeminiGenerationOptions
    ): AsyncGenerator<string> {
        if (!genAI) {
            throw new Error('Google AI API key not configured');
        }

        try {
            const model = this.getModel();
            const result = await model.generateContentStream(prompt);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                yield chunkText;
            }
        } catch (error: any) {
            console.error('Gemini streaming error:', error);
            throw new Error(`AI streaming failed: ${error.message}`);
        }
    },

    /**
     * Parse JSON response from AI
     */
    parseJSONResponse<T>(response: string): T {
        try {
            // Clean up markdown code blocks if present
            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }

            return JSON.parse(cleaned);
        } catch (error) {
            console.error('JSON parsing error:', error);
            throw new Error('Failed to parse AI response as JSON');
        }
    },

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(prompt: string, response: string): number {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil((prompt.length + response.length) / 4);
    },

    /**
     * Estimate cost in USD (rough approximation for gemini-2.0-flash-exp)
     */
    estimateCost(tokens: number): number {
        // Rough estimate: $0.000001 per token
        return tokens * 0.000001;
    },

    /**
     * Create a structured prompt for JSON responses
     */
    createJSONPrompt(instruction: string, data: any, schema: string): string {
        return `${instruction}

Input Data:
${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, just raw JSON):
${schema}`;
    },
};
