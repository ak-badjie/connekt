import { NextResponse } from 'next/server';

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

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: 'OPENAI_API_KEY is not configured on the server.',
                    hint: 'Set OPENAI_API_KEY in your environment (.env.local) and restart the dev server.'
                },
                { status: 501 }
            );
        }

        const prompt = [
            `Project title: ${safeTitle}`,
            `Project description: ${safeDescription}`,
            '',
            'Generate a modern project cover image (square 1:1).',
            '- No text, no typography, no letters, no watermarks, no logos.',
            '- Clean, high-quality, modern, tech-forward aesthetic.',
            '- Abstract shapes / subtle gradients / tasteful 3D lighting.',
            '- Suitable as a dashboard project cover.'
        ].join('\n');

        const res = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-image-1',
                prompt,
                size: '1024x1024',
                response_format: 'b64_json'
            })
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json(
                { error: 'Image generation failed', details: text },
                { status: 502 }
            );
        }

        const json = (await res.json()) as any;
        const imageBase64: string | undefined = json?.data?.[0]?.b64_json;

        if (!imageBase64) {
            return NextResponse.json(
                { error: 'Image generation returned no image data' },
                { status: 502 }
            );
        }

        return NextResponse.json({
            imageBase64,
            mimeType: 'image/png',
            prompt
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Unexpected error' },
            { status: 500 }
        );
    }
}
