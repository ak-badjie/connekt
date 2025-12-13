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
    const [role, setRole] = useState<'va' | 'recruiter'>('va');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [currentSkill, setCurrentSkill] = useState('');

    // Validation Check: Recruiters pass automatically, VAs need 5+ skills
    const isSkillValid = role === 'recruiter' || (role === 'va' && skills.length >= 5);

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

        // Strict validation before submission
        if (role === 'va' && skills.length < 5) {
            return; // Button should be disabled, but safety check here
        }

        setLoading(true);

        try {
            const connectMail = `${username.toLowerCase()}@connekt.com`;

            const userRef = doc(db, 'users', user.uid);

            // Base user data
            const userData: any = {
                username: username.toLowerCase(),
                connectMail: connectMail,
                role,
                title: role === 'recruiter' ? 'Recruiter' : 'Virtual Assistant',
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                introSeen: false
            };

            // Only add bio/skills for VAs
            if (role === 'va') {
                userData.bio = bio;
                userData.skills = skills;
            }

            await setDoc(userRef, userData, { merge: true });

            // Create username mapping
            await setDoc(doc(db, 'usernames', username.toLowerCase()), {
                uid: user.uid
            });

            router.push('/intro/ai');
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 flex flex-col items-center justify-center p-6 pt-24 pb-16 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#008080]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 rounded-3xl p-8 relative z-10 shadow-2xl"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 mb-6 shadow-lg shadow-teal-500/30"
                    >
                        <Sparkles className="text-white w-8 h-8" />
                    </motion.div>
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent">
                        Welcome to CONNEKT
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Let's set up your digital identity.</p>
                </div>

                <div className="space-y-8">
                    {/* Username Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">Identity</label>
                        <UsernameInput
                            value={username}
                            onChange={setUsername}
                            onValidityChange={setIsUsernameValid}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">This will be your unique handle (@username)</p>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('va')}
                                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${role === 'va'
                                    ? 'bg-[#008080]/10 border-[#008080] text-[#008080] shadow-lg shadow-teal-500/20'
                                    : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                Virtual Assistant
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('recruiter')}
                                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${role === 'recruiter'
                                    ? 'bg-[#008080]/10 border-[#008080] text-[#008080] shadow-lg shadow-teal-500/20'
                                    : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                Recruiter
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                            Want to create an agency? Complete your profile first.
                        </p>
                    </div>

                    {/* Conditional Fields Based on Role */}
                    {role === 'va' && (
                        <>
                            {/* Skills Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">Skills & Expertise</label>
                                    <span className={`text-xs font-bold transition-colors ${skills.length >= 5 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {skills.length}/5 Required
                                    </span>
                                </div>

                                <div className={`bg-gray-100 dark:bg-zinc-800 border rounded-xl p-2 flex flex-wrap gap-2 transition-all ${
                                    skills.length < 5 && skills.length > 0
                                        ? 'border-amber-200 dark:border-amber-900/30'
                                        : 'border-gray-200 dark:border-zinc-700 focus-within:border-[#008080]'
                                }`}>
                                    {skills.map(skill => (
                                        <span key={skill} className="bg-[#008080]/20 text-[#008080] px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-[#008080]/20">
                                            {skill}
                                            <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="hover:text-teal-700 dark:hover:text-teal-300">×</button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={currentSkill}
                                        onChange={(e) => setCurrentSkill(e.target.value)}
                                        onKeyDown={handleAddSkill}
                                        placeholder={skills.length >= 5 ? 'Add more skills...' : 'Type a skill and hit Enter...'}
                                        className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 flex-1 min-w-[150px] p-1"
                                    />
                                </div>

                                {skills.length < 5 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-500 animate-pulse">
                                        * Please add at least {5 - skills.length} more skill{5 - skills.length !== 1 ? 's' : ''} to complete your profile.
                                    </p>
                                )}
                            </div>

                            {/* Bio Editor */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">Professional Bio</label>
                                <div className="prose dark:prose-invert max-w-none">
                                    <MarkdownEditor value={bio} onChange={setBio} />
                                </div>
                            </div>
                        </>
                    )}

                    {role === 'recruiter' && (
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-3">Welcome, Recruiter! 🎯</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                                As a recruiter on Connekt, you'll have access to powerful tools to find and hire top talent:
                            </p>
                            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 dark:text-teal-400">✓</span>
                                    <span>Browse thousands of verified Virtual Assistants</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 dark:text-teal-400">✓</span>
                                    <span>Post projects and tasks with custom requirements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 dark:text-teal-400">✓</span>
                                    <span>Send and manage contracts directly on the platform</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 dark:text-teal-400">✓</span>
                                    <span>Track project progress and team performance</span>
                                </li>
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={handleComplete}
                        disabled={!isUsernameValid || !isSkillValid || loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${!isUsernameValid || !isSkillValid || loading
                            ? 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white hover:scale-[1.02] shadow-lg shadow-teal-500/25'
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Continue <ChevronRight /></>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
