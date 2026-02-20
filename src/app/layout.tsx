import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { Mail, Users, BarChart3, Zap, LogOut, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Campaign Console',
    description: 'Campaign Management System — Create, send, and track email campaigns',
};

function Sidebar() {
    const navItems = [
        { href: '/campaigns', label: 'Campaigns', icon: Mail },
        { href: '/campaigns/new', label: 'New Campaign', icon: Zap },
        { href: '/segments', label: 'Segments', icon: Users },
        { href: '/ai', label: 'AI Assistant', icon: Sparkles },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-raised/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <Link href="/campaigns" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-aurora-gradient flex items-center justify-center shadow-lg shadow-aurora-purple/25 group-hover:shadow-aurora-purple/40 transition-shadow">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-heading font-bold text-white">Campaigns</h1>
                        <p className="text-[10px] text-slate-500 tracking-widest uppercase">Console</p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                        <item.icon className="w-4 h-4 group-hover:text-aurora-blue transition-colors" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
                <div className="text-xs text-slate-600 text-center">
                    Campaign Console v1.0
                </div>
            </div>
        </aside>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen">
                <Sidebar />
                <main className="ml-64 min-h-screen">
                    <div className="p-8">
                        {children}
                    </div>
                </main>
                <Toaster />
            </body>
        </html>
    );
}
