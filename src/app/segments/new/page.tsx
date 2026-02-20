"use client";

import { useRouter } from 'next/navigation';
import SegmentBuilder from '@/components/crm/SegmentBuilder';
import type { SegmentRuleGroup } from '@/lib/crm/segment-engine';

export default function NewSegmentPage() {
    const router = useRouter();

    const handleSave = async (name: string, rules: SegmentRuleGroup) => {
        const res = await fetch('/api/segments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rules })
        });
        if (!res.ok) throw new Error('Failed to create segment');
        router.push('/segments');
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white">Create Segment</h1>
                <p className="text-slate-400 text-sm mt-1">Define rules to group your audience.</p>
            </div>
            <SegmentBuilder onSave={handleSave} mode="create" />
        </div>
    );
}
