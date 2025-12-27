import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text, sourceLang, targetLang, image, mimeType } = await request.json();

        const apiKey = process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured. Please add GOOGLE_AI_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        let prompt = `You are "K-Context," an expert cultural translator for international students in Korea.

Your goal is not just to translate, but to "bridge the gap" by providing practical, safety, and cultural details a foreigner might miss.

FOR EVERY INPUT, RETURN A JSON OBJECT WITH THESE FIELDS:

1. "natural_translation": The best English equivalent. If it's a menu/list, return a summarized translation of the key items.
2. "politeness_level": (Banmal/Jondetmal/Honorific) or "N/A" for objects.
3. "context_clue": Cultural context or hidden meaning (e.g., "This is a popular hangover cure").
4. "practical_tips": CRITICAL INFO for foreigners. 
   - IF MENU: List main ingredients, flavor profile (e.g., "Very Spicy"), and potential allergens (Peanuts, Shellfish, Pork, etc.).
   - IF DOCUMENT/FORM: Explain what action is required (e.g., "You need to sign at the bottom").
   - IF SIGN/RULE: Explain the restriction clearly.
5. "word_breakdown": A list of objects with "word" and "meaning" fields.
6. "safe_score": 1-10 (1 = Dangerous/Offensive, 10 = Safe/Recommended).

Input text: "${text || "No text provided, please analyze the image."}"

Return ONLY the JSON object, no additional text.`;

        if (image) {
            prompt = `You are "K-Context," a smart assistant for foreigners in Korea.
LOOK AT THE IMAGE PROVIDED.
1. Identify the content type (Menu, Document, Sign, Chat).
2. Translate all visible text relevance to the user.
3. Think: "What would a foreigner find confusing or dangerous about this?" (e.g. unknown ingredients, complex rules).
4. Provide those insights in the 'practical_tips' field.

${prompt}`;
        }

        const parts: any[] = [{ text: prompt }];

        if (image && mimeType) {
            parts.unshift({
                inlineData: {
                    mimeType: mimeType,
                    data: image
                }
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: parts
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 8192,
                        responseMimeType: "application/json",
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
                    practical_tips: "Please check your internet connection or API key configuration.",
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
