"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email, password, redirect: false
            });
            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/campaigns');
                router.refresh();
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4"
            style={{ marginLeft: '-16rem' /* offset sidebar for login page */ }}>
            {/* Background effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aurora-blue/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aurora-purple/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative aurora-glow">
                <CardHeader className="text-center pb-2">
                    <div className="w-14 h-14 rounded-2xl bg-aurora-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-aurora-purple/25">
                        <Mail className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-heading">Campaign Console</CardTitle>
                    <CardDescription>Sign in to manage your campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <Button variant="aurora" type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
