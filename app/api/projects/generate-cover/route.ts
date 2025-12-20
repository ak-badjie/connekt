import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

type RequestBody = {
    title?: string;
    description?: string;
};

export async function POST(req: Request) {
    try {
        const { title, description } = (await req.json()) as RequestBody;

        const safeTitle = (title || '').trim();
        const safeDescription = (description || '').trim();

        if (!safeTitle || !safeDescription) {
            return NextResponse.json(
                { error: 'Missing required fields: title, description' },
                { status: 400 }
            );
        }

        // Use Gemini API key (same as your existing AI setup)
        const apiKey = 
            process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
            process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ||
            process.env.GOOGLE_AI_API_KEY ||
            process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                {
                    error: 'Gemini API key is not configured on the server.',
                    hint: 'Set NEXT_PUBLIC_GEMINI_API_KEY in your environment (.env.local) and restart the dev server.'
                },
                { status: 501 }
            );
        }

        const prompt = [
            `Generate a modern project cover image for:`,
            `Project title: ${safeTitle}`,
            `Project description: ${safeDescription}`,
            '',
            'Requirements:',
            '- Square 1:1 aspect ratio',
            '- No text, no typography, no letters, no watermarks, no logos',
            '- Clean, high-quality, modern, tech-forward aesthetic',
            '- Abstract shapes, subtle gradients, tasteful 3D lighting',
            '- Suitable as a dashboard project cover',
            '- Professional and visually appealing'
        ].join('\n');

        // Use Gemini 2.0 Flash with image generation
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                // @ts-ignore - responseModalities is available in newer API
                responseModalities: ['image', 'text'],
            }
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        
        // Check for image in the response parts
        let imageBase64: string | undefined;
        let mimeType = 'image/png';

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageBase64 = part.inlineData.data;
                mimeType = part.inlineData.mimeType || 'image/png';
                break;
            }
        }

        if (!imageBase64) {
            // Fallback: Generate a placeholder gradient image
            return NextResponse.json(
                { 
                    error: 'Image generation not available. Gemini 2.0 Flash image output may not be enabled for your API key.',
                    hint: 'Ensure your Gemini API key has access to image generation features.'
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            imageBase64,
            mimeType,
            prompt
        });
    } catch (error: any) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: error?.message || 'Unexpected error during image generation' },
            { status: 500 }
        );
    }
}
