'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    MessageCircle,
    Send,
    Paperclip,
    Search,
    Phone,
    Video,
    MoreVertical,
    ArrowRight,
    Shield,
    Zap,
    Bell,
} from 'lucide-react';

// Sample conversations
const CONVERSATIONS = [
    { name: 'Sarah Chen', message: 'The designs look great! Can we...', time: '2m', unread: 3, online: true },
    { name: 'James Wilson', message: 'I\'ve updated the API docs', time: '15m', unread: 0, online: true },
    { name: 'Amara Diallo', message: 'Meeting confirmed for tomorrow', time: '1h', unread: 1, online: false },
    { name: 'David Kim', message: 'Invoice sent ✓', time: '3h', unread: 0, online: false },
];

const CHAT_MESSAGES = [
    { sender: 'them', message: 'Hey! I just reviewed the latest mockups', time: '10:32 AM' },
    { sender: 'me', message: 'Great! What do you think about the new dashboard?', time: '10:33 AM' },
    { sender: 'them', message: 'Love it! The analytics section is exactly what we needed. Can we add a dark mode toggle?', time: '10:35 AM' },
    { sender: 'me', message: 'Absolutely! I\'ll include that in the next iteration 👍', time: '10:36 AM' },
];

export default function ConnektMessagesSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Text Content */}
                    <div className="flex flex-col justify-center order-2 lg:order-1">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6">
                            <MessageCircle className="w-4 h-4" />
                            MESSAGING
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                            Connekt
                            <br />
                            <span className="text-[#008080]">Messages</span>
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md">
                            Seamless communication built right into your workflow. Chat with clients, share files, and keep all conversations organized in one secure place.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-4 mb-8">
                            {[
                                { icon: Shield, label: 'End-to-End Encrypted', desc: 'Your conversations are always private' },
                                { icon: Zap, label: 'Real-time Messaging', desc: 'Instant delivery with read receipts' },
                                { icon: Bell, label: 'Smart Notifications', desc: 'Never miss important messages' },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-[#008080]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold">{item.label}</p>
                                            <p className="text-gray-500 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Button */}
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                            Start Chatting
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* RIGHT SIDE: Messages UI Mockup */}
                    <div className="relative order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-sm text-gray-500 font-mono">messages.connekt.com</span>
                                <div className="w-20" />
                            </div>

                            <div className="flex h-[400px]">
                                {/* Sidebar - Conversations List */}
                                <div className="w-56 border-r border-gray-200 bg-gray-50">
                                    <div className="p-3 border-b border-gray-200">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search messages"
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto">
                                        {CONVERSATIONS.map((conv, i) => (
                                            <div
                                                key={conv.name}
                                                className={`px-3 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 ${i === 0 ? 'bg-[#008080]/10 border-l-2 border-[#008080]' : ''}`}
                                            >
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                                                        {conv.name[0]}
                                                    </div>
                                                    {conv.online && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-gray-900 text-sm truncate">{conv.name}</span>
                                                        <span className="text-xs text-gray-400">{conv.time}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500 truncate">{conv.message}</span>
                                                        {conv.unread > 0 && (
                                                            <span className="bg-[#008080] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{conv.unread}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 flex flex-col bg-white">
                                    {/* Chat Header */}
                                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#008080] to-teal-400 flex items-center justify-center text-white text-sm font-bold">S</div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">Sarah Chen</p>
                                                <p className="text-xs text-green-500">Online</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone className="w-4 h-4 text-gray-500" /></button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Video className="w-4 h-4 text-gray-500" /></button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-4 h-4 text-gray-500" /></button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                        {CHAT_MESSAGES.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.sender === 'me'
                                                        ? 'bg-[#008080] text-white rounded-br-md'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                                    }`}>
                                                    <p>{msg.message}</p>
                                                    <p className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-teal-200' : 'text-gray-400'}`}>{msg.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Input */}
                                    <div className="px-4 py-3 border-t border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Paperclip className="w-5 h-5 text-gray-400" /></button>
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 placeholder-gray-400"
                                            />
                                            <button className="p-2 bg-[#008080] hover:bg-teal-600 rounded-full"><Send className="w-5 h-5 text-white" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
