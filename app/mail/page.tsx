'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MailService, MailMessage } from '@/lib/services/mail-service';
import { Loader2, Send, Inbox, Trash2, Plus, Search, Mail as MailIcon, ArrowRight, CheckCircle2, FileText, X } from 'lucide-react';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MailPage() {
    const { user, userProfile } = useAuth();
    const [mails, setMails] = useState<MailMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
    const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
    const [isComposing, setIsComposing] = useState(false);

    // First Time Experience State
    const [showIntro, setShowIntro] = useState(false);
    const [introStep, setIntroStep] = useState(0);

    // Compose State
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user) {
            checkMailOnboarding();
        }
    }, [user]);

    useEffect(() => {
        if (!showIntro && user) {
            loadMails();
        }
    }, [user, activeTab, showIntro]);

    const checkMailOnboarding = async () => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists() && !snap.data().mailOnboardingCompleted) {
            setShowIntro(true);
        }
        setLoading(false);
    };

    const completeIntro = async () => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), {
            mailOnboardingCompleted: true
        });
        setShowIntro(false);
    };

    const loadMails = async () => {
        setLoading(true);
        try {
            const data = activeTab === 'inbox'
                ? await MailService.getInbox(user!.uid)
                : await MailService.getSent(user!.uid);
            setMails(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!user || !userProfile) return;
        setSending(true);
        try {
            await MailService.sendMail(
                user.uid,
                userProfile.username || 'unknown',
                userProfile.displayName || 'Unknown',
                recipient.replace('@', ''),
                subject,
                body
            );
            setIsComposing(false);
            setRecipient('');
            setSubject('');
            setBody('');
            if (activeTab === 'sent') loadMails();
        } catch (error: any) {
            alert(error.message || 'Failed to send mail');
        } finally {
            setSending(false);
        }
    };

    const handleSelectMail = async (mail: MailMessage) => {
        setSelectedMail(mail);
        if (!mail.isRead && mail.folder === 'inbox') {
            await MailService.markAsRead(mail.id!);
            setMails(prev => prev.map(m => m.id === mail.id ? { ...m, isRead: true } : m));
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}min ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Auto-advance the loading screen
    useEffect(() => {
        if (showIntro && introStep === 0) {
            const timer = setTimeout(() => setIntroStep(1), 3000);
            return () => clearTimeout(timer);
        }
    }, [showIntro, introStep]);

    // --- RENDER INTRO FLOW ---
    if (showIntro) {
        return (
            <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center p-6">
                {introStep === 0 && (
                    <LoadingScreen variant="mail" />
                )}

                {introStep > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl w-full text-center"
                    >
                        {introStep === 1 && (
                            <>
                                <h1 className="text-5xl font-bold mb-6 text-blue-600 font-headline">Connekt Mail</h1>
                                <p className="text-xl text-gray-500 mb-10">Secure, internal corporate communication for the modern workforce.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    <div className="p-6 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4 text-2xl font-bold">@</div>
                                        <h3 className="font-bold mb-2">Username Routing</h3>
                                        <p className="text-sm text-gray-400">No complex emails. Just send to @username.</p>
                                    </div>
                                    <div className="p-6 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-4"><FileText size={20} /></div>
                                        <h3 className="font-bold mb-2">Rich Format</h3>
                                        <p className="text-sm text-gray-400">Full Markdown support for professional contracts & updates.</p>
                                    </div>
                                    <div className="p-6 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4"><CheckCircle2 size={20} /></div>
                                        <h3 className="font-bold mb-2">Verified</h3>
                                        <p className="text-sm text-gray-400">All communications are internal and verified by Connekt.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIntroStep(2)}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 mx-auto"
                                >
                                    Setup My Inbox <ArrowRight />
                                </button>
                            </>
                        )}

                        {introStep === 2 && (
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6"
                                >
                                    <CheckCircle2 size={48} />
                                </motion.div>
                                <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
                                <p className="text-gray-500 mb-8">Your specialized inbox is ready at <span className="font-bold text-gray-900 dark:text-white">@{userProfile?.username}</span></p>
                                <button
                                    onClick={completeIntro}
                                    className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-all"
                                >
                                    Enter Inbox
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex flex-col gap-2">
                <button
                    onClick={() => setIsComposing(true)}
                    className="w-full py-4 bg-[#008080] hover:bg-teal-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 mb-4 transition-all"
                >
                    <Plus size={20} /> Compose
                </button>

                <nav className="space-y-1">
                    <button
                        onClick={() => { setActiveTab('inbox'); setSelectedMail(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'inbox' ? 'bg-white dark:bg-zinc-800 text-[#008080] shadow-sm' : 'text-gray-500 hover:bg-orange-50 dark:hover:bg-zinc-800/50'
                            }`}
                    >
                        <Inbox size={18} /> Inbox
                    </button>
                    <button
                        onClick={() => { setActiveTab('sent'); setSelectedMail(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'sent' ? 'bg-white dark:bg-zinc-800 text-[#008080] shadow-sm' : 'text-gray-500 hover:bg-orange-50 dark:hover:bg-zinc-800/50'
                            }`}
                    >
                        <Send size={18} /> Sent
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-500 hover:bg-orange-50 dark:hover:bg-zinc-800/50 transition-all">
                        <Trash2 size={18} /> Trash
                    </button>
                </nav>
            </div>

            {/* Mail List */}
            <div className="w-96 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Search mail..." className="w-full pl-10 pr-4 py-2 bg-orange-50 dark:bg-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#008080]" /></div>
                    ) : mails.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">No mails found</div>
                    ) : (
                        mails.map(mail => (
                            <div
                                key={mail.id}
                                onClick={() => handleSelectMail(mail)}
                                className={`p-4 rounded-xl cursor-pointer transition-all ${selectedMail?.id === mail.id
                                    ? 'bg-[#008080]/5 border border-[#008080]'
                                    : 'border border-transparent hover:bg-orange-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm ${!mail.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                        {activeTab === 'inbox' ? mail.senderName : `@${mail.recipientUsername}`}
                                    </h4>
                                    <span className="text-[10px] text-gray-400">
                                        {formatTime(mail.createdAt)}
                                    </span>
                                </div>
                                <h5 className={`text-xs mb-1 ${!mail.isRead ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                    {mail.subject}
                                </h5>
                                <p className="text-[10px] text-gray-400 line-clamp-2">
                                    {mail.body.replace(/[#*`]/g, '').substring(0, 60)}...
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mail Content */}
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden relative shadow-sm">
                {isComposing ? (
                    <div className="h-full flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h2>
                            <button onClick={() => setIsComposing(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 flex-1 flex flex-col">
                            <input
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                placeholder="To: @username"
                                className="w-full px-4 py-3 bg-orange-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-[#008080] outline-none transition-all"
                            />
                            <input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Subject"
                                className="w-full px-4 py-3 bg-orange-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-[#008080] outline-none transition-all font-medium"
                            />
                            <div className="flex-1 overflow-hidden">
                                <MarkdownEditor value={body} onChange={setBody} />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !recipient || !subject}
                                    className="px-8 py-3 bg-[#008080] hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send Message</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : selectedMail ? (
                    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedMail.subject}</h1>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                        {selectedMail.senderName[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedMail.senderName}</p>
                                        <p className="text-xs text-gray-500">@{selectedMail.senderUsername}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">
                                    {selectedMail.createdAt ? formatTime(selectedMail.createdAt) : ''}
                                </p>
                            </div>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{selectedMail.body}</ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-orange-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <MailIcon size={40} className="text-gray-300" />
                        </div>
                        <p>Select a mail to read</p>
                    </div>
                )}
            </div>
        </div>
    );
}
