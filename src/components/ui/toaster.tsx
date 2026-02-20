"use client"

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Toaster() {
    const { toasts } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={cn(
                        "animate-slide-up rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl",
                        t.variant === 'destructive' && "border-red-500/30 bg-red-950/80 text-red-200",
                        t.variant === 'success' && "border-green-500/30 bg-green-950/80 text-green-200",
                        (!t.variant || t.variant === 'default') && "border-white/10 bg-surface-raised/90 text-white"
                    )}
                >
                    {t.title && <p className="font-semibold text-sm">{t.title}</p>}
                    {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
                </div>
            ))}
        </div>
    );
}
