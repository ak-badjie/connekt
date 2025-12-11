'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MailService, type MailMessage } from '@/lib/services/mail-service';
import { ContractMailService } from '@/lib/services/contract-mail-service';
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
                contractId = await ContractMailService.createContractDocument(
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

    // Onboarding Flow
    if (showIntro) {
        return (
            <div className="h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {introStep === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <ConnektMailLogo size="large" color="teal" />
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-bold text-[#008080] mt-8 mb-4"
                            >
                                ConnektMail
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl text-gray-600 dark:text-gray-400"
                            >
                                Loading your inbox...
                            </motion.p>
                        </motion.div>
                    )}

                    {introStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="max-w-4xl mx-auto p-8 text-center"
                        >
                            <ConnektMailLogo size="large" color="teal" />
                            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mt-8 mb-6">
                                Welcome to ConnektMail
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                                Your professional communication platform on Connekt
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700"
                                >
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                        <span className="text-2xl">@</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Username-Based Routing</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Simply use @username to send messages. No complex email addresses needed.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700"
                                >
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                        <span className="text-2xl">✍️</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Rich Text Formatting</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Format your messages with bold, italic, headings, lists, and more.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700"
                                >
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                        <span className="text-2xl">✓</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Verified Internal Communication</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        All messages are secure and verified within the Connekt platform.
                                    </p>
                                </motion.div>
                            </div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                onClick={() => setIntroStep(2)}
                                className="px-12 py-4 bg-gradient-to-r from-[#f97316] to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
                            >
                                Setup My Inbox
                            </motion.button>
                        </motion.div>
                    )}

                    {introStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="max-w-2xl mx-auto p-8 text-center"
                        >
                            <div className="mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#008080] to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-4xl text-white">✉️</span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    Your Mail Address
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-8">
                                    Your ConnektMail address is:
                                </p>
                                <div className="px-8 py-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border-2 border-[#008080] inline-block">
                                    <p className="text-2xl font-bold text-[#008080]">
                                        {mailAddresses[0]?.address || 'Loading...'}
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                onClick={completeIntro}
                                className="px-12 py-4 bg-gradient-to-r from-[#f97316] to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
                            >
                                Enter Inbox
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Auto-advance from step 0 */}
                {introStep === 0 && setTimeout(() => setIntroStep(1), 3000) && null}
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
