'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MailService, type MailMessage } from '@/lib/services/mail-service';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import { ComposeModal } from '@/components/mail/ComposeModal';
import { MailHeader } from '@/components/mail/MailHeader';
import { MailPrimarySidebar } from '@/components/mail/MailPrimarySidebar';
import { MailListColumn } from '@/components/mail/MailListColumn';
import { MailViewerColumn } from '@/components/mail/MailViewerColumn';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import type { MailAddress, MailCategory } from '@/lib/types/mail.types';
import ConnektMailLogo from '@/components/branding/ConnektMailLogo';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

export default function MailPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [mails, setMails] = useState<MailMessage[]>([]);
    const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
    const [activeCategory, setActiveCategory] = useState<MailCategory | undefined>();
    const [mailAddresses, setMailAddresses] = useState<MailAddress[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<MailAddress | undefined>();
    const [searchQuery, setSearchQuery] = useState('');

    // Onboarding state
    const [showIntro, setShowIntro] = useState(false);
    const [introStep, setIntroStep] = useState(0);

    useEffect(() => {
        if (user) {
            checkOnboarding();
            loadMailAddresses();
            loadMails();
        }
    }, [user, activeFolder]);

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
            }
            // TODO: Add drafts and trash when implemented
            setMails(fetchedMails);
        } catch (error) {
            console.error('Error loading mails:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMail = async (
        recipient: string,
        subject: string,
        body: string,
        attachments?: any[],
        category?: string,
        signatureId?: string,
        contractData?: { templateId?: string; terms?: any; defaultTerms?: string } | null
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

        // If contract data is present, create a contract
        if (contractData) {
            try {
                // Create the contract
                const contractId = await ContractMailService.createContract(
                    user.uid,
                    username,
                    fromMailAddress,
                    'unknown_user_id', // TODO: Lookup recipient user ID from username
                    recipientUsername,
                    toMailAddress,
                    contractData.terms?.contractType || 'general',
                    subject,
                    body,
                    contractData.terms || {},
                    30, // 30 days expiration
                    contractData.defaultTerms // Pass defaultTerms
                );

                console.log('Contract created with ID:', contractId);
                // The ContractMailService.createContract already sends a notification mail
            } catch (error) {
                console.error('Error creating contract:', error);
                throw new Error('Failed to create contract');
            }
        } else {
            // Normal mail sending
            await MailService.sendMail(user.uid, username, displayName, recipientUsername, subject, body);
        }

        await loadMails();
    };

    const handleMailSelect = async (mail: MailMessage) => {
        setSelectedMail(mail);
        if (!mail.isRead && mail.id) {
            await MailService.markAsRead(mail.id);
            await loadMails();
        }
    };

    const handleDelete = async () => {
        if (!selectedMail?.id) return;
        await MailService.moveToTrash(selectedMail.id);
        setSelectedMail(null);
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
                    activeCategory={activeCategory}
                    unreadCounts={{ inbox: mails.filter(m => !m.isRead && m.folder === 'inbox').length, drafts: 0 }}
                    onFolderChange={setActiveFolder}
                    onCategoryChange={setActiveCategory}
                    onCompose={() => setIsComposing(true)}
                />

                {/* Mail List */}
                <MailListColumn
                    mails={mails}
                    selectedMail={selectedMail}
                    onMailSelect={handleMailSelect}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {/* Mail Viewer */}
                <MailViewerColumn
                    mail={selectedMail}
                    onReply={() => setIsComposing(true)}
                    onForward={() => setIsComposing(true)}
                    onDelete={handleDelete}
                />
            </div>

            {/* Compose Modal */}
            <ComposeModal
                isOpen={isComposing}
                onClose={() => setIsComposing(false)}
                onSend={handleSendMail}
            />
        </div>
    );
}
