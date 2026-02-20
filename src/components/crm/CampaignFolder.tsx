"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Send, FileText, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Campaign {
    id: string;
    name: string;
    status: string;
    subject?: string | null;
    createdAt: Date | string;
}

interface CampaignFolderProps {
    campaigns: Campaign[];
}

export default function CampaignFolder({ campaigns }: CampaignFolderProps) {
    const ongoing = campaigns.filter(c => c.status === 'SENDING' || c.status === 'SCHEDULED');
    const drafts = campaigns.filter(c => c.status === 'DRAFT');
    const completed = campaigns.filter(c => c.status === 'COMPLETED');

    return (
        <div className="space-y-4">
            <FolderSection
                title="Active Campaigns"
                icon={<Send className="w-4 h-4" />}
                count={ongoing.length}
                campaigns={ongoing}
                accentColor="text-aurora-blue"
                accentBg="bg-aurora-blue/10"
                badgeVariant="aurora"
                emptyMessage="No active campaigns"
                defaultOpen={true}
            />
            <FolderSection
                title="Drafts"
                icon={<FileText className="w-4 h-4" />}
                count={drafts.length}
                campaigns={drafts}
                accentColor="text-yellow-400"
                accentBg="bg-yellow-500/10"
                badgeVariant="warning"
                emptyMessage="No draft campaigns"
                defaultOpen={true}
            />
            <FolderSection
                title="Completed"
                icon={<CheckCircle2 className="w-4 h-4" />}
                count={completed.length}
                campaigns={completed}
                accentColor="text-green-400"
                accentBg="bg-green-500/10"
                badgeVariant="success"
                emptyMessage="No completed campaigns"
                defaultOpen={false}
            />
        </div>
    );
}

function FolderSection({ title, icon, count, campaigns, accentColor, accentBg, badgeVariant, emptyMessage, defaultOpen }: {
    title: string; icon: React.ReactNode; count: number; campaigns: Campaign[];
    accentColor: string; accentBg: string; badgeVariant: any; emptyMessage: string; defaultOpen: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className={`w-4 h-4 ${accentColor}`} /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <div className={`p-1.5 rounded-lg ${accentBg}`}>
                        <span className={accentColor}>{icon}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{title}</span>
                </div>
                <Badge variant={badgeVariant}>{count}</Badge>
            </button>

            {isOpen && (
                <div className="border-t border-white/5">
                    {campaigns.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6">{emptyMessage}</p>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {campaigns.map(c => (
                                <Link key={c.id} href={`/campaigns/${c.id}`} className="block px-4 py-3 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white group-hover:text-aurora-blue transition-colors truncate">{c.name}</p>
                                            {c.subject && <p className="text-xs text-slate-500 truncate mt-0.5">Subject: {c.subject}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
