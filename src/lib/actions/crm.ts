'use server';

import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

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
    try {
        let sentCount = 0;
        let failCount = 0;
        const errors: string[] = [];

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

                console.log(`[Campaign] ✅ Sent to ${recipient.email}`);
                sentCount++;
            } catch (error: any) {
                console.error(`[Campaign] ❌ Failed to send to ${recipient.email}:`, error.message);
                errors.push(`${recipient.email}: ${error.message}`);
                failCount++;
            }
        }

        console.log(`[Campaign] Complete: ${sentCount} sent, ${failCount} failed`);

        if (sentCount === 0) {
            return { success: false, error: `All emails failed. ${errors[0] || 'Unknown error'}` };
        }

        return { success: true, sentCount, failCount };
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
    // For now, just return success - drafts are client-side only until DB is connected
    console.log(`[Draft] Saved "${data.name}" with ${data.recipients?.length || 0} recipients`);
    return { success: true, campaignId: 'draft-' + Date.now() };
}

// Stub functions for other pages that may reference these
export async function getCampaigns() {
    return [];
}

export async function getCampaignStats() {
    return { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0 };
}

export async function getEngagementHistory(days = 30) {
    return [];
}
