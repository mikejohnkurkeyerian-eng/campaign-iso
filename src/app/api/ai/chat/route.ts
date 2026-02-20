import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const { messages, systemPrompt } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        // Fallback: simulate streaming with a canned response
        const fallback = "Hi! I'm your Campaign AI assistant. I can help you write email subjects, body copy, calls-to-action, and more. However, my AI backend isn't configured yet — please add your OPENAI_API_KEY to the environment variables to unlock full AI capabilities.\n\nIn the meantime, here's a sample email:\n\n**Subject:** Don't Miss Out — Exclusive Offer Inside\n\n**Body:**\nHi {{firstName}},\n\nWe wanted to reach out with an exclusive opportunity just for you...\n\nBest regards,\nYour Team";

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const words = fallback.split(' ');
                for (const word of words) {
                    controller.enqueue(encoder.encode(word + ' '));
                    await new Promise(r => setTimeout(r, 30));
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
        });
    }

    try {
        const openaiMessages = [
            {
                role: "system",
                content: systemPrompt || `You are a professional campaign email assistant. Help the user craft compelling marketing emails, subject lines, and campaign copy. Be creative, concise, and action-oriented. When generating email content, use {{firstName}} as a merge tag for personalization. Format your responses with clear sections using markdown. If asked to generate an email, always include both a Subject line and Body.`
            },
            ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: openaiMessages,
                stream: true,
                temperature: 0.8,
                max_tokens: 1500,
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("[AI Chat] OpenAI Error:", response.status, err);
            return new Response(`AI Error: ${response.status}`, { status: 500 });
        }

        // Forward the SSE stream directly, transforming OpenAI's SSE into plain text
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = response.body!.getReader();

        const stream = new ReadableStream({
            async start(controller) {
                let buffer = '';
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6).trim();
                                if (data === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(encoder.encode(content));
                                    }
                                } catch { /* skip malformed chunks */ }
                            }
                        }
                    }
                } catch (e) {
                    console.error("[AI Chat] Stream error:", e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
        });
    } catch (error: any) {
        console.error("[AI Chat] Error:", error);
        return new Response(error.message, { status: 500 });
    }
}
