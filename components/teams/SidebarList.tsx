'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Edit, MoreVertical, Camera, Video, Mic, Image as ImageIcon,
  Check, CheckCheck, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  listenToConversations,
  EnrichedConversation
} from '@/lib/services/realtime-service';
import StatusBar from './StatusBar';

// --- TYPES ---
interface SidebarListProps {
  activeConvId: string | null;
  onSelectConversation: (convId: string) => void;
  onNewChat: () => void;
}

// --- UTILS ---
const formatRelativeTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function SidebarList({
  activeConvId,
  onSelectConversation,
  onNewChat
}: SidebarListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Listen to Conversations
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenToConversations(user.uid, (data) => {
      setConversations(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Get display info for conversation
  const getConversationDisplayInfo = (conv: EnrichedConversation) => {
    if (!user?.uid) return { name: 'Unknown', photo: '/default-avatar.png', email: '' };

    // For direct chats, get the other participant
    if (conv.type === 'direct') {
      const otherId = conv.members.find(id => id !== user.uid) || '';
      // Prefer enriched data, fallback to memberDetails
      const enriched = conv.enrichedParticipants?.[otherId];
      const member = conv.memberDetails?.[otherId];

      return {
        name: enriched?.displayName || member?.username || 'User',
        photo: enriched?.photoURL || member?.avatarUrl || '/default-avatar.png',
        email: enriched?.connectMail || '',
        jobTitle: enriched?.jobTitle,
        workspaceRole: enriched?.workspaceRole,
        workspaceType: enriched?.workspaceType
      };
    }

    // For groups, use group title
    return {
      name: conv.title || 'Group Chat',
      photo: conv.photoUrl || '/default-group.png',
      email: ''
    };
  };

  // 3. Filter Logic
  const filteredConversations = conversations.filter(conv => {
    const { name } = getConversationDisplayInfo(conv);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 4. Render Helper for Last Message
  const renderLastMessage = (conv: EnrichedConversation) => {
    if (!user?.uid || !conv.lastMessage) return null;

    const isMe = conv.lastMessage.senderId === user.uid;
    const type = conv.lastMessage.type || 'text';
    const text = conv.lastMessage.content;

    return (
      <div className="flex items-center gap-1 text-gray-500 text-sm truncate">
        {isMe && (
          <span className="flex items-center text-gray-400 mr-1">
            <CheckCheck size={14} />
          </span>
        )}

        {type === 'image' && <ImageIcon size={14} className="min-w-[14px]" />}
        {type === 'video' && <Video size={14} className="min-w-[14px]" />}
        {type === 'audio' && <Mic size={14} className="min-w-[14px]" />}

        <span className="truncate">
          {type === 'text' ? text : type === 'image' ? 'Photo' : type === 'video' ? 'Video' : 'Audio'}
        </span>
      </div>
    );
  };

  // 5. Get unread count for user
  const getUnreadCount = (conv: EnrichedConversation): number => {
    if (!user?.uid) return 0;
    const memberDetail = conv.memberDetails?.[user.uid];
    const lastReadAt = memberDetail?.lastReadAt?.toMillis?.() || 0;
    const lastMessageTime = conv.lastMessage?.sentAt?.toMillis?.() || 0;

    if (lastMessageTime > lastReadAt && conv.lastMessage?.senderId !== user.uid) {
      return 1; // Simplified - just show indicator
    }
    return 0;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-full md:w-[400px] lg:w-[450px] relative z-20">

      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chats</h1>
        <div className="flex gap-2">
          <button
            onClick={onNewChat}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="New Chat"
          >
            <Edit size={20} />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent border focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Status Bar Section */}
        <div className="pt-4 pb-2 border-b border-gray-50 mb-2">
          <StatusBar />
        </div>

        {/* List */}
        <div className="flex flex-col">
          {isLoading ? (
            // Skeleton Loader
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium">No chats found.</p>
              <button onClick={onNewChat} className="mt-2 text-emerald-600 text-sm font-bold hover:underline">Start a conversation</button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const { name, photo, email, jobTitle, workspaceRole, workspaceType } = getConversationDisplayInfo(conv);
              const unread = getUnreadCount(conv);
              const isActive = activeConvId === conv.id;

              return (
                <motion.div
                  key={conv.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`
                    relative flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-colors border border-transparent
                    ${isActive ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'hover:bg-gray-50'}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img src={photo} alt={name} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="min-w-0">
                        <h3 className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {name}
                        </h3>
                        {/* Show job title or role badge */}
                        {(jobTitle || workspaceRole) && (
                          <p className="text-xs text-gray-400 truncate">
                            {jobTitle || ''}
                            {workspaceRole && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${workspaceRole === 'owner' ? 'bg-amber-100 text-amber-700' :
                                workspaceRole === 'admin' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                {workspaceRole}
                              </span>
                            )}
                            {workspaceType && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${workspaceType === 'freelancer' ? 'bg-purple-100 text-purple-700' :
                                'bg-teal-100 text-teal-700'
                                }`}>
                                {workspaceType}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <span className={`text-[11px] whitespace-nowrap ${unread > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                        {formatRelativeTime(conv.lastMessage?.sentAt)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="truncate">
                        {renderLastMessage(conv)}
                      </div>

                      {unread > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="min-w-[20px] h-5 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 shadow-sm shrink-0"
                        >
                          {unread}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={onNewChat}
        className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center z-50 active:scale-95 transition-transform"
      >
        <Plus size={28} />
      </button>

    </div>
  );
}