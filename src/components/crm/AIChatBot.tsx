"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sparkles, Send, Copy, CheckCheck, Bot, User, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
}

interface AIChatBotProps {
    onApplySubject?: (subject: string) => void;
    onApplyBody?: (body: string) => void;
    className?: string;
}

export default function AIChatBot({ onApplySubject, onApplyBody, className }: AIChatBotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hey! 👋 I'm your Campaign AI. Tell me what kind of email you want to create and I'll write it for you.\n\nTry something like:\n- *\"Write a promo email for a spring sale with 20% off\"*\n- *\"Create a follow-up email for cold leads\"*\n- *\"Make a re-engagement email for inactive contacts\"*"
        }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim()
        };

        const assistantId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant',
            content: '',
            isStreaming: true
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInput('');
        setIsStreaming(true);

        try {
            const chatHistory = [...messages.filter(m => m.id !== 'welcome'), userMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            if (!response.ok) throw new Error('AI request failed');

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;

                setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                ));
            }

            // Mark streaming as complete
            setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
            ));
        } catch (error) {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: '⚠️ Something went wrong. Please try again.', isStreaming: false }
                    : m
            ));
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast({ title: "Copied to clipboard!", variant: 'success' });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const extractSubject = (content: string): string | null => {
        const match = content.match(/\*\*Subject(?:\s*Line)?:?\*\*\s*(.+)/i)
            || content.match(/Subject(?:\s*Line)?:\s*(.+)/i);
        return match ? match[1].trim() : null;
    };

    const extractBody = (content: string): string | null => {
        const match = content.match(/\*\*Body:?\*\*\s*([\s\S]+?)(?=\n\n\*\*|$)/i)
            || content.match(/Body:\s*([\s\S]+?)(?=\n\n|$)/i);
        return match ? match[1].trim() : null;
    };

    return (
        <Card className={cn(
            "flex flex-col overflow-hidden transition-all duration-300",
            isExpanded ? "fixed inset-4 z-50 max-w-none" : "max-h-[600px]",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-aurora-purple/10 to-aurora-blue/10">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-aurora-gradient flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-white">Campaign AI</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                            {isStreaming ? '● Thinking...' : '● Online'}
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded
                        ? <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                        : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    }
                </Button>
            </div>

            {/* Messages */}
            <div className={cn(
                "flex-1 overflow-y-auto p-4 space-y-4",
                isExpanded ? "max-h-none" : "max-h-[420px]"
            )}>
                {messages.map(message => (
                    <div key={message.id} className={cn("flex gap-3", message.role === 'user' && "flex-row-reverse")}>
                        {/* Avatar */}
                        <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            message.role === 'assistant'
                                ? "bg-aurora-purple/20 text-aurora-purple"
                                : "bg-aurora-blue/20 text-aurora-blue"
                        )}>
                            {message.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                            "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                            message.role === 'assistant'
                                ? "bg-white/5 border border-white/5 text-slate-200"
                                : "bg-aurora-blue/15 border border-aurora-blue/20 text-white"
                        )}>
                            <MessageContent content={message.content} isStreaming={message.isStreaming} />

                            {/* Actions for assistant messages */}
                            {message.role === 'assistant' && !message.isStreaming && message.id !== 'welcome' && (
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
                                    <Button
                                        variant="ghost" size="sm"
                                        className="h-6 text-[10px] text-slate-500 hover:text-white px-2"
                                        onClick={() => copyToClipboard(message.content, message.id)}
                                    >
                                        {copiedId === message.id
                                            ? <CheckCheck className="w-3 h-3 mr-1 text-green-400" />
                                            : <Copy className="w-3 h-3 mr-1" />
                                        }
                                        Copy
                                    </Button>
                                    {onApplySubject && extractSubject(message.content) && (
                                        <Button
                                            variant="ghost" size="sm"
                                            className="h-6 text-[10px] text-aurora-blue hover:text-aurora-blue/80 px-2"
                                            onClick={() => onApplySubject(extractSubject(message.content)!)}
                                        >
                                            Use Subject
                                        </Button>
                                    )}
                                    {onApplyBody && extractBody(message.content) && (
                                        <Button
                                            variant="ghost" size="sm"
                                            className="h-6 text-[10px] text-aurora-purple hover:text-aurora-purple/80 px-2"
                                            onClick={() => onApplyBody(extractBody(message.content)!)}
                                        >
                                            Use Body
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-surface-raised/50">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={isStreaming ? "AI is thinking..." : "Ask me to write an email..."}
                        disabled={isStreaming}
                        className="flex-1 h-9 text-sm"
                    />
                    <Button
                        type="submit"
                        variant="aurora"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={isStreaming || !input.trim()}
                    >
                        {isStreaming
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                        }
                    </Button>
                </div>
            </form>
        </Card>
    );
}

// ─── Markdown-lite renderer with streaming cursor ──────
function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
    if (!content && isStreaming) {
        return (
            <div className="flex items-center gap-1.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-aurora-purple animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-aurora-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-aurora-pink animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        );
    }

    // Simple markdown rendering
    const renderContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Bold
            line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
            // Italic
            line = line.replace(/\*(.+?)\*/g, '<em class="text-slate-300">$1</em>');
            // Inline code
            line = line.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 text-aurora-blue text-xs">$1</code>');

            if (!line.trim()) return <br key={i} />;
            if (line.startsWith('- ')) {
                return <div key={i} className="flex gap-2 ml-1"><span className="text-aurora-purple">•</span><span dangerouslySetInnerHTML={{ __html: line.slice(2) }} /></div>;
            }
            return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />;
        });
    };

    return (
        <div className="space-y-1">
            {renderContent(content)}
            {isStreaming && (
                <span className="inline-block w-2 h-4 bg-aurora-purple/70 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
        </div>
    );
}
