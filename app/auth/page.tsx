'use client';

import { useState } from 'react';
import { AuthService } from '@/lib/services/auth-service';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, User, Briefcase } from 'lucide-react';
import { FloatingShapes } from '@/components/auth/FloatingShapes';
import { BriefcaseLogo3D } from '@/components/auth/BriefcaseLogo3D';
import { FcGoogle } from 'react-icons/fc';

type UserRole = 'va' | 'employer';

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [selectedRole, setSelectedRole] = useState<UserRole>('va');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await AuthService.loginWithEmail(formData.email, formData.password);
            } else {
                await AuthService.registerWithEmail(formData.email, formData.password, selectedRole);
            }
            router.push('/onboarding');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        try {
            await AuthService.loginWithGoogle();
            router.push('/onboarding');
        } catch (err: any) {
            setError('Google sign in failed');
        }
    };

    return (
        <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-900">
            {/* LEFT HALF: Liquid Glass Visuals */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-800 dark:to-zinc-900">
                {/* Floating Animated Shapes */}
                <FloatingShapes />

                {/* Diagonal Frosted Glass Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#008080]/80 to-teal-700/60 transform -skew-x-12 origin-bottom-right backdrop-blur-xl border-l-2 border-white/40" />

                {/* Centerpiece: 3D Briefcase Logo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <BriefcaseLogo3D />
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-6xl font-bold text-white mt-8 tracking-tight"
                    >
                        Connekt
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="text-white/90 text-lg mt-4 max-w-md text-center px-8"
                    >
                        The future of work is here. Connect with opportunities, collaborate seamlessly, and grow your career.
                    </motion.p>
                </div>

                {/* Decorative Glow Orbs */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-[#FFA500] rounded-full blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-400 rounded-full blur-[100px] opacity-25" />
            </div>

            {/* RIGHT HALF: Functional Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <div className="max-w-md w-full">
                    {/* Mobile Logo */}
                    <div className="text-center mb-8 lg:hidden">
                        <h1 className="text-4xl font-bold text-[#008080]">Connekt</h1>
                    </div>

                    {/* Glassmorphic Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 p-8 rounded-3xl shadow-2xl"
                    >
                        {/* Toggle Switch: Sign In vs Sign Up */}
                        <div className="flex items-center justify-center mb-8">
                            <div className="bg-gray-200/50 dark:bg-zinc-800/50 rounded-full p-1 flex gap-1">
                                <button
                                    onClick={() => setMode('login')}
                                    className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${mode === 'login'
                                            ? 'bg-[#008080] text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => setMode('signup')}
                                    className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${mode === 'signup'
                                            ? 'bg-[#008080] text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>

                        {/* Role Selection (Sign Up Only) */}
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6 space-y-3"
                                >
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        I am a...
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* VA Card */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole('va')}
                                            className={`p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${selectedRole === 'va'
                                                    ? 'bg-[#008080]/10 border-[#008080] shadow-lg shadow-teal-500/20'
                                                    : 'bg-white/30 dark:bg-white/5 border-gray-300 dark:border-zinc-700 hover:border-[#008080]/50'
                                                }`}
                                        >
                                            <User className="mx-auto mb-2" size={28} />
                                            <div className="text-sm font-semibold">Virtual Assistant</div>
                                        </button>

                                        {/* Employer Card */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole('employer')}
                                            className={`p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${selectedRole === 'employer'
                                                    ? 'bg-[#008080]/10 border-[#008080] shadow-lg shadow-teal-500/20'
                                                    : 'bg-white/30 dark:bg-white/5 border-gray-300 dark:border-zinc-700 hover:border-[#008080]/50'
                                                }`}
                                        >
                                            <Briefcase className="mx-auto mb-2" size={28} />
                                            <div className="text-sm font-semibold">Employer</div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-full focus:ring-2 focus:ring-[#008080] focus:border-transparent outline-none transition-all shadow-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-full focus:ring-2 focus:ring-[#008080] focus:border-transparent outline-none transition-all shadow-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                    {error}
                                </p>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-full font-bold text-lg shadow-lg shadow-teal-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : mode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px bg-gray-300 dark:bg-zinc-700 flex-1" />
                            <span className="text-xs text-gray-400 font-medium">OR</span>
                            <div className="h-px bg-gray-300 dark:bg-zinc-700 flex-1" />
                        </div>

                        {/* Google Sign-In */}
                        <button
                            type="button"
                            onClick={handleGoogle}
                            className="w-full py-3 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-3 shadow-sm"
                        >
                            <FcGoogle size={24} />
                            Continue with Google
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
