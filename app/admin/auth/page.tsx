'use client';

import { useState } from 'react';
import { AuthService } from '@/lib/services/auth-service';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Key, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminAuthPage() {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'verify' | 'register' | 'login'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const verifyCode = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode })
            });
            const data = await res.json();
            if (data.valid) {
                setStep('register');
            } else {
                setError('Invalid or used invite code');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await AuthService.registerWithEmail(email, password);

            const res = await fetch('/api/admin/consume-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode, uid: user.uid })
            });

            if (res.ok) {
                router.push('/admin');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to finalize admin account');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await AuthService.loginWithEmail(email, password);
            router.push('/admin');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(to right, #008080 1px, transparent 1px),
                        linear-gradient(to bottom, #008080 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Radial Gradient Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-60" />

            {/* Top Accent Line */}
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-[#008080] to-transparent opacity-70" />

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-[#008080] to-transparent opacity-70" />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-950/80 border-2 border-[#008080]/50 text-[#008080] mb-6 shadow-2xl shadow-teal-500/20 backdrop-blur-sm"
                    >
                        <ShieldCheck size={40} strokeWidth={1.5} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-3xl font-bold text-white mb-2"
                    >
                        Admin Portal
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-zinc-500 text-sm"
                    >
                        Restricted Access • High Security
                    </motion.p>
                </div>

                {/* Auth Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl"
                >
                    {/* Login Form */}
                    {step === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Admin Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="email"
                                        placeholder="admin@connekt.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-zinc-600 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-zinc-600 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Access Dashboard'}
                            </button>

                            <div className="text-center pt-4 border-t border-zinc-800 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep('verify')}
                                    className="text-xs text-zinc-500 hover:text-[#008080] transition-colors flex items-center gap-1 mx-auto"
                                >
                                    <Key size={14} />
                                    Have an invite code?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Invite Code Verification */}
                    {step === 'verify' && (
                        <div className="space-y-5">
                            <div className="text-center mb-6">
                                <Key className="mx-auto mb-3 text-[#008080]" size={32} />
                                <h3 className="text-lg font-semibold text-white mb-1">Enter Invite Code</h3>
                                <p className="text-sm text-zinc-500">6-character access code required</p>
                            </div>

                            <input
                                type="text"
                                placeholder="ABC123"
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all text-center tracking-widest uppercase text-xl font-mono"
                            />

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={verifyCode}
                                disabled={loading || inviteCode.length < 6}
                                className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                            </button>

                            <button
                                onClick={() => {
                                    setStep('login');
                                    setError('');
                                }}
                                className="w-full text-xs text-zinc-500 hover:text-white transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}

                    {/* Registration Form */}
                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm text-center mb-6">
                                ✓ Code Verified. Create your admin account.
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Admin Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="email"
                                        placeholder="admin@connekt.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-zinc-600 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Set Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-zinc-600 focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Finalize Account'}
                            </button>
                        </form>
                    )}
                </motion.div>

                {/* Footer Notice */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-center text-xs text-zinc-600 mt-6"
                >
                    Protected by Connekt Security Systems
                </motion.p>
            </div>
        </div>
    );
}
