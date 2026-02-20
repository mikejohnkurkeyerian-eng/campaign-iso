import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const segments = await prisma.segment.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(segments);
    } catch (error: any) {
        console.error("[API/segments GET] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, rules, brokerId } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Use provided brokerId or find/create a default one
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

        const segment = await prisma.segment.create({
            data: {
                brokerId: resolvedBrokerId,
                name,
                rules: rules || { logic: 'AND', conditions: [] },
            }
        });

        return NextResponse.json(segment, { status: 201 });
    } catch (error: any) {
        console.error("[API/segments POST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
