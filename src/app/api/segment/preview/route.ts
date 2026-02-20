import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SegmentEngine } from "@/lib/crm/segment-engine";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { rules, brokerId } = body;

        if (!rules) {
            return NextResponse.json({ error: "Rules are required" }, { status: 400 });
        }

        const count = await SegmentEngine.previewCount(rules, brokerId || '');
        return NextResponse.json({ count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
