'use client';

import { useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Users, MessageSquare, Plus, Search, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

import { CreateChatModal } from '@/components/chat/CreateChatModal';

export function AgencyTeamsView() {
    const [activeTab, setActiveTab] = useState<'members' | 'groups'>('groups');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

    // Mock data for members - in real app fetch from AgencyService
    const members = [
        { id: '1', name: 'Sarah Connor', role: 'Project Manager', status: 'online', avatar: 'S' },
        { id: '2', name: 'John Doe', role: 'Developer', status: 'offline', avatar: 'J' },
        { id: '3', name: 'Jane Smith', role: 'Designer', status: 'busy', avatar: 'J' },
    ];

    return (
        <div className="h-full flex flex-col md:flex-row rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            {/* Left Panel - List */}
            <div className={`w-full md:w-80 border-r border-gray-200 dark:border-zinc-800 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header & Tabs */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Teams</h2>
                    <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'groups'
                                ? 'bg-white dark:bg-zinc-700 shadow-sm text-[#008080]'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Groups
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'members'
                                ? 'bg-white dark:bg-zinc-700 shadow-sm text-[#008080]'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Members
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'groups' ? (
                        <ChatSidebar
                            onSelectConversation={setSelectedConversationId}
                            selectedId={selectedConversationId || undefined}
                        />
                    ) : (
                        <div className="p-2 space-y-2">
                            <div className="px-2 mb-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-lg text-sm focus:ring-1 focus:ring-[#008080]"
                                    />
                                </div>
                            </div>
                            {members.map(member => (
                                <div key={member.id} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl cursor-pointer transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                        {member.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{member.name}</h4>
                                        <p className="text-xs text-gray-500">{member.role}</p>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-[#008080] hover:bg-[#008080]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                        <MessageSquare size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {activeTab === 'groups' && (
                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                        <button
                            onClick={() => setIsCreateGroupOpen(true)}
                            className="w-full py-2 bg-[#008080] text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> New Group
                        </button>
                    </div>
                )}
            </div>

            <CreateChatModal
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                agencyId="current-agency-id" // In real app, get from params or context
            />

            {/* Right Panel - Chat Window or Placeholder */}
            <div className={`flex-1 ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversationId ? (
                    <ChatWindow
                        conversationId={selectedConversationId}
                        onBack={() => setSelectedConversationId(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900/50 text-gray-400 p-8 text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <Users size={48} className="opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">ConnektTeams</h3>
                        <p className="text-sm max-w-xs mx-auto">
                            Select a group to start chatting or manage your team members from the sidebar.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
