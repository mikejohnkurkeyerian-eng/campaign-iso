import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const segment = await prisma.segment.findUnique({
            where: { id: params.id }
        });
        if (!segment) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(segment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const segment = await prisma.segment.update({
            where: { id: params.id },
            data: { name: body.name, rules: body.rules }
        });
        return NextResponse.json(segment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await prisma.segment.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
