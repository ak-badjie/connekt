'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSidebar } from './ChatSidebar';
import WidgetActiveChat from './WidgetActiveChat';
import WidgetUserProfile from './WidgetUserProfile';
import { useAuth } from '@/context/AuthContext';
import { getConversationById, EnrichedConversation } from '@/lib/services/realtime-service';

type ViewMode = 'sidebar' | 'chat' | 'profile';

export function GlobalChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<EnrichedConversation | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('sidebar');
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [totalUnread, setTotalUnread] = useState(0);

    const toggleOpen = () => setIsOpen(!isOpen);
    const toggleMinimize = () => setIsMinimized(!isMinimized);

    // Load conversation when selected
    useEffect(() => {
        if (selectedConversationId) {
            getConversationById(selectedConversationId).then((conv) => {
                setSelectedConversation(conv);
                setViewMode('chat');
            });
        }
    }, [selectedConversationId]);

    const handleBack = () => {
        setSelectedConversationId(null);
        setSelectedConversation(null);
        setViewMode('sidebar');
    };

    const handleViewProfile = (userId: string) => {
        setProfileUserId(userId);
        setViewMode('profile');
    };

    const handleProfileBack = () => {
        setViewMode('chat');
        setProfileUserId(null);
    };

    const handleStartChatFromProfile = () => {
        setViewMode('chat');
        setProfileUserId(null);
    };

    return (
        <>
            {/* Trigger Button - White background with teal icon */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
                className={`fixed bottom-6 right-6 w-14 h-14 bg-white text-[#008080] rounded-full shadow-2xl flex items-center justify-center z-[9999] hover:shadow-3xl border border-gray-100 transition-all ${isOpen ? 'hidden' : 'flex'}`}
            >
                <MessageSquare size={24} />

                {/* Unread Badge */}
                {totalUnread > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    >
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </motion.span>
                )}
            </motion.button>

            {/* Widget Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, y: 100, scale: 0.9, width: 380 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: isMinimized ? 56 : 550,
                            width: 380,
                            borderRadius: "20px"
                        }}
                        exit={{
                            height: [null, 56, 56],
                            width: [380, 380, 56],
                            opacity: [1, 1, 0],
                            borderRadius: ["20px", "20px", "50%"],
                            transition: {
                                duration: 0.5,
                                times: [0, 0.6, 1],
                                ease: "easeInOut"
                            }
                        }}
                        className="fixed bottom-6 right-6 bg-white dark:bg-zinc-900 shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-[9999] flex flex-col"
                        style={{ borderRadius: 20 }}
                    >
                        {/* Header */}
                        <div
                            className="h-14 bg-gradient-to-r from-[#008080] to-teal-600 flex items-center justify-between px-4 cursor-move flex-shrink-0"
                            onClick={toggleMinimize}
                        >
                            <div className="flex items-center gap-2 text-white">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <MessageSquare size={16} />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">Connekt Chat</span>
                                    {totalUnread > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                                            {totalUnread} new
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-white/80">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {!isMinimized && (
                            <div className="flex-1 flex overflow-hidden min-h-0">
                                <AnimatePresence mode="wait">
                                    {viewMode === 'sidebar' && (
                                        <motion.div
                                            key="sidebar"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="w-full h-full"
                                        >
                                            <ChatSidebar
                                                onSelectConversation={setSelectedConversationId}
                                                onTotalUnreadChange={setTotalUnread}
                                            />
                                        </motion.div>
                                    )}

                                    {viewMode === 'chat' && selectedConversation && (
                                        <motion.div
                                            key="chat"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="w-full h-full"
                                        >
                                            <WidgetActiveChat
                                                conversation={selectedConversation}
                                                onBack={handleBack}
                                                onViewProfile={handleViewProfile}
                                            />
                                        </motion.div>
                                    )}

                                    {viewMode === 'profile' && profileUserId && (
                                        <motion.div
                                            key="profile"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="w-full h-full"
                                        >
                                            <WidgetUserProfile
                                                userId={profileUserId}
                                                onBack={handleProfileBack}
                                                onStartChat={handleStartChatFromProfile}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
