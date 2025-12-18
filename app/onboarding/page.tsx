'use client';

import React, { useEffect, useState, Children, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, User, Briefcase, CheckCircle2, ChevronRight, ChevronLeft, X, Plus } from 'lucide-react'; // Removed Sparkles
import { UsernameInput } from '@/components/auth/UsernameInput';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleSelector } from '@/components/ui/RoleSelector';
import ConnektIcon from '@/components/branding/ConnektIcon'; // Ensure this path is correct

// ==========================================
// DATA: PREDEFINED SKILLS (100+)
// ==========================================
const PREDEFINED_SKILLS = [
    "React.js", "Next.js", "Node.js", "Python", "TypeScript", "JavaScript", "Java", "C++", "C#", "Rust", "Go", 
    "Swift", "Kotlin", "Flutter", "React Native", "AWS", "Docker", "Kubernetes", "Firebase", "MongoDB", "PostgreSQL",
    "GraphQL", "DevOps", "CI/CD", "Machine Learning", "AI Integration", "Web3", "Smart Contracts",
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "After Effects", "Premiere Pro", "UI Design", "UX Research", 
    "Logo Design", "Branding", "3D Modeling", "Blender", "Cinema 4D", "Motion Graphics", "Video Editing", 
    "Illustration", "Typography", "Color Theory", "Prototyping",
    "AutoCAD", "Revit", "SketchUp", "Rhino 3D", "BIM", "Interior Design", "Landscape Architecture", 
    "Structural Engineering", "Civil Engineering", "Bluebeam", "Rendering", "Lumion", "V-Ray",
    "Data Entry", "Email Management", "Calendar Management", "Travel Planning", "Customer Support", "Zendesk", 
    "Intercom", "Notion", "Asana", "Trello", "Monday.com", "Project Management", "Research", "Transcription",
    "SEO", "Copywriting", "Content Writing", "Social Media Management", "Digital Marketing", "Google Ads", 
    "Facebook Ads", "Email Marketing", "Mailchimp", "HubSpot", "Google Analytics", "Blog Writing", "Storytelling",
    "Lead Generation", "Cold Calling", "Salesforce", "CRM Management", "Business Strategy", "Market Research", 
    "Accounting", "QuickBooks", "Xero", "Financial Analysis", "Excel", "PowerPoint",
    "English", "Spanish", "French", "German", "Mandarin", "Communication", "Leadership", "Problem Solving"
].sort();

const ROLE_ITEMS = [
    { 
        title: 'Virtual Assistant', 
        description: 'Find Work', 
        value: 'va',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' 
    },
    { 
        title: 'Recruiter', 
        description: 'Hire Talent', 
        value: 'recruiter',
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80' 
    }
];

// ==========================================
// UI HELPERS (Stepper)
// ==========================================

