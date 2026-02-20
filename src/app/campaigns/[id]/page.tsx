import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Send, Calendar, Users, BarChart3 } from "lucide-react";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
    let campaign: any = null;
    let sentCount = 0;
    let openedCount = 0;

    try {
        campaign = await prisma.campaign.findUnique({
            where: { id: params.id },
            include: {
                segments: { include: { segment: true } },
                _count: { select: { sendEvents: true } }
            }
        });

        if (campaign) {
            sentCount = await prisma.sendEvent.count({
                where: { campaignId: params.id, type: 'SENT' }
            });
            openedCount = await prisma.sendEvent.count({
                where: { campaignId: params.id, type: 'OPENED' }
            });
        }
    } catch (e) {
        console.error("[CampaignDetail] Error:", e);
    }

    if (!campaign) return notFound();

    const statusVariant = (): any => {
        switch (campaign.status) {
            case 'SENDING': return 'aurora';
            case 'SCHEDULED': return 'warning';
            case 'COMPLETED': return 'success';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Campaigns
            </Link>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">{campaign.name}</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                    </p>
                </div>
                <Badge variant={statusVariant()} className="text-sm px-3 py-1">
                    {campaign.status}
                </Badge>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Send className="w-5 h-5 text-aurora-blue" />
                        <div>
                            <p className="text-xl font-bold text-white">{sentCount}</p>
                            <p className="text-xs text-slate-500">Emails Sent</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-aurora-purple" />
                        <div>
                            <p className="text-xl font-bold text-white">{openedCount}</p>
                            <p className="text-xs text-slate-500">Opened</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Users className="w-5 h-5 text-aurora-green" />
                        <div>
                            <p className="text-xl font-bold text-white">{campaign.segments?.length || 0}</p>
                            <p className="text-xs text-slate-500">Segments</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Email Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Subject</p>
                        <p className="text-white">{campaign.subject || '—'}</p>
                    </div>
                    {campaign.content && (
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Body Preview</p>
                            <div className="p-4 rounded-xl bg-white text-gray-900 text-sm max-h-[400px] overflow-auto"
                                dangerouslySetInnerHTML={{ __html: campaign.content }} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Schedule Info */}
            {campaign.scheduledFor && (
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-aurora-purple" />
                        <div>
                            <p className="text-sm text-white">Scheduled for {format(new Date(campaign.scheduledFor), 'PPpp')}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
