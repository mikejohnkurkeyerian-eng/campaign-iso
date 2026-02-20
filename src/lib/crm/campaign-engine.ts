import { prisma } from "@/lib/db";
import { SegmentEngine } from "./segment-engine";
import { sendEmail } from "@/lib/email";
import { Campaign, Lead, Broker } from "@prisma/client";

export class CampaignEngine {
    static async executeCampaign(campaignId: string) {
        console.log(`[CampaignEngine] Starting campaign ${campaignId}`);

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                segments: { include: { segment: true } },
                broker: true
            }
        });

        if (!campaign) throw new Error("Campaign not found");
        if (campaign.status !== 'SCHEDULED' && campaign.status !== 'SENDING') {
            console.log(`[CampaignEngine] Status is ${campaign.status}, skipping.`);
            return;
        }

        // 1. Resolve Audience
        const allLeads = new Map<string, Lead>();
        for (const campaignSegment of campaign.segments) {
            const leads = await SegmentEngine.getSegmentLeads(campaignSegment.segmentId);
            leads.forEach(lead => allLeads.set(lead.id, lead));
        }

        console.log(`[CampaignEngine] Audience size: ${allLeads.size}`);

        // 2. Update Status
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'SENDING' }
        });

        // 3. Send Loop
        let sentCount = 0;
        let failedCount = 0;

        for (const lead of Array.from(allLeads.values())) {
            if (!lead.email) continue;

            try {
                const personalizedBody = this.personalizeContent(campaign.content || "", lead, campaign.broker);
                const personalizedSubject = this.personalizeContent(campaign.subject || "", lead, campaign.broker);

                const result = await sendEmail({
                    to: lead.email,
                    subject: personalizedSubject,
                    html: personalizedBody,
                    senderName: campaign.fromEmail || campaign.broker.name,
                    replyTo: campaign.replyTo || undefined
                });

                await prisma.sendEvent.create({
                    data: {
                        brokerId: campaign.brokerId,
                        type: result.success ? 'SENT' : 'FAILED',
                        campaignId: campaign.id,
                        leadId: lead.id,
                        messageId: (result as any).messageId || undefined,
                        metadata: { error: (result as any).error }
                    }
                });

                if (result.success) sentCount++;
                else failedCount++;
            } catch (err) {
                console.error(`[CampaignEngine] Failed to send to ${lead.email}:`, err);
                failedCount++;
            }
        }

        // 4. Mark Complete
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
        });

        console.log(`[CampaignEngine] Done. Sent: ${sentCount}, Failed: ${failedCount}`);
        return { sentCount, failedCount };
    }

    private static personalizeContent(content: string, lead: Lead, broker: Broker): string {
        let text = content;
        text = text.replace(/{{firstName}}/g, lead.firstName || "");
        text = text.replace(/{{lastName}}/g, lead.lastName || "");
        text = text.replace(/{{email}}/g, lead.email || "");
        text = text.replace(/{{phone}}/g, lead.phone || "");
        text = text.replace(/{{brokerName}}/g, broker.name || "");
        return text;
    }
}
