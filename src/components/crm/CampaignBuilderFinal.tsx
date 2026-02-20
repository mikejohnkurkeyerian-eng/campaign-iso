"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { launchCampaign, saveCampaignDraft } from "@/lib/actions/crm";
import AIChatBot from "@/components/crm/AIChatBot";
import {
    Users, Pen, Send, ChevronRight, ChevronLeft, Plus, Trash2,
    Upload, FileSpreadsheet, User, Mail, X, Loader2, CheckCircle
} from "lucide-react";

type Step = 1 | 2 | 3;

export interface Recipient {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    tags?: string;
}

interface CampaignBuilderProps {
    campaignId?: string;
    initialData?: {
        id: string;
        name: string;
        subject: string;
        content: string;
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
    const [recipients, setRecipients] = useState<Recipient[]>([]);

    const handleNext = () => { if (step < 3) setStep((step + 1) as Step); };
    const handleBack = () => { if (step > 1) setStep((step - 1) as Step); };

    const handleLaunch = async () => {
        if (!name || !subject || !body) {
            toast({ title: "Missing fields", description: "Please fill in campaign name, subject, and body.", variant: 'destructive' });
            return;
        }
        if (recipients.length === 0) {
            toast({ title: "No recipients", description: "Please add at least one recipient.", variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            const result = await launchCampaign({
                id: campaignId || initialData?.id,
                name, subject, body,
                recipients,
            });
            if (result?.success) {
                toast({ title: "🚀 Campaign Launched!", description: `Sent to ${recipients.length} recipients.`, variant: 'success' });
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
                recipients,
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
        <div className="max-w-5xl mx-auto">
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
                            recipients={recipients} setRecipients={setRecipients}
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
                            name={name} recipients={recipients}
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
function AudienceStep({ name, setName, recipients, setRecipients, handleNext }: {
    name: string; setName: (v: string) => void;
    recipients: Recipient[]; setRecipients: (v: Recipient[]) => void;
    handleNext: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRecipient, setNewRecipient] = useState<Recipient>({
        firstName: '', lastName: '', email: '', phone: '', company: '', tags: ''
    });

    const parseCSV = useCallback((text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            toast({ title: "Invalid CSV", description: "CSV must have a header row and at least one data row.", variant: 'destructive' });
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

        // Map common header variations
        const headerMap: Record<string, keyof Recipient> = {};
        headers.forEach((h, i) => {
            if (['firstname', 'first_name', 'first name', 'first'].includes(h)) headerMap[String(i)] = 'firstName';
            else if (['lastname', 'last_name', 'last name', 'last'].includes(h)) headerMap[String(i)] = 'lastName';
            else if (['email', 'email_address', 'emailaddress', 'e-mail'].includes(h)) headerMap[String(i)] = 'email';
            else if (['phone', 'phone_number', 'phonenumber', 'tel', 'mobile'].includes(h)) headerMap[String(i)] = 'phone';
            else if (['company', 'company_name', 'organization', 'org'].includes(h)) headerMap[String(i)] = 'company';
            else if (['tags', 'tag', 'label', 'labels'].includes(h)) headerMap[String(i)] = 'tags';
        });

        if (!Object.values(headerMap).includes('email')) {
            toast({ title: "Missing email column", description: "CSV must have an 'email' column.", variant: 'destructive' });
            return;
        }

        const parsed: Recipient[] = [];
        const existingEmails = new Set(recipients.map(r => r.email.toLowerCase()));

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const recipient: any = { firstName: '', lastName: '', email: '' };
            values.forEach((val, idx) => {
                const field = headerMap[String(idx)];
                if (field) recipient[field] = val.trim().replace(/^['"]|['"]$/g, '');
            });

            if (recipient.email && !existingEmails.has(recipient.email.toLowerCase())) {
                parsed.push(recipient as Recipient);
                existingEmails.add(recipient.email.toLowerCase());
            }
        }

        if (parsed.length === 0) {
            toast({ title: "No new recipients", description: "All emails in the CSV already exist or are invalid.", variant: 'destructive' });
            return;
        }

        setRecipients([...recipients, ...parsed]);
        toast({ title: `📋 Imported ${parsed.length} recipients`, description: `Total: ${recipients.length + parsed.length}`, variant: 'success' });
    }, [recipients, setRecipients]);

    const handleFile = useCallback((file: File) => {
        if (!file.name.endsWith('.csv')) {
            toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: 'destructive' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) parseCSV(text);
        };
        reader.readAsText(file);
    }, [parseCSV]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const addManualRecipient = () => {
        if (!newRecipient.email) {
            toast({ title: "Email required", variant: 'destructive' });
            return;
        }
        if (recipients.some(r => r.email.toLowerCase() === newRecipient.email.toLowerCase())) {
            toast({ title: "Duplicate", description: "This email already exists.", variant: 'destructive' });
            return;
        }
        setRecipients([...recipients, { ...newRecipient }]);
        setNewRecipient({ firstName: '', lastName: '', email: '', phone: '', company: '', tags: '' });
        setShowAddForm(false);
        toast({ title: "✅ Recipient added", variant: 'success' });
    };

    const removeRecipient = (index: number) => {
        setRecipients(recipients.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        setRecipients([]);
        toast({ title: "Cleared all recipients", variant: 'success' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-1">Build Your Audience</h2>
                <p className="text-slate-400 text-sm">Import a CSV file or manually add recipients.</p>
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

            {/* CSV Import */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative p-8 rounded-xl border-2 border-dashed cursor-pointer
                    transition-all duration-300 text-center group
                    ${isDragging
                        ? 'border-aurora-blue bg-aurora-blue/10 scale-[1.01]'
                        : 'border-white/10 hover:border-aurora-purple/40 hover:bg-white/[0.02]'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = '';
                    }}
                />
                <div className="flex flex-col items-center gap-3">
                    <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                        ${isDragging ? 'bg-aurora-blue/20' : 'bg-white/5 group-hover:bg-aurora-purple/10'}
                    `}>
                        {isDragging
                            ? <Upload className="w-7 h-7 text-aurora-blue animate-bounce" />
                            : <FileSpreadsheet className="w-7 h-7 text-slate-400 group-hover:text-aurora-purple transition-colors" />
                        }
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {isDragging ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Required columns: <span className="text-slate-400">email</span> · Optional: <span className="text-slate-400">firstName, lastName, phone, company, tags</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Recipients Count + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aurora-blue/10 border border-aurora-blue/20">
                        <Users className="w-4 h-4 text-aurora-blue" />
                        <span className="text-sm font-semibold text-aurora-blue">{recipients.length}</span>
                        <span className="text-xs text-slate-400">recipients</span>
                    </div>
                    {recipients.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-400 hover:text-red-300 text-xs h-7">
                            <Trash2 className="w-3 h-3 mr-1" /> Clear All
                        </Button>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Recipient
                </Button>
            </div>

            {/* Manual Add Form */}
            {showAddForm && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-aurora-purple" /> Add Recipient Manually
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddForm(false)}>
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">First Name</Label>
                            <Input
                                value={newRecipient.firstName}
                                onChange={e => setNewRecipient({ ...newRecipient, firstName: e.target.value })}
                                placeholder="John"
                                className="h-8 text-sm mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Last Name</Label>
                            <Input
                                value={newRecipient.lastName}
                                onChange={e => setNewRecipient({ ...newRecipient, lastName: e.target.value })}
                                placeholder="Doe"
                                className="h-8 text-sm mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Email *</Label>
                            <Input
                                type="email"
                                value={newRecipient.email}
                                onChange={e => setNewRecipient({ ...newRecipient, email: e.target.value })}
                                placeholder="john@example.com"
                                className="h-8 text-sm mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Phone</Label>
                            <Input
                                value={newRecipient.phone}
                                onChange={e => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                                placeholder="555-0123"
                                className="h-8 text-sm mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Company</Label>
                            <Input
                                value={newRecipient.company}
                                onChange={e => setNewRecipient({ ...newRecipient, company: e.target.value })}
                                placeholder="Acme Corp"
                                className="h-8 text-sm mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Tags</Label>
                            <Input
                                value={newRecipient.tags}
                                onChange={e => setNewRecipient({ ...newRecipient, tags: e.target.value })}
                                placeholder="vip, hot-lead"
                                className="h-8 text-sm mt-1"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-1">
                        <Button variant="aurora" size="sm" onClick={addManualRecipient} className="h-8">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                    </div>
                </div>
            )}

            {/* Recipient Preview Cards */}
            {recipients.length > 0 && (
                <div className="space-y-2">
                    <Label>Preview Audience ({recipients.length})</Label>
                    <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {recipients.map((r, idx) => (
                            <div
                                key={`${r.email}-${idx}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all group"
                            >
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-lg bg-aurora-gradient flex items-center justify-center shrink-0 text-white text-xs font-bold">
                                    {(r.firstName?.[0] || r.email[0]).toUpperCase()}
                                    {(r.lastName?.[0] || '').toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white truncate">
                                            {r.firstName || r.lastName
                                                ? `${r.firstName} ${r.lastName}`.trim()
                                                : 'Unknown'
                                            }
                                        </span>
                                        {r.company && (
                                            <span className="text-[10px] text-slate-500 truncate">@ {r.company}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                            <Mail className="w-3 h-3" /> {r.email}
                                        </span>
                                        {r.phone && (
                                            <span className="text-xs text-slate-500 truncate">{r.phone}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                {r.tags && (
                                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                                        {r.tags.split(',').slice(0, 2).map((tag, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px] h-5">
                                                {tag.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Remove */}
                                <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 shrink-0"
                                    onClick={() => removeRecipient(idx)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button variant="aurora" onClick={handleNext} disabled={recipients.length === 0 || !name}>
                    Next: Design <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

// ─── Step 2: Design ──────────────────────────────────
function DesignStep({ subject, setSubject, body, setBody, handleBack, handleNext }: any) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-1">Design Your Email</h2>
                <p className="text-slate-400 text-sm">Chat with AI to generate content, or write it yourself below.</p>
            </div>

            {/* Two-column: Chat + Manual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Chatbot */}
                <AIChatBot
                    onApplySubject={(s) => {
                        setSubject(s);
                        toast({ title: "✨ Subject applied!", variant: 'success' });
                    }}
                    onApplyBody={(b) => {
                        setBody(b);
                        toast({ title: "✨ Body applied!", variant: 'success' });
                    }}
                />

                {/* Manual Fields */}
                <div className="space-y-4">
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
                            <div className="p-4 rounded-xl bg-white text-gray-900 text-sm max-h-[200px] overflow-auto" dangerouslySetInnerHTML={{ __html: body }} />
                        </div>
                    )}
                </div>
            </div>

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
function ReviewStep({ name, recipients, subject, body, handleBack, handleLaunch, handleSaveDraft, isLoading, isSavingDraft }: any) {
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
                    label="Recipients"
                    value={`${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
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

// ─── CSV line parser (handles quoted fields) ─────────
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
