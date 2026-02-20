'use server';

import { prisma } from '@/lib/db';
import { SegmentRuleGroup, SegmentEngine } from '@/lib/crm/segment-engine';
import { CampaignEngine } from '@/lib/crm/campaign-engine';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export async function getSegmentCount(rules: SegmentRuleGroup) {
    const session = await auth();
    if (!session?.user) return { count: 0 };

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { brokerId: true }
    });

    if (!user?.brokerId) return { count: 0 };

    const count = await SegmentEngine.previewCount(rules, user.brokerId);
    return { count };
}

export async function launchCampaign(data: {
    id?: string;
    name: string;
    subject: string;
    body: string;
    segmentRules: SegmentRuleGroup;
    scheduledFor?: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { brokerId: true }
    });

    if (!user?.brokerId) return { success: false, error: 'No broker profile' };

    try {
        // 1. Create or find segment
        const segment = await prisma.segment.create({
            data: {
                brokerId: user.brokerId,
                name: `${data.name} - Auto Segment`,
                rules: data.segmentRules as any,
            }
        });

        // 2. Create or update campaign
        let campaign;
        if (data.id) {
            campaign = await prisma.campaign.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    subject: data.subject,
                    content: data.body,
                    status: data.scheduledFor ? 'SCHEDULED' : 'SENDING',
                    scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
                }
            });
            // Clear old segments and add new one
            await prisma.campaignSegment.deleteMany({ where: { campaignId: campaign.id } });
        } else {
            campaign = await prisma.campaign.create({
                data: {
                    brokerId: user.brokerId,
                    name: data.name,
                    subject: data.subject,
                    content: data.body,
                    status: data.scheduledFor ? 'SCHEDULED' : 'SENDING',
                    scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
                }
            });
        }

        // 3. Link segment
        await prisma.campaignSegment.create({
            data: { campaignId: campaign.id, segmentId: segment.id }
        });

        // 4. Execute immediately if not scheduled
        if (!data.scheduledFor) {
            const result = await CampaignEngine.executeCampaign(campaign.id);
            revalidatePath('/campaigns');
            return { success: true, campaignId: campaign.id, ...result };
        }

        revalidatePath('/campaigns');
        return { success: true, campaignId: campaign.id, scheduled: true };
    } catch (error: any) {
        console.error('[launchCampaign] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveCampaignDraft(data: {
    id?: string;
    name: string;
    subject: string;
    body: string;
    segmentRules?: SegmentRuleGroup;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { brokerId: true }
    });

    if (!user?.brokerId) return { success: false, error: 'No broker profile' };

    try {
        let campaign;
        if (data.id) {
            campaign = await prisma.campaign.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    subject: data.subject,
                    content: data.body,
                    status: 'DRAFT',
                }
            });
        } else {
            campaign = await prisma.campaign.create({
                data: {
                    brokerId: user.brokerId,
                    name: data.name,
                    subject: data.subject,
                    content: data.body,
                    status: 'DRAFT',
                }
            });
        }

        // Save segment if provided
        if (data.segmentRules && data.segmentRules.conditions.length > 0) {
            const segment = await prisma.segment.create({
                data: {
                    brokerId: user.brokerId,
                    name: `${data.name} - Draft Segment`,
                    rules: data.segmentRules as any,
                }
            });
            await prisma.campaignSegment.deleteMany({ where: { campaignId: campaign.id } });
            await prisma.campaignSegment.create({
                data: { campaignId: campaign.id, segmentId: segment.id }
            });
        }

        revalidatePath('/campaigns');
        return { success: true, campaignId: campaign.id };
    } catch (error: any) {
        console.error('[saveCampaignDraft] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCampaigns() {
    const session = await auth();
    if (!session?.user) return [];

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { brokerId: true }
    });

    if (!user?.brokerId) return [];

    return prisma.campaign.findMany({
        where: { brokerId: user.brokerId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getCampaignStats() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { brokerId: true }
    });

    if (!user?.brokerId) return null;

    const [totalSent, totalOpened, totalClicked, totalBounced] = await Promise.all([
        prisma.sendEvent.count({ where: { brokerId: user.brokerId, type: 'SENT' } }),
        prisma.sendEvent.count({ where: { brokerId: user.brokerId, type: 'OPENED' } }),
        prisma.sendEvent.count({ where: { brokerId: user.brokerId, type: 'CLICKED' } }),
        prisma.sendEvent.count({ where: { brokerId: user.brokerId, type: 'BOUNCED' } }),
    ]);

    return { totalSent, totalOpened, totalClicked, totalBounced };
}

export async function getEngagementHistory(days = 30) {
    const session = await auth();
    if (!session?.user) return [];

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { brokerId: true }
    });

    if (!user?.brokerId) return [];

    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.sendEvent.findMany({
        where: { brokerId: user.brokerId, createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' }
    });

    return events;
}
