'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, Mic, Video, X, File as FileIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
    onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'audio' | 'file', attachments?: File[]) => Promise<void>;
    disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'audio' | 'file' | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if ((!message.trim() && attachments.length === 0) || isSending) return;

        setIsSending(true);
        try {
            let type: 'text' | 'image' | 'video' | 'audio' | 'file' = 'text';
            if (attachments.length > 0 && attachmentType) {
                type = attachmentType;
            }

            await onSendMessage(message, type, attachments);
            setMessage('');
            setAttachments([]);
            setAttachmentType(null);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setAttachments(files);

            // Determine type based on first file
            const mime = files[0].type;
            if (mime.startsWith('image/')) setAttachmentType('image');
            else if (mime.startsWith('video/')) setAttachmentType('video');
            else if (mime.startsWith('audio/')) setAttachmentType('audio');
            else setAttachmentType('file');
        }
    };

    const triggerFileSelect = (accept: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-2 mb-3 overflow-x-auto pb-2"
                    >
                        {attachments.map((file, index) => (
                            <div key={index} className="relative group flex-shrink-0">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-zinc-700 overflow-hidden">
                                    {attachmentType === 'image' ? (
                                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FileIcon className="text-gray-400" size={24} />
                                    )}
                                </div>
                                <button
                                    onClick={() => setAttachments([])}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center p-2">
                    <div className="flex gap-1 mr-2 text-gray-400">
                        <button onClick={() => triggerFileSelect('image/*')} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors" title="Image">
                            <ImageIcon size={20} />
                        </button>
                        <button onClick={() => triggerFileSelect('video/*')} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors" title="Video">
                            <Video size={20} />
                        </button>
                        <button onClick={() => triggerFileSelect('audio/*')} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors" title="Audio">
                            <Mic size={20} />
                        </button>
                        <button onClick={() => triggerFileSelect('*/*')} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors" title="File">
                            <Paperclip size={20} />
                        </button>
                    </div>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-sm"
                        rows={1}
                        disabled={disabled || isSending}
                    />

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        multiple
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!message.trim() && attachments.length === 0) || isSending || disabled}
                    className={`p-3 rounded-full flex items-center justify-center transition-all ${(!message.trim() && attachments.length === 0) || isSending
                            ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                            : 'bg-[#008080] text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20'
                        }`}
                >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </div>
        </div>
    );
}
