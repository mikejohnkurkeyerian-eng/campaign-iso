"use client";

import AIChatBot from "@/components/crm/AIChatBot";
import { Sparkles } from "lucide-react";

export default function AIAssistantPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-aurora-gradient flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white">Campaign AI Assistant</h1>
                        <p className="text-slate-400 text-sm">Your AI-powered email copywriter. Ask it to generate anything.</p>
                    </div>
                </div>
            </div>

            <AIChatBot className="min-h-[600px] max-h-[700px]" />
        </div>
    );
}
