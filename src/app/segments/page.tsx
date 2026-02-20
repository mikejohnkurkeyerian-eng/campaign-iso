"use client";

import React, { useEffect, useState } from 'react';
import SegmentBuilder from '@/components/crm/SegmentBuilder';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Filter, Trash2, Edit, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Segment {
    id: string;
    name: string;
    rules: any;
    createdAt: string;
}

export default function SegmentsPage() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSegments = async () => {
        try {
            const res = await fetch('/api/segments');
            if (res.ok) {
                const data = await res.json();
                setSegments(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSegments(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this segment?')) return;
        try {
            const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Segment deleted', variant: 'success' });
                fetchSegments();
            }
        } catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Segments</h1>
                    <p className="text-slate-400 text-sm mt-1">Create audience segments to target your campaigns.</p>
                </div>
                <Link href="/segments/new">
                    <Button variant="aurora" size="lg">
                        <Plus className="w-4 h-4 mr-2" /> New Segment
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12"><p className="text-slate-500 animate-pulse">Loading segments...</p></div>
            ) : segments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No segments yet.</p>
                        <p className="text-sm text-slate-600">Create your first audience segment to target campaigns.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {segments.map(seg => (
                        <Card key={seg.id} className="hover:border-white/20 transition-colors group">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-aurora-purple/10">
                                        <Filter className="w-4 h-4 text-aurora-purple" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{seg.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px]">
                                                {seg.rules?.conditions?.length || 0} rules
                                            </Badge>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(seg.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(seg.id)} className="h-8 w-8 text-red-400 hover:text-red-300">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
