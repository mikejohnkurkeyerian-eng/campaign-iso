"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { launchCampaign, saveCampaignDraft, getSegmentCount } from "@/lib/actions/crm";
import { generateCampaignContent } from "@/lib/actions/ai-campaign";
import { SegmentRuleGroup, SegmentCondition } from "@/lib/crm/segment-engine";
import { Users, Pen, Send, ChevronRight, ChevronLeft, Sparkles, Upload, Plus, Trash2, Eye, Loader2 } from "lucide-react";

type Step = 1 | 2 | 3;

interface CampaignBuilderProps {
    campaignId?: string;
    initialData?: {
        id: string;
        name: string;
        subject: string;
        content: string;
        segmentRules?: SegmentRuleGroup;
    };
    onComplete?: () => void;
}

export default function CampaignBuilderFinal({ campaignId, initialData, onComplete }: CampaignBuilderProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    // Form state
    const [name, setName] = useState(initialData?.name || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [body, setBody] = useState(initialData?.content || '');
    const [segmentRules, setSegmentRules] = useState<SegmentRuleGroup>(
        initialData?.segmentRules || { logic: 'AND', conditions: [] }
    );

    const handleNext = () => { if (step < 3) setStep((step + 1) as Step); };
    const handleBack = () => { if (step > 1) setStep((step - 1) as Step); };

    const handleLaunch = async () => {
        if (!name || !subject || !body) {
            toast({ title: "Missing fields", description: "Please fill in campaign name, subject, and body.", variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            const result = await launchCampaign({
                id: campaignId || initialData?.id,
                name, subject, body,
                segmentRules,
            });
            if (result?.success) {
                toast({ title: "🚀 Campaign Launched!", description: `Sent to audience. ${(result as any).sentCount || 0} emails delivered.`, variant: 'success' });
                router.push('/campaigns');
            } else {
                toast({ title: "Launch Failed", description: (result as any)?.error || 'Unknown error', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!name) {
            toast({ title: "Name required", description: "Please enter a campaign name.", variant: 'destructive' });
            return;
        }
        setIsSavingDraft(true);
        try {
            const result = await saveCampaignDraft({
                id: campaignId || initialData?.id,
                name, subject, body,
                segmentRules: segmentRules.conditions.length > 0 ? segmentRules : undefined,
            });
            if (result?.success) {
                toast({ title: "💾 Draft Saved", variant: 'success' });
                router.push('/campaigns');
            } else {
                toast({ title: "Save Failed", description: (result as any)?.error, variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingDraft(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                <StepIndicator step={1} current={step} label="Audience" icon={<Users className="w-4 h-4" />} />
                <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-aurora-blue' : 'bg-white/10'} transition-colors`} />
                <StepIndicator step={2} current={step} label="Design" icon={<Pen className="w-4 h-4" />} />
                <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-aurora-blue' : 'bg-white/10'} transition-colors`} />
                <StepIndicator step={3} current={step} label="Review" icon={<Send className="w-4 h-4" />} />
            </div>

            {/* Step Content */}
            <Card className="animate-fade-in">
                <CardContent className="p-8">
                    {step === 1 && (
                        <AudienceStep
                            name={name} setName={setName}
                            segmentRules={segmentRules} setSegmentRules={setSegmentRules}
                            handleNext={handleNext}
                        />
                    )}
                    {step === 2 && (
                        <DesignStep
                            subject={subject} setSubject={setSubject}
                            body={body} setBody={setBody}
                            handleBack={handleBack} handleNext={handleNext}
                        />
                    )}
                    {step === 3 && (
                        <ReviewStep
                            name={name} segmentRules={segmentRules}
                            subject={subject} body={body}
                            handleBack={handleBack} handleLaunch={handleLaunch}
                            handleSaveDraft={handleSaveDraft}
                            isLoading={isLoading} isSavingDraft={isSavingDraft}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Step 1: Audience ────────────────────────────────
function AudienceStep({ name, setName, segmentRules, setSegmentRules, handleNext }: any) {
    const [audienceCount, setAudienceCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const addCondition = () => {
        setSegmentRules({
            ...segmentRules,
            conditions: [...segmentRules.conditions, { field: 'status', operator: 'equals', value: 'NEW' }]
        });
    };

    const updateCondition = (index: number, updates: Partial<SegmentCondition>) => {
        const newConditions = [...segmentRules.conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        setSegmentRules({ ...segmentRules, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        setSegmentRules({
            ...segmentRules,
            conditions: segmentRules.conditions.filter((_: any, i: number) => i !== index)
        });
    };

    const previewAudience = async () => {
        setLoading(true);
        try {
            const result = await getSegmentCount(segmentRules);
            setAudienceCount(result.count);
        } catch { setAudienceCount(0); }
        finally { setLoading(false); }
    };

    const fieldOptions = [
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

    const operatorOptions = [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'gt', label: 'Greater Than' },
        { value: 'lt', label: 'Less Than' },
        { value: 'in', label: 'Is In' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-1">Define Your Audience</h2>
                <p className="text-slate-400 text-sm">Name your campaign and set up targeting rules.</p>
            </div>

            <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Spring Promotion 2026"
                    className="text-lg"
                />
            </div>

            {/* Segment Rules */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Targeting Rules</Label>
                    <div className="flex gap-2">
                        <Select value={segmentRules.logic} onValueChange={(v: string) => setSegmentRules({ ...segmentRules, logic: v })}>
                            <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AND">Match ALL</SelectItem>
                                <SelectItem value="OR">Match ANY</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {segmentRules.conditions.map((condition: SegmentCondition, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                        <Select value={condition.field} onValueChange={(v: string) => updateCondition(idx, { field: v })}>
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldOptions.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={condition.operator} onValueChange={(v: string) => updateCondition(idx, { operator: v as any })}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Operator" />
                            </SelectTrigger>
                            <SelectContent>
                                {operatorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule
                    </Button>
                    <Button variant="outline" size="sm" onClick={previewAudience} disabled={loading || segmentRules.conditions.length === 0}>
                        {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        Preview Audience
                    </Button>
                </div>

                {audienceCount !== null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-aurora-blue/10 border border-aurora-blue/20">
                        <Users className="w-4 h-4 text-aurora-blue" />
                        <span className="text-sm text-aurora-blue font-medium">{audienceCount} contacts match your criteria</span>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <Button variant="aurora" onClick={handleNext}>
                    Next: Design <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

// ─── Step 2: Design ──────────────────────────────────
function DesignStep({ subject, setSubject, body, setBody, handleBack, handleNext }: any) {
    const [generating, setGenerating] = useState(false);
    const [aiGoal, setAiGoal] = useState('');

    const handleAIGenerate = async () => {
        if (!aiGoal) return;
        setGenerating(true);
        try {
            const result = await generateCampaignContent('All contacts', aiGoal, 'professional');
            if (result.success) {
                setSubject(result.subject || '');
                setBody(result.body || '');
                toast({ title: "✨ AI Content Generated!", variant: 'success' });
            } else {
                toast({ title: "Generation failed", variant: 'destructive' });
            }
        } catch { toast({ title: "AI generation error", variant: 'destructive' }); }
        finally { setGenerating(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-1">Design Your Email</h2>
                <p className="text-slate-400 text-sm">Write your email content or let AI generate it.</p>
            </div>

            {/* AI Generator */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-aurora-purple/10 to-aurora-blue/10 border border-aurora-purple/20">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-aurora-purple" />
                    <span className="text-sm font-semibold text-white">AI Content Generator</span>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={aiGoal}
                        onChange={e => setAiGoal(e.target.value)}
                        placeholder="e.g. Announce a spring promotion with 20% off"
                        className="flex-1"
                    />
                    <Button variant="aurora" onClick={handleAIGenerate} disabled={generating || !aiGoal}>
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                        Generate
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Enter a catchy subject line..."
                />
                <p className="text-xs text-slate-500">Use {"{{firstName}}"} for personalization</p>
            </div>

            <div className="space-y-2">
                <Label>Email Body (HTML supported)</Label>
                <Textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Write your email content here..."
                    className="min-h-[200px] font-mono text-sm"
                />
            </div>

            {/* Preview */}
            {body && (
                <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="p-4 rounded-xl bg-white text-gray-900 text-sm max-h-[300px] overflow-auto" dangerouslySetInnerHTML={{ __html: body }} />
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="aurora" onClick={handleNext}>
                    Next: Review <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

// ─── Step 3: Review ──────────────────────────────────
function ReviewStep({ name, segmentRules, subject, body, handleBack, handleLaunch, handleSaveDraft, isLoading, isSavingDraft }: any) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-1">Review & Launch</h2>
                <p className="text-slate-400 text-sm">Review your campaign before sending.</p>
            </div>

            <div className="space-y-4">
                <ReviewItem label="Campaign Name" value={name || '—'} icon={<Pen className="w-4 h-4" />} />
                <ReviewItem label="Subject Line" value={subject || '—'} icon={<Send className="w-4 h-4" />} />
                <ReviewItem
                    label="Audience Rules"
                    value={segmentRules.conditions.length > 0
                        ? `${segmentRules.conditions.length} rule(s) — ${segmentRules.logic}`
                        : 'No targeting rules (all contacts)'}
                    icon={<Users className="w-4 h-4" />}
                />
            </div>

            {body && (
                <div className="space-y-2">
                    <Label>Email Preview</Label>
                    <div className="p-4 rounded-xl bg-white text-gray-900 text-sm max-h-[200px] overflow-auto" dangerouslySetInnerHTML={{ __html: body }} />
                </div>
            )}

            <div className="flex items-center justify-between pt-4 gap-3">
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSavingDraft || isLoading}>
                        {isSavingDraft ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                        Save Draft
                    </Button>
                    <Button variant="aurora" size="lg" onClick={handleLaunch} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Launch Campaign
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────
function StepIndicator({ step, current, label, icon }: { step: number, current: Step, label: string, icon: React.ReactNode }) {
    const isActive = current === step;
    const isComplete = current > step;

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-aurora-blue/20 border border-aurora-blue/40 text-aurora-blue' :
                isComplete ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                    'bg-white/5 border border-white/10 text-slate-500'
            }`}>
            {icon}
            <span className="text-xs font-medium hidden sm:inline">{label}</span>
        </div>
    );
}

function ReviewItem({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            {icon && <div className="mt-0.5 text-slate-400">{icon}</div>}
            <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white mt-0.5">{value}</p>
            </div>
        </div>
    );
}
