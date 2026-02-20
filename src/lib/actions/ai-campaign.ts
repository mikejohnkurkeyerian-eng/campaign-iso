'use server';

import { AIAssistant } from "@/lib/ai-assistant";

export async function generateCampaignContent(
    audience: string,
    goal: string,
    tone: 'professional' | 'friendly' | 'urgent' = 'professional'
) {
    try {
        const prompt = `
            Write a high-converting marketing email.
            
            Target Audience: ${audience}
            Campaign Goal: ${goal}
            Tone: ${tone}
            
            Requirements:
            1. Subject Line: Catchy, relevant, under 50 chars.
            2. Body:
               - Focus on BENEFITS
               - Concise (under 250 words)
               - Clear Call to Action
            3. Use {{firstName}} as merge tag
            4. Use HTML for formatting
            
            Return ONLY JSON: { "subject": "...", "body": "..." }
        `;

        const dummyContext = {
            leadName: "{{firstName}}",
            status: "Target Audience",
            loanAmount: 0
        };

        const result = await AIAssistant.generateEmailFromUserPrompt(dummyContext, prompt);

        return {
            success: true,
            subject: result.subject,
            body: result.body
        };
    } catch (error) {
        console.error("[AI Campaign] Generation Error:", error);
        return { success: false, error: "Failed to generate content." };
    }
}
