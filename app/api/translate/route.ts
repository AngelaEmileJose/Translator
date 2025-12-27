import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text, sourceLang, targetLang } = await request.json();

        const apiKey = process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured. Please add GOOGLE_AI_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        const prompt = `You are "K-Context," a translator for international students in Korea.

Your goal is to explain Korean social dynamics, slang, and context.

FOR EVERY INPUT, RETURN A JSON OBJECT WITH THESE FIELDS:

1. "natural_translation": The best English equivalent for the situation.
2. "politeness_level": (Banmal/Jondetmal/Honorific) and who you say it to.
3. "context_clue": Explain the hidden meaning (e.g., "This sounds like you are annoyed" or "This is MZ generation slang").
4. "word_breakdown": A list of objects with "word" and "meaning" fields for key words.
5. "safe_score": 1-10 (1 = Offensive, 10 = Safe for professors).

STRICT RULE: If the input is slang (e.g., '자만추', '갑분싸'), explain the full phrase it was shortened from.

Input text: "${text}"

Return ONLY the JSON object, no additional text.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google AI API Error:', errorData);

            // Return the actual error to help debug
            return NextResponse.json(
                {
                    error: `Google AI Error: ${errorData.error?.message || 'Unknown error'}`,
                    natural_translation: `API Error: ${errorData.error?.code} - ${errorData.error?.message}`,
                    politeness_level: "N/A",
                    context_clue: "API connection failed. Check your API key and model access.",
                    word_breakdown: [],
                    safe_score: 5
                },
                { status: 200 } // Return 200 so frontend shows the error message
            );
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        const generatedText = data.candidates[0].content.parts[0].text;

        // Parse JSON from response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const translationData = JSON.parse(jsonMatch[0]);
            return NextResponse.json(translationData);
        } else {
            return NextResponse.json(
                { error: 'Invalid response format from AI' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed. Please try again.' },
            { status: 500 }
        );
    }
}
