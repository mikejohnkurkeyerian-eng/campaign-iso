"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Eye, Loader2, Filter } from 'lucide-react';
import type { SegmentRuleGroup, SegmentCondition, SegmentOperator } from '@/lib/crm/segment-engine';

interface SegmentBuilderProps {
    initialRules?: SegmentRuleGroup;
    initialName?: string;
    onSave?: (name: string, rules: SegmentRuleGroup) => Promise<void>;
    mode?: 'create' | 'edit';
}

const FIELD_OPTIONS = [
    { value: 'status', label: 'Lead Status' },
    { value: 'source', label: 'Source' },
    { value: 'tags', label: 'Tags' },
    { value: 'state', label: 'State' },
    { value: 'loanType', label: 'Loan Type' },
    { value: 'loanAmount', label: 'Loan Amount' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
];

const OPERATOR_OPTIONS = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'lt', label: 'Less Than' },
    { value: 'gte', label: '≥ (GTE)' },
    { value: 'lte', label: '≤ (LTE)' },
    { value: 'in', label: 'Is In' },
];

export default function SegmentBuilder({ initialRules, initialName, onSave, mode = 'create' }: SegmentBuilderProps) {
    const [name, setName] = useState(initialName || '');
    const [rules, setRules] = useState<SegmentRuleGroup>(initialRules || { logic: 'AND', conditions: [] });
    const [saving, setSaving] = useState(false);

    const addCondition = () => {
        setRules({
            ...rules,
            conditions: [...rules.conditions, { field: 'status', operator: 'equals' as SegmentOperator, value: '' }]
        });
    };

    const updateCondition = (index: number, updates: Partial<SegmentCondition>) => {
        const newConditions = [...rules.conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        setRules({ ...rules, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        setRules({ ...rules, conditions: rules.conditions.filter((_, i) => i !== index) });
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ title: 'Name required', variant: 'destructive' });
            return;
        }
        if (rules.conditions.length === 0) {
            toast({ title: 'Add at least one rule', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            if (onSave) await onSave(name, rules);
            toast({ title: `Segment ${mode === 'create' ? 'created' : 'updated'}!`, variant: 'success' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-aurora-purple" />
                    {mode === 'create' ? 'Create Segment' : 'Edit Segment'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Segment Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hot Leads in California" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Match Logic</Label>
                        <Select value={rules.logic} onValueChange={(v: string) => setRules({ ...rules, logic: v as 'AND' | 'OR' })}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AND">Match ALL</SelectItem>
                                <SelectItem value="OR">Match ANY</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-3">
                    {rules.conditions.map((condition, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 animate-fade-in">
                            <Select value={condition.field} onValueChange={(v: string) => updateCondition(idx, { field: v })}>
                                <SelectTrigger className="w-36 h-8 text-xs">
                                    <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={condition.operator} onValueChange={(v: string) => updateCondition(idx, { operator: v as SegmentOperator })}>
                                <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue placeholder="Op" />
                                </SelectTrigger>
                                <SelectContent>
                                    {OPERATOR_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Input
                                value={condition.value || ''}
                                onChange={e => updateCondition(idx, { value: e.target.value })}
                                placeholder="Value"
                                className="h-8 text-xs flex-1"
                            />

                            <Button variant="ghost" size="icon" onClick={() => removeCondition(idx)} className="h-8 w-8 text-red-400 hover:text-red-300">
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))}

                    <Button variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule
                    </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                    <Button variant="aurora" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        {mode === 'create' ? 'Create Segment' : 'Save Changes'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
