'use server';

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

interface Recipient {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    tags?: string;
}

export async function launchCampaign(data: {
    id?: string;
    name: string;
    subject: string;
    body: string;
    recipients: Recipient[];
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
        // 1. Create or update campaign
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

        // 2. Send to each recipient directly
        if (!data.scheduledFor) {
            let sentCount = 0;
            let failCount = 0;

            for (const recipient of data.recipients) {
                try {
                    // Personalize the email
                    const personalizedSubject = data.subject
                        .replace(/\{\{firstName\}\}/g, recipient.firstName || '')
                        .replace(/\{\{lastName\}\}/g, recipient.lastName || '')
                        .replace(/\{\{email\}\}/g, recipient.email)
                        .replace(/\{\{company\}\}/g, recipient.company || '');

                    const personalizedBody = data.body
                        .replace(/\{\{firstName\}\}/g, recipient.firstName || '')
                        .replace(/\{\{lastName\}\}/g, recipient.lastName || '')
                        .replace(/\{\{email\}\}/g, recipient.email)
                        .replace(/\{\{company\}\}/g, recipient.company || '');

                    // Send the email
                    await sendEmail({
                        to: recipient.email,
                        subject: personalizedSubject,
                        html: personalizedBody,
                    });

                    // Log send event
                    await prisma.sendEvent.create({
                        data: {
                            brokerId: user.brokerId,
                            campaignId: campaign.id,
                            type: 'SENT',
                            metadata: { email: recipient.email, firstName: recipient.firstName, lastName: recipient.lastName },
                        }
                    });

                    sentCount++;
                } catch (error: any) {
                    console.error(`[Campaign] Failed to send to ${recipient.email}:`, error.message);
                    failCount++;
                }
            }

            // Update campaign status
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    status: 'SENT',
                }
            });

            revalidatePath('/campaigns');
            return { success: true, campaignId: campaign.id, sentCount, failCount };
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
    recipients?: Recipient[];
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
