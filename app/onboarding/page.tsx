'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { UsernameInput } from '@/components/auth/UsernameInput';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [role, setRole] = useState<'employer' | 'va'>('va');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [currentSkill, setCurrentSkill] = useState('');

    const handleAddSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault();
            if (!skills.includes(currentSkill.trim())) {
                setSkills([...skills, currentSkill.trim()]);
            }
            setCurrentSkill('');
        }
    };

    const handleComplete = async () => {
        if (!user || !username || !isUsernameValid) return;
        setLoading(true);

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                username: username.toLowerCase(),
                role,
                bio,
                skills,
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                introSeen: false // Force them to see the intro flow
            }, { merge: true });

            // Create username mapping
            await setDoc(doc(db, 'usernames', username.toLowerCase()), {
                uid: user.uid
            });

            router.push('/intro/ai'); // Go to Connekt AI Intro
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-midnight text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 relative z-10 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-yellow-600 mb-6 shadow-lg shadow-amber-500/20"
                    >
                        <Sparkles className="text-black w-8 h-8" />
                    </motion.div>
                    <h1 className="text-4xl font-bold mb-3">Welcome to <span className="text-gold">CONNEKT</span></h1>
                    <p className="text-gray-400">Let's set up your digital identity.</p>
                </div>

                <div className="space-y-8">
                    {/* Username Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-amber-500 uppercase tracking-wider">Identity</label>
                        <UsernameInput
                            value={username}
                            onChange={setUsername}
                            onValidityChange={setIsUsernameValid}
                        />
                        <p className="text-xs text-gray-500">This will be your unique handle (@username)</p>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-amber-500 uppercase tracking-wider">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setRole('employer')}
                                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${role === 'employer'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                Employer
                            </button>
                            <button
                                onClick={() => setRole('va')}
                                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${role === 'va'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                Virtual Assistant
                            </button>
                        </div>
                    </div>

                    {/* Skills Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-amber-500 uppercase tracking-wider">Skills & Expertise</label>
                        <div className="bg-black/20 border border-white/10 rounded-xl p-2 flex flex-wrap gap-2 focus-within:border-amber-500/50 transition-colors">
                            {skills.map(skill => (
                                <span key={skill} className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-amber-500/20">
                                    {skill}
                                    <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="hover:text-white">×</button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={currentSkill}
                                onChange={(e) => setCurrentSkill(e.target.value)}
                                onKeyDown={handleAddSkill}
                                placeholder="Type a skill and hit Enter..."
                                className="bg-transparent border-none outline-none text-white placeholder-gray-600 flex-1 min-w-[150px] p-1"
                            />
                        </div>
                    </div>

                    {/* Bio Editor */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-amber-500 uppercase tracking-wider">Professional Bio</label>
                        <div className="prose-invert">
                            <MarkdownEditor value={bio} onChange={setBio} />
                        </div>
                    </div>

                    <button
                        onClick={handleComplete}
                        disabled={!isUsernameValid || loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${!isUsernameValid || loading
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-300 to-yellow-600 text-black hover:scale-[1.02] shadow-lg shadow-amber-500/25'
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Continue <ChevronRight /></>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