function Stepper({ 
    children, 
    onComplete, 
    isNextDisabled, 
    currentStep, 
    setCurrentStep 
}: { 
    children: React.ReactNode, 
    onComplete: () => void, 
    isNextDisabled: (step: number) => boolean,
    currentStep: number,
    setCurrentStep: (step: number) => void
}) {
    const stepsArray = Children.toArray(children);
    const totalSteps = stepsArray.length;
    const isLastStep = currentStep === totalSteps;
    const [direction, setDirection] = useState(0);

    const updateStep = (newStep: number) => {
        setDirection(newStep > currentStep ? 1 : -1);
        setCurrentStep(newStep);
    };

    const isRoleStep = currentStep === 2;

    return (
        <div className={`flex flex-col w-full flex-1 min-h-0 ${isRoleStep ? 'justify-between' : ''}`}>
            {/* Header / Indicators */}
            <div className={`
                flex items-center justify-between px-2 mb-4 z-50 transition-all duration-500 flex-shrink-0
                ${isRoleStep ? 'absolute top-8 left-8 right-8 max-w-md mx-auto bg-black/50 backdrop-blur-md p-4 rounded-full border border-white/10' : ''}
            `}>
                {stepsArray.map((_, i) => (
                    <React.Fragment key={i}>
                        <StepIndicator 
                            step={i + 1} 
                            currentStep={currentStep} 
                            onClick={() => i + 1 < currentStep && updateStep(i + 1)} 
                            isDark={isRoleStep}
                        />
                        {i < totalSteps - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${i + 1 < currentStep ? 'bg-[#008080]' : isRoleStep ? 'bg-zinc-800' : 'bg-gray-200 dark:bg-zinc-700'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Content Area */}
            <div className={`relative flex-1 min-h-0 ${isRoleStep ? 'absolute inset-0 z-0' : ''}`}>
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="h-full flex flex-col"
                    >
                        {stepsArray[currentStep - 1]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className={`
                flex justify-between items-center z-50 transition-all duration-500 flex-shrink-0
                ${isRoleStep 
                    ? 'absolute bottom-8 left-8 right-8 max-w-4xl mx-auto' 
                    : 'mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800'}
            `}>
                <button
                    onClick={() => updateStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className={`
                        px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2
                        ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}
                        ${isRoleStep 
                            ? 'text-white/70 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10' 
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}
                    `}
                >
                    <ChevronLeft size={16} /> Back
                </button>

                <button
                    onClick={() => isLastStep ? onComplete() : updateStep(currentStep + 1)}
                    disabled={isNextDisabled(currentStep)}
                    className={`
                        px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2
                        ${isNextDisabled(currentStep) 
                            ? 'bg-gray-300 dark:bg-zinc-800 cursor-not-allowed text-gray-500 shadow-none' 
                            : 'bg-gradient-to-r from-[#008080] to-teal-600 hover:scale-105 shadow-teal-500/30'}
                    `}
                >
                    {isLastStep ? 'Complete Setup' : 'Continue'} <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

function StepIndicator({ step, currentStep, onClick, isDark }: { step: number, currentStep: number, onClick: () => void, isDark: boolean }) {
    const status = currentStep === step ? 'active' : currentStep > step ? 'complete' : 'inactive';
    return (
        <motion.button onClick={onClick} disabled={status === 'inactive'} className="relative z-10" whileHover={status === 'complete' ? { scale: 1.1 } : {}}>
            <motion.div 
                animate={{
                    backgroundColor: status === 'active' || status === 'complete' ? '#008080' : isDark ? '#27272a' : '#e5e7eb',
                    scale: status === 'active' ? 1.2 : 1
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark && status === 'inactive' ? 'text-zinc-500' : 'text-white'}`}
            >
                {status === 'complete' ? <CheckCircle2 size={16} /> : step}
            </motion.div>
        </motion.button>
    );
}

export function Step({ children, title, description, isFullScreen = false }: { children: React.ReactNode, title?: string, description?: string, isFullScreen?: boolean }) {
    if (isFullScreen) return <div className="w-full h-full">{children}</div>;
    
    return (
        <div className="flex flex-col h-full">
            <div className="text-center mb-4 flex-shrink-0">
                {title && <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>}
                {description && <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>}
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
                {children}
            </div>
        </div>
    );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function OnboardingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(1);

    // Form States
    const [username, setUsername] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(user?.photoURL || null);
    
    const [roleIndex, setRoleIndex] = useState(0); 
    const role = ROLE_ITEMS[roleIndex].value as 'va' | 'recruiter';

    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [currentSkillInput, setCurrentSkillInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/auth');
    }, [authLoading, user, router]);

    // Derived state for skills
    const availableCanvasSkills = useMemo(() => {
        // Show all skills that are NOT selected
        return PREDEFINED_SKILLS.filter(s => !skills.includes(s));
    }, [skills]);

    const suggestions = useMemo(() => {
        if (!currentSkillInput.trim()) return [];
        return availableCanvasSkills.filter(s => 
            s.toLowerCase().includes(currentSkillInput.toLowerCase())
        );
    }, [currentSkillInput, availableCanvasSkills]);

    // Handlers
    const toggleSkill = (skill: string) => {
        if (skills.includes(skill)) {
            setSkills(skills.filter(s => s !== skill));
        } else {
            if (skills.length >= 20) return; // Cap at 20
            setSkills([...skills, skill]);
        }
        setCurrentSkillInput('');
        setShowSuggestions(false);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If there's an exact match in suggestions, pick it
            const exactMatch = suggestions.find(s => s.toLowerCase() === currentSkillInput.toLowerCase());
            if (exactMatch) {
                toggleSkill(exactMatch);
            } else if (currentSkillInput.trim() && !skills.includes(currentSkillInput.trim())) {
                // Allow custom skills
                setSkills([...skills, currentSkillInput.trim()]);
                setCurrentSkillInput('');
            }
        }
    };

    const isStepDisabled = (step: number) => {
        if (loading) return true;
        switch (step) {
            case 1: return !displayName.trim() || !username || !isUsernameValid;
            case 2: return false; 
            case 3: 
                if (role === 'recruiter') return false;
                return skills.length < 5; 
            default: return false;
        }
    };

    const handleComplete = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            let photoURL = user.photoURL;
            if (profilePicture) {
                const { ProfileService } = await import('@/lib/services/profile-service');
                const uploadedURL = await ProfileService.uploadProfilePicture(user.uid, profilePicture);
                if (uploadedURL) photoURL = uploadedURL;
            }

            const userData: any = {
                username: username.toLowerCase(),
                connectMail: `${username.toLowerCase()}@connekt.com`,
                role,
                title: role === 'recruiter' ? 'Recruiter' : 'Virtual Assistant',
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
                email: user.email,
                displayName: displayName.trim(),
                photoURL,
                introSeen: false,
                bio: role === 'va' ? bio : undefined,
                skills: role === 'va' ? skills : undefined
            };

            await setDoc(userRef, userData, { merge: true });
            await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid: user.uid });
            
            try {
                const { ProfileService } = await import('@/lib/services/profile-service');
                await ProfileService.initializeUserProfile(user.uid, userData);
            } catch (e) { console.warn('Profile init failed (non-critical):', e); }

            router.push('/intro/ai');
        } catch (error: any) {
            setError(error.message || 'Failed to save profile.');
        } finally {
            setLoading(false);
        }
    };

    const isRoleStep = currentStep === 2;

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 overflow-hidden relative transition-colors duration-700">

            {/* Background Ambience */}
            <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${isRoleStep ? 'opacity-0' : 'opacity-100'}`}>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#008080]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div 
                layout
                // FIX 1: UPDATED TRANSITION
                // Replaced "bounce" with spring stiffness/damping for smooth full-screen expansion
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
                className={`
                    relative z-10 flex flex-col transition-all duration-500 ease-in-out
                    ${isRoleStep 
                        ? 'w-screen h-screen rounded-none border-0 bg-black p-0'
                        : 'w-full max-w-lg h-[85vh] md:h-[80vh] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl mx-4'
                    }
                `}
            >
                {/* FIX 2: CONNEKT ICON ON FIRST PAGE */}
                {/* Replaced Sparkles header with ConnektIcon header matching Step 3 style */}
                {!isRoleStep && currentStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center flex-shrink-0 mb-4">
                        <div className="w-16 h-16 mb-2">
                            <ConnektIcon className="w-full h-full" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#008080] to-teal-400 bg-clip-text text-transparent">Identity</h1>
                        <p className="text-xs text-gray-500">How should we recognize you?</p>
                    </motion.div>
                )}

                <Stepper 
                    currentStep={currentStep} 
                    setCurrentStep={setCurrentStep} 
                    onComplete={handleComplete} 
                    isNextDisabled={isStepDisabled}
                >
                    
                    {/* STEP 1: IDENTITY */}
                    {/* Removed title="Identity" here because we added the custom ConnektIcon header above */}
                    <Step>
                        <div className="max-w-sm mx-auto w-full flex flex-col flex-1 min-h-0">
                            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-2">
                                <div className="space-y-3 text-[0.95rem]">
                                    <div>
                                        <label className="block text-[0.65rem] font-bold text-[#008080] uppercase mb-1">Display Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="Full Name"
                                                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-[#008080] outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[0.65rem] font-bold text-[#008080] uppercase mb-1">Profile Picture</label>
                                        <ProfilePictureUpload
                                            currentPhotoURL={profilePicturePreview || undefined}
                                            currentDisplayName={displayName}
                                            onUpload={async (file, previewUrl) => {
                                                setProfilePicture(file);
                                                setProfilePicturePreview(previewUrl);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[0.65rem] font-bold text-[#008080] uppercase mb-1">Unique Handle</label>
                                        <UsernameInput value={username} onChange={setUsername} onValidityChange={setIsUsernameValid} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Step>

                    {/* STEP 2: ROLE SELECTION (Full Screen) */}
                    <Step isFullScreen>
                        <RoleSelector 
                            items={ROLE_ITEMS} 
                            onSelect={setRoleIndex} 
                            className="w-full h-full absolute inset-0 bg-black"
                        />
                    </Step>

                    {/* STEP 3: DETAILS (Modified for Canvas Layout) */}
                    <Step>
                        {role === 'va' ? (
                            <div className="flex flex-col h-full w-full">
                                {/* Top: Animated Icon & Header */}
                                <div className="flex flex-col items-center justify-center flex-shrink-0 mb-4">
                                    <div className="w-16 h-16 mb-2">
                                        <ConnektIcon className="w-full h-full" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Skillset</h2>
                                    <p className="text-xs text-gray-500">Build your professional DNA</p>
                                </div>

                                {/* Middle: Selected Skills & Input */}
                                <div className="flex-shrink-0 relative z-20 mb-4">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-xs font-bold text-[#008080] uppercase">Selected Skills</label>
                                        <span className={`text-xs font-bold ${skills.length >= 5 ? 'text-green-500' : 'text-amber-500'}`}>
                                            {skills.length}/5 minimum
                                        </span>
                                    </div>
                                    
                                    <div className="relative group">
                                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:border-[#008080] focus-within:ring-1 focus-within:ring-[#008080] transition-all flex flex-wrap gap-2 min-h-[50px] max-h-[120px] overflow-y-auto no-scrollbar">
                                            {skills.map(skill => (
                                                <span key={skill} className="bg-[#008080]/10 text-[#008080] border border-[#008080]/20 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                                    {skill} 
                                                    <button onClick={() => toggleSkill(skill)} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                value={currentSkillInput}
                                                onChange={e => {
                                                    setCurrentSkillInput(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                onKeyDown={handleInputKeyDown}
                                                placeholder={skills.length === 0 ? "Search skills (e.g., React, Design)..." : "Add more..."}
                                                className="bg-transparent outline-none flex-1 min-w-[120px] text-sm py-1"
                                            />
                                        </div>

                                        {/* Dropdown Suggestions */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 max-h-[200px] overflow-y-auto z-30 no-scrollbar">
                                                {suggestions.map((skill) => (
                                                    <button
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center justify-between group"
                                                    >
                                                        <span>{skill}</span>
                                                        <Plus size={14} className="opacity-0 group-hover:opacity-100 text-[#008080]" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent mb-4 flex-shrink-0" />

                                {/* Bottom: The "Canvas" Cloud */}
                                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white/80 dark:from-zinc-900/80 to-transparent z-10 pointer-events-none" />
                                    
                                    <div className="overflow-y-auto no-scrollbar flex-1 pb-4">
                                        <div className="flex flex-wrap gap-2 justify-center content-start">
                                            {availableCanvasSkills.map((skill, i) => (
                                                <motion.button
                                                    key={skill}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.005 }}
                                                    onClick={() => toggleSkill(skill)}
                                                    className="px-3 py-1.5 rounded-full text-xs border border-gray-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 hover:border-[#008080] hover:text-[#008080] hover:bg-[#008080]/5 transition-all duration-200 text-gray-600 dark:text-gray-300"
                                                >
                                                    {skill}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white/80 dark:from-zinc-900/80 to-transparent z-10 pointer-events-none" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                                <Briefcase className="w-16 h-16 text-blue-500 mb-4" />
                                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Recruiter Profile</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-200 max-w-xs">
                                    You are setting up an employer account. Continue to the dashboard to start posting jobs.
                                </p>
                            </div>
                        )}
                    </Step>

                </Stepper>

                {/* Loading / Error States */}
                {error && (
                    <div className="absolute bottom-20 left-6 right-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center text-xs font-medium border border-red-200 dark:border-red-800 animate-in slide-in-from-bottom-2">
                        {error}
                    </div>
                )}
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
                        <Loader2 className="w-8 h-8 animate-spin text-[#008080] mb-2" />
                        <span className="text-sm font-bold text-[#008080]">Saving...</span>
                    </div>
                )}
            </motion.div>
        </div>
    );
}