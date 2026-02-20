import { prisma } from "@/lib/db";
import { Lead } from "@prisma/client";

export type SegmentOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'array_contains';

export interface SegmentCondition {
    field: string;
    operator: SegmentOperator;
    value: any;
}

export interface SegmentRuleGroup {
    logic: 'AND' | 'OR';
    conditions: SegmentCondition[];
}

export class SegmentEngine {
    static async previewCount(rules: SegmentRuleGroup, brokerId: string): Promise<number> {
        try {
            const dynamicWhere = this.buildWhereClause(rules);
            const finalWhere = {
                AND: [
                    { assignedTo: { brokerId: brokerId } },
                    dynamicWhere
                ]
            };
            const count = await prisma.lead.count({ where: finalWhere });
            return count;
        } catch (error) {
            console.error("[SegmentEngine] Preview failed:", error);
            return 0;
        }
    }

    static async getSegmentLeads(segmentId: string): Promise<Lead[]> {
        const segment = await prisma.segment.findUnique({
            where: { id: segmentId },
            select: { rules: true }
        });

        if (!segment || !segment.rules) return [];

        try {
            const rules = segment.rules as unknown as SegmentRuleGroup;
            const whereClause = this.buildWhereClause(rules);
            return await prisma.lead.findMany({ where: whereClause });
        } catch (error) {
            console.error(`[SegmentEngine] Failed to evaluate segment ${segmentId}:`, error);
            return [];
        }
    }

    private static buildWhereClause(group: SegmentRuleGroup): any {
        if (!group.conditions || group.conditions.length === 0) {
            return { id: 'SAFETY_BLOCK_NO_MATCH' };
        }

        const filters = group.conditions.map(condition => {
            const { field, operator, value } = condition;
            const cleanField = field ? field.trim() : '';
            let cleanValue = value;
            if (typeof value === 'string') cleanValue = value.trim();

            switch (operator) {
                case 'equals':
                    return { [cleanField]: { equals: cleanValue } };
                case 'contains':
                    if (cleanField === 'tags') {
                        return { [cleanField]: { has: cleanValue } };
                    }
                    return { [cleanField]: { contains: cleanValue, mode: 'insensitive' } };
                case 'gt':
                    return { [field]: { gt: Number(value) } };
                case 'lt':
                    return { [field]: { lt: Number(value) } };
                case 'gte':
                    return { [field]: { gte: Number(value) } };
                case 'lte':
                    return { [field]: { lte: Number(value) } };
                case 'in':
                    return { [field]: { in: Array.isArray(value) ? value : [value] } };
                default:
                    return {};
            }
        });

        if (group.logic === 'OR') {
            return { OR: filters };
        } else {
            return { AND: filters };
        }
    }
}
