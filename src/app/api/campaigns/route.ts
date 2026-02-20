import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { sendEvents: true } }
            }
        });
        return NextResponse.json(campaigns);
    } catch (error: any) {
        console.error("[API/campaigns GET] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, subject, content, status, brokerId } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        let resolvedBrokerId = brokerId;
        if (!resolvedBrokerId) {
            const defaultBroker = await prisma.broker.findFirst();
            if (defaultBroker) {
                resolvedBrokerId = defaultBroker.id;
            } else {
                const newBroker = await prisma.broker.create({
                    data: { name: 'Default Organization' }
                });
                resolvedBrokerId = newBroker.id;
            }
        }

        const campaign = await prisma.campaign.create({
            data: {
                brokerId: resolvedBrokerId,
                name,
                subject,
                content,
                status: status || 'DRAFT',
            }
        });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error: any) {
        console.error("[API/campaigns POST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
