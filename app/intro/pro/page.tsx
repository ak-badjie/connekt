'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Check, Crown, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProIntroPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Mark intro as seen so they don't get redirected back here
            await updateDoc(doc(db, 'users', user.uid), {
                introSeen: true
            });
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-midnight text-white py-20 px-6 relative overflow-hidden">
            {/* Background Beams */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-6">Choose Your <span className="text-gold">Power Level</span></h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Unlock advanced AI agents, unlimited proposals, and verified status with Connekt Pro.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                    {/* Free Tier */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative hover:bg-white/[0.07] transition-all">
                        <h3 className="text-2xl font-bold mb-2">Starter</h3>
                        <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                        <p className="text-gray-400 text-sm mb-8">Perfect for getting started with basic job matching.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> 5 Job Applications/mo</li>
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Basic Profile</li>
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Community Access</li>
                        </ul>
                        <button onClick={handleContinue} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 font-medium transition-all">
                            Continue with Free
                        </button>
                    </div>

                    {/* Pro Tier (Highlighted) */}
                    <div className="bg-gradient-to-b from-gray-900 to-black border border-amber-500/50 rounded-[2rem] p-10 relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-300 to-yellow-600 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                            <Zap size={12} fill="black" /> Most Popular
                        </div>
                        <h3 className="text-3xl font-bold mb-2 text-white">Pro</h3>
                        <div className="text-5xl font-bold mb-6 text-gold">$29<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                        <p className="text-gray-400 text-sm mb-8">For serious professionals scaling their career.</p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-medium"><div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><Check size={12} /></div> Unlimited Applications</li>
                            <li className="flex items-center gap-3 text-sm font-medium"><div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><Check size={12} /></div> Connekt AI Agent Access</li>
                            <li className="flex items-center gap-3 text-sm font-medium"><div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><Check size={12} /></div> Verified Badge</li>
                            <li className="flex items-center gap-3 text-sm font-medium"><div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><Check size={12} /></div> Priority Support</li>
                        </ul>
                        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-600 text-black font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-amber-500/20">
                            Get Connekt Pro
                        </button>
                    </div>

                    {/* Pro+ Tier */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative hover:bg-white/[0.07] transition-all">
                        <h3 className="text-2xl font-bold mb-2">Agency</h3>
                        <div className="text-4xl font-bold mb-6">$99<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                        <p className="text-gray-400 text-sm mb-8">Complete toolkit for agencies and teams.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> Everything in Pro</li>
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> 5 Team Seats</li>
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> White-label Reports</li>
                            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} /> API Access</li>
                        </ul>
                        <button className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 font-medium transition-all">
                            Contact Sales
                        </button>
                    </div>

                </div>

                <div className="mt-16 text-center">
                    <button onClick={handleContinue} className="text-gray-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto group">
                        Skip for now
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
