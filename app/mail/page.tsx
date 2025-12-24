'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MailService, type MailMessage } from '@/lib/services/mail-service';
import { createContractDocument } from '@/lib/services/legal';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';
import { ComposeModal } from '@/components/mail/ComposeModal';
import { ContractDrafterModal } from '@/components/mail/ContractDrafterModal';
import { MailHeader } from '@/components/mail/MailHeader';
import { MailPrimarySidebar } from '@/components/mail/MailPrimarySidebar';
import { MailListColumn } from '@/components/mail/MailListColumn';
import { MailViewerColumn } from '@/components/mail/MailViewerColumn';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import type { MailAddress, MailCategory } from '@/lib/types/mail.types';
import ConnektMailLogo from '@/components/branding/ConnektMailLogo';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

type AutoContractDraftRequest = {
    templateId?: string;
    contractType?: string;
    brief?: string;
    variables?: Record<string, any>;
    autoStart?: boolean;
    autoSelectTaskId?: string;
    autoSelectProjectId?: string;
    autoSelectWorkspaceId?: string;
};

export default function MailPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [mails, setMails] = useState<MailMessage[]>([]);
    const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
    const [activeCategories, setActiveCategories] = useState<Array<MailCategory | 'All'>>(['All']);
    const [mailAddresses, setMailAddresses] = useState<MailAddress[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<MailAddress | undefined>();
    const [searchQuery, setSearchQuery] = useState('');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [storageUsedGB, setStorageUsedGB] = useState(0);
    const [storageTotalGB, setStorageTotalGB] = useState(1.0);
    const [composePrefill, setComposePrefill] = useState<{ recipient?: string; subject?: string; body?: string }>();
    const [autoContractDraftRequest, setAutoContractDraftRequest] = useState<AutoContractDraftRequest>();

    // Onboarding state
    const [showIntro, setShowIntro] = useState(false);
    const [introStep, setIntroStep] = useState(0);

    const [isContractDrafterOpen, setIsContractDrafterOpen] = useState(false);
    const [contractResponseRecipient, setContractResponseRecipient] = useState<string>('');

    useEffect(() => {
        if (user) {
            checkOnboarding();
            loadMailAddresses();
            loadMails();
            loadStorageQuota();
        }
    }, [user, activeFolder]);

    // Handle deep-links from projects/tasks/workspaces to auto-open composer with contract AI or template prefills
    useEffect(() => {
        if (!searchParams) return;

        const shouldCompose = searchParams.get('compose') === '1';
        if (!shouldCompose) return;

        const to = searchParams.get('to') || undefined;
        const subject = searchParams.get('subject') || undefined;
        const body = searchParams.get('body') || undefined;
        const templateId = searchParams.get('templateId') || undefined;
        const contractType = searchParams.get('contractType') || undefined;
        const brief = searchParams.get('brief') || undefined;
        const autoStartParam = searchParams.get('autoStart');
        const autoStart = autoStartParam === '1';

        let variables: Record<string, any> | undefined;
        const rawVars = searchParams.get('variables');
        if (rawVars) {
            try {
                variables = JSON.parse(rawVars);
            } catch (err) {
                console.warn('Failed to parse contract variables from URL', err);
            }
        }

        // Support both single task ID and multi-task IDs (comma-separated)
        const autoSelectTaskId = searchParams.get('autoSelectTaskIds') || searchParams.get('autoSelectTaskId') || undefined;
        const autoSelectProjectId = searchParams.get('autoSelectProjectId') || undefined;
        const autoSelectWorkspaceId = searchParams.get('autoSelectWorkspaceId') || undefined;

        setComposePrefill({ recipient: to, subject, body });
        setActiveCategories(['Contracts']);
        setAutoContractDraftRequest({ templateId, contractType, brief, variables, autoStart, autoSelectTaskId, autoSelectProjectId, autoSelectWorkspaceId });
        setIsComposing(true);
    }, [searchParams]);

    const handleResponse = (mail: MailMessage) => {
        // Extract context from the proposal metadata if available
        const terms = (mail as any).contractData?.terms || {};
        const subject = mail.subject;

        // Default Logic
        let templateId = 'Employment Contract'; // Name from SYSTEM_TEMPLATES default
        let contractType = 'job';
        let projectId = terms.linkedProjectId || '';
        let taskId = terms.linkedTaskId || '';

        // Priority 1: Explicit Links in Metadata
        if (taskId) {
            templateId = 'Task Admin Contract (Task Ownership)';
            contractType = 'task_admin';
        } else if (projectId) {
            templateId = 'Project Admin Contract (Temporal Owner)';
            contractType = 'project_admin';
        }
        // Priority 2: Subject Line Inference (Fallback)
        else if (subject.toLowerCase().includes('project')) {
            templateId = 'Project Admin Contract (Temporal Owner)';
            contractType = 'project_admin';
        } else if (subject.toLowerCase().includes('task')) {
            // If we infer task but have no ID, we might still want a task contract
            templateId = 'Task Admin Contract (Task Ownership)';
            contractType = 'task_admin';
        }

        setComposePrefill({
            recipient: mail.senderUsername,
            subject: `Contract Offer: ${mail.subject.replace('Proposal: ', '')}`,
            body: `Hi,\n\nWe were impressed by your proposal. Please review the attached contract offer.\n\nBest regards,`
        });

        setAutoContractDraftRequest({
            templateId: templateId,
            contractType: contractType,
            autoStart: true,
            variables: {
                jobTitle: mail.subject.replace('Proposal: ', ''),
                employeeName: mail.senderName,
                contractorName: mail.senderName,
                // Pass key IDs for auto-association
                projectId: projectId,
                taskId: taskId,
                workspaceId: terms.autoSelectWorkspaceId || '', // If we saved this too
                // Copy brief/description if available to help AI fill role description
                roleDescription: terms.description || (mail as any).contractData?.description || ''
            }
        });
        setIsComposing(true);
    };

    const checkOnboarding = async () => {
        if (!user) return;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (!userData?.mailOnboardingCompleted) {
            setShowIntro(true);
        }
    };

    const loadMailAddresses = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            const username = userData?.username || 'user';
            const displayName = userData?.displayName || username;

            const addresses = await MailService.getUserMailAddresses(user.uid, username, displayName);
            setMailAddresses(addresses);
            if (addresses.length > 0 && !selectedAddress) {
                setSelectedAddress(addresses[0]); // Default to personal email
            }
        } catch (error) {
            console.error('Error loading mail addresses:', error);
        }
    };

    const loadMails = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let fetchedMails: MailMessage[] = [];
            if (activeFolder === 'inbox') {
                fetchedMails = await MailService.getInbox(user.uid);
            } else if (activeFolder === 'sent') {
                fetchedMails = await MailService.getSent(user.uid);
            } else if (activeFolder === 'drafts') {
                const drafts = await MailService.getDrafts(user.uid);
                // Convert drafts to MailMessage format for display
                fetchedMails = drafts.map(draft => ({
                    ...draft,
                    id: draft.id,
                    ownerId: draft.userId,
                    type: 'sent' as const,
                    isRead: true,
                    folder: 'drafts' as const
                } as unknown as MailMessage));
            }
            // TODO: Add trash when implemented
            setMails(fetchedMails);
        } catch (error) {
            console.error('Error loading mails:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStorageQuota = async () => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            const username = userData?.username || 'user';
            const mailAddress = `${username}@connekt.com`;

            const quota = await StorageQuotaService.getStorageQuota(mailAddress);
            if (quota) {
                setStorageUsedGB(StorageQuotaService.bytesToGB(quota.usedSpace));
                setStorageTotalGB(StorageQuotaService.bytesToGB(quota.totalQuota));
            }
        } catch (error) {
            console.error('Error loading storage quota:', error);
        }
    };

    const handleSendMail = async (
        recipient: string,
        subject: string,
        body: string,
        attachments?: any[],
        category?: string,
        signatureId?: string,
        contractData?: { templateId?: string; terms?: any; defaultTerms?: string; description?: string } | null
    ) => {
        if (!user) return;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const username = userData?.username || 'user';
        const displayName = userData?.displayName || username;

        // Parse recipient to get username and address
        const recipientParts = recipient.split('@');
        const recipientUsername = recipientParts[0];
        const recipientDomain = recipientParts[1] || 'connekt.com';
        const toMailAddress = `${recipientUsername}@${recipientDomain}`;
        const fromMailAddress = `${username}@connekt.com`;

        // Resolve recipient user ID from usernames collection
        const recipientRef = doc(db, 'usernames', recipientUsername.toLowerCase());
        const recipientSnap = await getDoc(recipientRef);
        if (!recipientSnap.exists()) {
            throw new Error(`User @${recipientUsername} not found.`);
        }
        const toUserId = recipientSnap.data().uid;
        const toUserProfile = await getDoc(doc(db, 'users', toUserId));
        const toDisplayName = toUserProfile.data()?.displayName || recipientUsername;

        // If contract data is present, create a contract
        let contractId: string | undefined;
        if (contractData) {
            try {
                // Create the contract document only
                contractId = await createContractDocument(
                    user.uid,
                    username,
                    fromMailAddress,
                    toUserId,
                    recipientUsername,
                    toMailAddress,
                    contractData.terms?.contractType || 'general',
                    contractData.terms?.title || subject,
                    contractData.description || body,
                    contractData.terms || {},
                    30, // 30 days expiration
                    contractData.defaultTerms // Pass defaultTerms
                );

                console.log('Contract created with ID:', contractId);
            } catch (error) {
                console.error('Error creating contract:', error);
                throw new Error('Failed to create contract');
            }
        }

        // Construct from address
        const fromAddress = {
            address: fromMailAddress,
            type: 'personal', // Assuming personal for now
            displayName: displayName,
            username: username,
            domain: 'connekt.com'
        };

        // Send mail
        await MailService.sendMailFromAddress(
            fromAddress as any,
            toMailAddress,
            subject,
            body,
            attachments,
            category as any,
            signatureId,
            contractId,
            user.uid
        );

        await loadMails();
    };

    const handleMailSelect = async (mail: MailMessage) => {
        setSelectedMail(mail);
        if (!mail.isRead && mail.id) {
            await MailService.markAsRead(mail.id);
            await loadMails();
        }
    };

    const openComposeWithPrefill = (prefill: {
        recipient?: string;
        subject?: string;
        body?: string;
        contractId?: string;
        contractType?: string;
        brief?: string;
        category?: MailCategory;
        autoContractDraftRequest?: AutoContractDraftRequest;
    }) => {
        setComposePrefill({ recipient: prefill.recipient, subject: prefill.subject, body: prefill.body });

        if (prefill.autoContractDraftRequest) {
            setAutoContractDraftRequest(prefill.autoContractDraftRequest);
            setActiveCategories(['Contracts']);
        } else if (prefill.contractId || prefill.contractType || prefill.brief) {
            setAutoContractDraftRequest({
                contractType: prefill.contractType,
                brief: prefill.brief,
                autoStart: true
            });
            setActiveCategories(['Contracts']);
        } else {
            setAutoContractDraftRequest(undefined);
        }

        setIsComposing(true);
    };

    const closeCompose = () => {
        setIsComposing(false);
        setAutoContractDraftRequest(undefined);
        setComposePrefill(undefined);
    };

    const handleDelete = async () => {
        if (!selectedMail?.id) return;
        await MailService.moveToTrash(selectedMail.id);
        setSelectedMail(null);
        await loadMails();
    };

    const handleSaveDraft = async (
        recipient: string,
        subject: string,
        body: string,
        attachments?: any[],
        category?: string
    ) => {
        if (!user) return;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const username = userData?.username || 'user';
        const displayName = userData?.displayName || username;
        const photoURL = userData?.photoURL || '';

        // Parse recipient to get details
        const recipientParts = recipient.split('@');
        const recipientUsername = recipientParts[0] || '';
        const recipientDomain = recipientParts[1] || 'connekt.com';
        const toMailAddress = recipientUsername ? `${recipientUsername}@${recipientDomain}` : '';
        const fromMailAddress = `${username}@connekt.com`;

        // Resolve recipient display name and photo if possible
        let recipientName = recipientUsername;
        let recipientPhotoURL = '';
        if (recipientUsername) {
            try {
                const recipientRef = doc(db, 'usernames', recipientUsername.toLowerCase());
                const recipientSnap = await getDoc(recipientRef);
                if (recipientSnap.exists()) {
                    const toUserId = recipientSnap.data().uid;
                    const toUserProfile = await getDoc(doc(db, 'users', toUserId));
                    recipientName = toUserProfile.data()?.displayName || recipientUsername;
                    recipientPhotoURL = toUserProfile.data()?.photoURL || '';
                }
            } catch (err) {
                console.warn('Could not resolve recipient details:', err);
            }
        }

        await MailService.saveDraft({
            userId: user.uid,
            senderId: user.uid,
            senderUsername: username,
            senderName: displayName,
            senderAddress: fromMailAddress,
            senderPhotoURL: photoURL,
            recipientUsername: recipientUsername,
            recipientAddress: toMailAddress,
            recipientName,
            recipientPhotoURL,
            subject,
            body,
            attachments,
            category: category as any,
            folder: 'drafts',
            createdAt: null as any
        });

        await loadMails();
    };

    const completeIntro = async () => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), {
            mailOnboardingCompleted: true
        });
        setShowIntro(false);
    };

    const shouldShowLoading = useMinimumLoading(!user || loading);

    if (shouldShowLoading) {
        return <LoadingScreen variant="mail" />;
    }

    // Onboarding Flow - Premium Design
    if (showIntro) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 flex items-center justify-center overflow-hidden relative px-6">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#008080]/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />
                </div>

                <AnimatePresence mode="wait">
                    {introStep === 0 && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center relative z-10"
                        >
                            <motion.div
                                animate={{
                                    boxShadow: ["0 0 20px rgba(0,128,128,0.2)", "0 0 50px rgba(0,128,128,0.4)", "0 0 20px rgba(0,128,128,0.2)"]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50 flex items-center justify-center shadow-xl"
                            >
                                <ConnektMailLogo size="large" color="teal" />
                            </motion.div>
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-bold text-[#008080] mb-4"
                            >
                                ConnektMail
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-lg text-gray-500"
                            >
                                Preparing your inbox...
                            </motion.p>
                        </motion.div>
                    )}

                    {introStep === 1 && (
                        <motion.div
                            key="showcase"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-6xl mx-auto relative z-10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                {/* LEFT: Email Mockup */}
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
                                >
                                    {/* Email Header */}
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify.between">
                                        <div className="flex items-center gap-2">
                                            <ConnektMailLogo size="small" color="teal" />
                                            <span className="text-sm font-bold text-gray-900">ConnektMail</span>
                                        </div>
                                        <div className="flex items-center gap-1 ml-auto">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-xs text-gray-500">Secure</span>
                                        </div>
                                    </div>

                                    {/* Email Content */}
                                    <div className="p-4">
                                        {/* From/To */}
                                        <div className="mb-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 w-12">From:</span>
                                                <span className="font-medium text-gray-900">recruiter@connekt.com</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 w-12">To:</span>
                                                <span className="font-medium text-[#008080]">{mailAddresses[0]?.address || 'you@connekt.com'}</span>
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="mb-4 pb-4 border-b border-gray-100">
                                            <h4 className="font-bold text-gray-900">Project Proposal: Web Development</h4>
                                        </div>

                                        {/* Body Preview */}
                                        <div className="space-y-2 mb-4">
                                            <div className="h-2.5 w-full bg-gray-100 rounded" />
                                            <div className="h-2.5 w-4/5 bg-gray-100 rounded" />
                                            <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
                                        </div>

                                        {/* Contract Attachment */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-[#008080]/5 border border-[#008080]/20"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900">Contract_Agreement.pdf</p>
                                                <p className="text-xs text-gray-500">Legally binding • Ready to sign</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-[#008080] flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Email Actions */}
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                                        <button className="flex-1 py-2 px-4 bg-[#008080] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Reply
                                        </button>
                                        <button className="py-2 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg">
                                            Sign Contract
                                        </button>
                                    </div>
                                </motion.div>

                                {/* RIGHT: Content */}
                                <div className="flex flex-col">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-center gap-3 mb-4"
                                    >
                                        <ConnektMailLogo size="large" color="teal" />
                                        <span className="px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold">
                                            YOUR PROFESSIONAL EMAIL
                                        </span>
                                    </motion.div>

                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
                                    >
                                        Welcome to<br />
                                        <span className="text-[#008080]">ConnektMail</span>
                                    </motion.h1>

                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-gray-600 text-lg mb-6 max-w-md"
                                    >
                                        Your professional @connekt.com email. Send contracts, proposals, and secure messages all in one place.
                                    </motion.p>

                                    {/* Feature Grid */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="grid grid-cols-2 gap-3 mb-8"
                                    >
                                        {[
                                            { icon: '📧', label: '@connekt.com Email', desc: 'Professional address' },
                                            { icon: '📄', label: 'Contract Attachments', desc: 'Legally binding docs' },
                                            { icon: '🔒', label: 'Secure Messaging', desc: 'End-to-end encrypted' },
                                            { icon: '⏰', label: 'Smart Scheduling', desc: 'Automated follow-ups' }
                                        ].map((feature, i) => (
                                            <motion.div
                                                key={feature.label}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.7 + i * 0.1 }}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-[#008080] transition-colors shadow-sm"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-[#008080]/10 flex items-center justify-center text-lg">
                                                    {feature.icon}
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 text-xs font-bold">{feature.label}</p>
                                                    <p className="text-gray-500 text-[10px]">{feature.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Email Address Display */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.9 }}
                                        className="mb-6 p-4 rounded-2xl bg-[#008080]/5 border-2 border-[#008080]/30"
                                    >
                                        <p className="text-xs text-gray-500 mb-1">Your ConnektMail Address:</p>
                                        <p className="text-xl font-bold text-[#008080]">
                                            {mailAddresses[0]?.address || 'Loading...'}
                                        </p>
                                    </motion.div>

                                    {/* CTA Button */}
                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1 }}
                                        onClick={completeIntro}
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#008080] to-teal-600 text-white font-bold text-lg rounded-full w-fit hover:scale-105 transition-all shadow-lg shadow-teal-500/30"
                                    >
                                        Enter My Inbox
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Auto-advance from step 0 */}
                {introStep === 0 && setTimeout(() => setIntroStep(1), 2500) && null}
            </div>
        );
    }

    // Main Mail Interface
    return (
        <div className="h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col overflow-hidden">
            {/* Mail Header */}
            <MailHeader
                mailAddresses={mailAddresses}
                selectedAddress={selectedAddress}
                onAddressChange={setSelectedAddress}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                userProfile={{ displayName: user?.displayName, email: user?.email }}
            />

            {/* Three-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Primary Sidebar */}
                <MailPrimarySidebar
                    activeFolder={activeFolder}
                    activeCategories={activeCategories}
                    unreadCounts={{ inbox: mails.filter(m => !m.isRead && m.folder === 'inbox').length, drafts: 0 }}
                    onFolderChange={setActiveFolder}
                    onCategoriesChange={setActiveCategories}
                    onCompose={() => setIsComposing(true)}
                    storageUsedGB={storageUsedGB}
                    storageTotalGB={storageTotalGB}
                />

                {/* Mail List */}
                <MailListColumn
                    mails={mails.filter(mail => {
                        // Unread filter
                        if (showUnreadOnly && mail.isRead) return false;
                        // Category filter
                        if (!activeCategories.includes('All')) {
                            return mail.category && activeCategories.includes(mail.category);
                        }
                        return true;
                    })}
                    selectedMail={selectedMail}
                    onMailSelect={handleMailSelect}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    showUnreadOnly={showUnreadOnly}
                    onToggleUnreadOnly={setShowUnreadOnly}
                />

                {/* Mail Viewer */}
                <MailViewerColumn
                    mail={selectedMail}
                    onReply={(prefill) => openComposeWithPrefill({
                        recipient: prefill.recipient,
                        subject: prefill.subject,
                        body: prefill.body,
                        contractType: prefill.contractId ? 'general' : undefined,
                        brief: prefill.contractId ? 'Replying with referenced contract' : undefined
                    })}
                    onForward={(prefill) => openComposeWithPrefill({
                        subject: prefill.subject,
                        body: prefill.body,
                        contractType: prefill.contractId ? 'general' : undefined,
                        brief: prefill.contractId ? 'Forwarding with referenced contract' : undefined
                    })}
                    onDelete={handleDelete}
                    onMarkUnread={async () => {
                        if (!selectedMail?.id) return;
                        await MailService.markAsUnread(selectedMail.id);
                        await loadMails();
                    }}
                    onResponse={handleResponse}
                />
            </div>

            {/* Compose Modal */}
            <ComposeModal
                isOpen={isComposing}
                onClose={closeCompose}
                onSend={handleSendMail}
                onSaveDraft={handleSaveDraft}
                initialData={composePrefill}
                autoContractDraftRequest={autoContractDraftRequest}
            />
        </div>
    );
}
