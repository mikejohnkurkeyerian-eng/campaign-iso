interface AIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface EmailDraft {
    subject: string;
    body: string;
}

export class AIAssistant {
    private static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private static async callOpenAI(prompt: string): Promise<any | null> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("[AI] OPENAI_API_KEY missing — using fallback templates.");
            return null;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                console.error(`[AI] OpenAI Error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) return JSON.parse(content);
            return null;
        } catch (error) {
            console.error("[AI] OpenAI call failed:", error);
            return null;
        }
    }

    static async generateEmailFromUserPrompt(
        context: {
            leadName: string;
            loanAmount?: number;
            phone?: string;
            email?: string;
            status?: string;
        },
        userPrompt: string
    ): Promise<{ subject: string; body: string }> {
        const prompt = `
            You are a professional marketing assistant.
            Write a marketing email for a contact named ${context.leadName}.
            
            Instructions: "${userPrompt}"
            
            Requirements:
            - Professional but personable tone
            - Concise (under 200 words)
            - Clear Call to Action
            - Use {{firstName}} as a merge tag for personalization
            
            Return JSON: { "subject": "...", "body": "..." }
        `;

        const aiResponse = await AIAssistant.callOpenAI(prompt);
        if (aiResponse) return aiResponse;

        await AIAssistant.delay(500);
        return {
            subject: "We'd Love to Connect",
            body: `Hi ${context.leadName},\n\n${userPrompt}\n\nPlease let me know if you have any questions.\n\nBest regards`
        };
    }
}
