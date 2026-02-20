import { getCampaigns, getCampaignStats } from "@/lib/actions/crm";
import CampaignFolder from "@/components/crm/CampaignFolder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Mail, Eye, MousePointerClick, AlertTriangle } from "lucide-react";

export default async function CampaignsPage() {
    let campaigns: any[] = [];
    let stats: any = null;

    try {
        campaigns = await getCampaigns();
        stats = await getCampaignStats();
    } catch (e) {
        console.error("[CampaignsPage] Error loading data:", e);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Campaigns</h1>
                    <p className="text-slate-400 text-sm mt-1">Create, manage, and track your email campaigns.</p>
                </div>
                <Link href="/campaigns/new">
                    <Button variant="aurora" size="lg">
                        <Plus className="w-4 h-4 mr-2" /> New Campaign
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <StatCard icon={<Mail className="w-5 h-5" />} label="Total Sent" value={stats.totalSent} color="text-aurora-blue" />
                    <StatCard icon={<Eye className="w-5 h-5" />} label="Opened" value={stats.totalOpened} color="text-aurora-purple" />
                    <StatCard icon={<MousePointerClick className="w-5 h-5" />} label="Clicked" value={stats.totalClicked} color="text-aurora-green" />
                    <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Bounced" value={stats.totalBounced} color="text-red-400" />
                </div>
            )}

            {/* Campaign List */}
            <CampaignFolder campaigns={campaigns} />
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <Card className="aurora-glow">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-white/5 ${color}`}>{icon}</div>
                <div>
                    <p className="text-2xl font-heading font-bold text-white">{value.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
