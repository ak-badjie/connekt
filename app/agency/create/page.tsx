'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { AgencyService } from '@/lib/services/agency-service';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Upload, Check, ChevronRight, Loader2, Sparkles, Users } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

type Step = 0 | 1 | 2 | 3 | 4;

export default function CreateAgencyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentStep, setCurrentStep] = useState<Step>(0);
    const [loading, setLoading] = useState(false);

    // Get type from URL or default to 'va'
    const urlType = searchParams.get('type');
    const [selectedAgencyType, setSelectedAgencyType] = useState<'va' | 'recruiting'>((urlType === 'recruiting' ? 'recruiting' : 'va'));

    // Form data
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [agencyName, setAgencyName] = useState('');
    const [agencyUsername, setAgencyUsername] = useState('');
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [personalHandle, setPersonalHandle] = useState('');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const checkUsernameAvailability = async (username: string) => {
        if (username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            setIsUsernameAvailable(false);
            return;
        }

        const regex = /^[a-zA-Z0-9_-]+$/;
        if (!regex.test(username)) {
            setUsernameError('Only letters, numbers, underscores, and hyphens allowed');
            setIsUsernameAvailable(false);
            return;
        }

        setCheckingUsername(true);
        const isAvailable = await AgencyService.validateAgencyDomain(username);
        setCheckingUsername(false);

        if (isAvailable) {
            setUsernameError('');
            setIsUsernameAvailable(true);
        } else {
            setUsernameError('This handle is already taken');
            setIsUsernameAvailable(false);
        }
    };

    const handleCreateAgency = async () => {
        if (!user) return;

        setLoading(true);
        try {
            let logoUrl = '';

            // Upload logo if provided
            if (logoFile) {
                const storageRef = ref(storage, `agency_logos/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, logoFile);
                logoUrl = await getDownloadURL(storageRef);
            }

            // Create agency
            const agency = await AgencyService.createAgency({
                name: agencyName,
                username: agencyUsername,
                agencyType: selectedAgencyType === 'va' ? 'va_collective' : 'recruiter_collective',
                logoUrl,
                ownerId: user.uid,
                ownerAgencyEmail: `${personalHandle}@${agencyUsername}.com`
            });

            if (agency) {
                // Redirect to agency dashboard
                router.push(`/agency/@${agency.username}/dashboard`);
            } else {
                alert('Failed to create agency. Please try again.');
            }
        } catch (error) {
            console.error('Error creating agency:', error);
            alert('An error occurred while creating the agency.');
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep1 = true; // Logo is optional
    const canProceedStep2 = agencyName.trim().length >= 3;
    const canProceedStep3 = isUsernameAvailable && agencyUsername.length >= 3;
    const canProceedStep4 = personalHandle.trim().length >= 3;

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
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 mb-6 shadow-lg shadow-teal-500/30"
                    >
                        <Building2 className="text-white w-8 h-8" />
                    </motion.div>
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent">
                        Create Your Agency
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Step {currentStep} of 5
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${(currentStep / 4) * 100}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-[#008080] to-teal-600"
                        />
                    </div>
                </div>


                {/* Steps */}
                <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                        <Step0
                            selectedType={selectedAgencyType}
                            onSelectType={setSelectedAgencyType}
                            onNext={() => setCurrentStep(1)}
                        />
                    )}

                    {currentStep === 1 && (
                        <Step1
                            logoPreview={logoPreview}
                            onLogoUpload={handleLogoUpload}
                            onNext={() => setCurrentStep(2)}
                            onBack={() => setCurrentStep(0)}
                            canProceed={canProceedStep1}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2
                            agencyName={agencyName}
                            setAgencyName={setAgencyName}
                            onNext={() => setCurrentStep(3)}
                            onBack={() => setCurrentStep(1)}
                            canProceed={canProceedStep2}
                        />
                    )}

                    {currentStep === 3 && (
                        <Step3
                            agencyUsername={agencyUsername}
                            setAgencyUsername={setAgencyUsername}
                            isUsernameAvailable={isUsernameAvailable}
                            usernameError={usernameError}
                            checkingUsername={checkingUsername}
                            onCheckUsername={checkUsernameAvailability}
                            onNext={() => setCurrentStep(4)}
                            onBack={() => setCurrentStep(2)}
                            canProceed={canProceedStep3}
                        />
                    )}

                    {currentStep === 4 && (
                        <Step4
                            personalHandle={personalHandle}
                            setPersonalHandle={setPersonalHandle}
                            agencyUsername={agencyUsername}
                            onBack={() => setCurrentStep(3)}
                            onCreate={handleCreateAgency}
                            canProceed={canProceedStep4}
                            loading={loading}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// Step 0: Agency Type Selection
function Step0({ selectedType, onSelectType, onNext }: any) {
    return (
        <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">
                    What type of agency are you creating?
                </label>
                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => onSelectType('va')}
                        className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start gap-3 ${selectedType === 'va'
                            ? 'bg-[#008080]/10 border-[#008080] shadow-lg shadow-teal-500/20'
                            : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-[#008080]/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-[#008080]" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">VA Agency</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                            For freelancer teams who want to collaborate on projects together. Perfect for groups of VAs offering complementary skills.
                        </p>
                        <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                            <li>• Take on projects as a team</li>
                            <li>• Share tasks among team members</li>
                            <li>• Showcase collective skills and portfolio</li>
                        </ul>
                    </button>

                    <button
                        onClick={() => onSelectType('recruiting')}
                        className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start gap-3 ${selectedType === 'recruiting'
                            ? 'bg-[#008080]/10 border-[#008080] shadow-lg shadow-teal-500/20'
                            : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-[#008080]/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-[#008080]" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recruiting Agency</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                            For companies with recruiting teams who need to outsource work to virtual assistants. Manage your team and projects in one place.
                        </p>
                        <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                            <li>• Post projects and hire VAs</li>
                            <li>• Manage your recruiting team</li>
                            <li>• Track performance and payments</li>
                        </ul>
                    </button>
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#008080] to-teal-600 text-white hover:scale-[1.02] shadow-lg shadow-teal-500/25"
            >
                Continue <ChevronRight />
            </button>
        </motion.div>
    );
}

// Step 1: Logo Upload
function Step1({ logoPreview, onLogoUpload, onNext, onBack, canProceed }: any) {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">
                    Agency Logo (Optional)
                </label>
                <div className="flex flex-col items-center justify-center">
                    <label className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-[#008080] dark:hover:border-[#008080] transition-all cursor-pointer flex items-center justify-center overflow-hidden group">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center">
                                <Upload className="w-12 h-12 text-gray-400 group-hover:text-[#008080] mx-auto mb-2 transition-colors" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onLogoUpload}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    You can skip this step and add a logo later
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-all"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#008080] to-teal-600 text-white hover:scale-[1.02] shadow-lg shadow-teal-500/25"
                >
                    Continue <ChevronRight />
                </button>
            </div>
        </motion.div>
    );
}

// Step 2: Agency Name
function Step2({ agencyName, setAgencyName, onNext, onBack, canProceed }: any) {
    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">
                    Agency Name
                </label>
                <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g., Garden Agency"
                    className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 outline-none transition-all focus:border-[#008080] dark:focus:border-[#008080] text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    This is the official name of your agency
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-all"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${canProceed
                        ? 'bg-gradient-to-r from-[#008080] to-teal-600 text-white hover:scale-[1.02] shadow-lg shadow-teal-500/25'
                        : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Continue <ChevronRight />
                </button>
            </div>
        </motion.div>
    );
}

// Step 3: Agency Domain/Handle
function Step3({ agencyUsername, setAgencyUsername, isUsernameAvailable, usernameError, checkingUsername, onCheckUsername, onNext, onBack, canProceed }: any) {
    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">
                    Agency Handle
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={agencyUsername}
                        onChange={(e) => {
                            setAgencyUsername(e.target.value);
                            onCheckUsername(e.target.value);
                        }}
                        placeholder="garden"
                        className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 pr-40 outline-none transition-all focus:border-[#008080] dark:focus:border-[#008080] text-gray-900 dark:text-white"
                    />
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                        .com
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                            <Loader2 className="animate-spin text-[#008080]" size={20} />
                        ) : isUsernameAvailable ? (
                            <Check className="text-green-500" size={20} />
                        ) : null}
                    </div>
                </div>
                {usernameError && <p className="text-red-500 text-xs">{usernameError}</p>}
                {isUsernameAvailable && <p className="text-green-500 text-xs">Handle is available!</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    This will be your agency's unique domain
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-all"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${canProceed
                        ? 'bg-gradient-to-r from-[#008080] to-teal-600 text-white hover:scale-[1.02] shadow-lg shadow-teal-500/25'
                        : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Continue <ChevronRight />
                </button>
            </div>
        </motion.div>
    );
}

// Step 4: Personal Agency Email
function Step4({ personalHandle, setPersonalHandle, agencyUsername, onBack, onCreate, canProceed, loading }: any) {
    return (
        <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <label className="text-sm font-medium text-[#008080] uppercase tracking-wider">
                    Your Agency Email
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={personalHandle}
                        onChange={(e) => setPersonalHandle(e.target.value)}
                        placeholder="abdul"
                        className="w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 pr-48 outline-none transition-all focus:border-[#008080] dark:focus:border-[#008080] text-gray-900 dark:text-white"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                        @{agencyUsername}.com
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    This will be your personal email address within the agency
                </p>
            </div>

            <div className="bg-[#008080]/10 border border-[#008080]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Sparkles className="text-[#008080] flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            You'll get your own agency email!
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Your email will be: <span className="font-mono font-bold text-[#008080]">
                                {personalHandle || 'yourname'}@{agencyUsername}.com
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="flex-1 py-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-all disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={onCreate}
                    disabled={!canProceed || loading}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${canProceed && !loading
                        ? 'bg-gradient-to-r from-[#008080] to-teal-600 text-white hover:scale-[1.02] shadow-lg shadow-teal-500/25'
                        : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" /> Creating...
                        </>
                    ) : (
                        <>
                            Create Agency <Check />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
