// GET /api/ai-status — lightweight Gemini API ping
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return NextResponse.json({ status: 'error', message: 'API 키 미설정' });
    }

    // To prevent burning the free quota by pinging every 60 seconds (1440 times a day per open tab),
    // we simply verify the API key is configured. The actual generate-image route will handle errors.
    return NextResponse.json({ status: 'ready', message: 'AI Ready (Key Configured)' });
}
