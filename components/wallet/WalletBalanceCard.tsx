'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Antigravity to avoid SSR issues with Three.js
const Antigravity = dynamic(() => import('@/components/ui/Antigravity'), { ssr: false });

interface WalletBalanceCardProps {
    balance: number;
    currency?: string;
    pendingIn?: number;
    pendingOut?: number;
    isAgency?: boolean;
    onAddFunds?: () => void;
}

// SpotlightCard for subtle mouse-follow glow effect
const SpotlightOverlay = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out rounded-3xl z-10"
                style={{
                    opacity: opacity * 0.4,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0, 128, 128, 0.15), transparent 40%)`
                }}
            />
            {children}
        </div>
    );
};

export function WalletBalanceCard({
    balance,
    currency = 'GMD',
    pendingIn = 0,
    pendingOut = 0,
    isAgency = false,
    onAddFunds
}: WalletBalanceCardProps) {
    const formattedBalance = balance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-3xl mx-auto"
        >
            <SpotlightOverlay>
                <div className="relative overflow-hidden rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-teal-900/10">

                    {/* Base background - z-0 */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/70 via-white/50 to-teal-50/30 dark:from-zinc-900/70 dark:via-zinc-900/50 dark:to-teal-950/30" />

                    {/* Antigravity Particle Background - z-10 (on top of base) */}
                    <div className="absolute inset-0 z-10 overflow-hidden rounded-3xl">
                        <Antigravity
                            count={360}
                            color="#008080"
                            particleSize={1.2}
                            magnetRadius={22}
                            ringRadius={22}
                            waveSpeed={0.25}
                            waveAmplitude={1.2}
                            lerpSpeed={0.05}
                            autoAnimate={true}
                            particleShape="capsule"
                            fieldStrength={12}
                        />
                    </div>

                    {/* Frost Glass Surface Overlay - z-15 (subtle, doesn't hide particles) */}
                    <div className="absolute inset-0 z-[15] pointer-events-none backdrop-blur-[1px] bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-zinc-900/10" />

                    {/* Glass refraction edge effect - z-16 */}
                    <div className="absolute inset-0 z-[16] rounded-3xl pointer-events-none" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, rgba(0,128,128,0.02) 100%)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.03)'
                    }} />

                    {/* Content Container - z-20 (on top of everything) */}
                    <div className="relative z-20 p-8 md:p-10">



                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                    <Wallet size={24} className="text-white" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    {isAgency ? 'Agency Wallet' : 'Your Personal Balance'}
                                </h2>
                            </div>

                            {/* Top Up Button */}
                            {onAddFunds && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onAddFunds}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008080] hover:bg-teal-600 text-white text-sm font-bold transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                    <span>Top Up</span>
                                </motion.button>
                            )}
                        </div>

                        {/* Balance Display */}
                        <div className="mb-8">
                            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2">
                                Available Balance
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">D</span>
                                <motion.span
                                    key={balance}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight"
                                >
                                    {formattedBalance}
                                </motion.span>
                            </div>
                        </div>

                        {/* Pending Amounts */}
                        <div className="flex flex-wrap gap-4">
                            {/* Pending In */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                    <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">
                                        Pending In
                                    </p>
                                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                        D{pendingIn.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Pending Out */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                    <TrendingDown size={16} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">
                                        Pending Out
                                    </p>
                                    <p className="text-sm font-black text-amber-700 dark:text-amber-300">
                                        D{pendingOut.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Currency Badge */}
                            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 ml-auto">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Currency
                                </span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                    {currency}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Decorative gradient overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/50 dark:from-zinc-900/50 to-transparent pointer-events-none z-10" />
                </div>
            </SpotlightOverlay>
        </motion.div>
    );
}

export default WalletBalanceCard;
