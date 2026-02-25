import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not configured');
            // If API key is not configured, fallback to manual immediately
            return NextResponse.json({ status: 'manual_fallback', message: 'API_KEY is not configured.' });
        }

        console.log('Starting image generation with primary model...');
        // 1. Try primary model: gemini-3-pro-image-preview
        let modelName = 'gemini-3-pro-image-preview';
        let result = await tryGenerateImage(modelName, prompt, apiKey);

        // 2. If rate limited, try fallback model: gemini-2.5-flash-image
        if (!result.success && result.isRateLimited) {
            console.log(`Primary model (${modelName}) rate limited. Falling back to flash...`);
            modelName = 'gemini-2.5-flash-image';
            result = await tryGenerateImage(modelName, prompt, apiKey);
        }

        // 3. Return results
        if (result.success && result.image) {
            return NextResponse.json({ status: 'success', image: result.image });
        } else if (result.isRateLimited) {
            console.log('Both models were rate limited. Triggering manual fallback.');
            return NextResponse.json({ status: 'manual_fallback', message: 'Rate limits exceeded for all available models.' });
        } else {
            console.error('Image generation failed:', result.error);
            return NextResponse.json({ error: result.error || 'Failed to generate image' }, { status: 500 });
        }

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function tryGenerateImage(modelName: string, prompt: string, apiKey: string) {
    try {
        // We use the REST API to ensure compatibility with newly named/experimental models
        // Typically these experimental models might use the generateContent endpoint and return inlineData.
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            })
        });

        if (response.status === 429) {
            return { success: false, isRateLimited: true };
        }

        if (response.status === 404 || response.status === 400) {
            // Models might use the old predict format if they are like imagen-3.0
            // Fallback to :predict endpoint for Imagen style payloads
            url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
            const predictResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: { sampleCount: 1 }
                })
            });

            if (predictResponse.status === 429) {
                return { success: false, isRateLimited: true };
            }

            if (predictResponse.ok) {
                response = predictResponse;
            }
        }

        if (!response.ok) {
            return { success: false, isRateLimited: response.status === 429, error: await response.text() };
        }

        const data = await response.json();

        // 1) Check generateContent format (inlineData in candidates)
        const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData || p.inline_data);
        const inlineData = part?.inlineData || part?.inline_data;
        if (inlineData) {
            return {
                success: true,
                image: `data:${inlineData.mimeType};base64,${inlineData.data}`
            };
        }

        // 2) Check predict format (predictions array for Imagen models)
        const prediction = data.predictions?.[0];
        if (prediction && prediction.bytesBase64Encoded) {
            return {
                success: true,
                image: `data:${prediction.mimeType || 'image/png'};base64,${prediction.bytesBase64Encoded}`
            };
        }

        // 3) Check alternative gemini outputs
        const b64 = data.candidates?.[0]?.output || data.predictions?.[0]?.content;
        if (typeof b64 === 'string' && b64.length > 1000) { // arbitrary length check for base64 probability
            return {
                success: true,
                image: `data:image/png;base64,${b64}`
            };
        }

        return { success: false, isRateLimited: false, error: 'No recognizable image data found in response.' };

    } catch (error: any) {
        return { success: false, isRateLimited: false, error: error.message };
    }
}
