'use client';

import { useState } from 'react';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';

export function GlobalChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    const toggleOpen = () => setIsOpen(!isOpen);
    const toggleMinimize = () => setIsMinimized(!isMinimized);

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={toggleOpen}
                className={`fixed bottom-6 right-6 w-14 h-14 bg-[#008080] text-white rounded-full shadow-2xl flex items-center justify-center z-[9999] hover:bg-teal-600 transition-colors ${isOpen ? 'hidden' : 'flex'}`}
            >
                <MessageSquare size={24} />
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
                            height: isMinimized ? 60 : 600,
                            width: 380,
                            borderRadius: "16px"
                        }}
                        exit={{
                            height: [null, 60, 60],
                            width: [380, 380, 60],
                            opacity: [1, 1, 0],
                            borderRadius: ["16px", "16px", "50%"],
                            transition: {
                                duration: 0.5,
                                times: [0, 0.6, 1],
                                ease: "easeInOut"
                            }
                        }}
                        className="fixed bottom-6 right-6 bg-white dark:bg-zinc-900 shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-[9999] flex flex-col"
                    >
                        {/* Header */}
                        <div
                            className="h-14 bg-[#008080] flex items-center justify-between px-4 cursor-move"
                            onClick={toggleMinimize}
                        >
                            <div className="flex items-center gap-2 text-white">
                                <MessageSquare size={20} />
                                <span className="font-bold">ConnektChat</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80">
                                <button onClick={(e) => { e.stopPropagation(); toggleMinimize(); }} className="p-1 hover:bg-white/10 rounded">
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 hover:bg-white/10 rounded">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {!isMinimized && (
                            <div className="flex-1 flex overflow-hidden">
                                {selectedConversationId ? (
                                    <ChatWindow
                                        conversationId={selectedConversationId}
                                        onBack={() => setSelectedConversationId(null)}
                                    />
                                ) : (
                                    <ChatSidebar
                                        onSelectConversation={setSelectedConversationId}
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
