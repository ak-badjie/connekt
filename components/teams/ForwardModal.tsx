'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, X, CheckCircle, Circle, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { 
  getConversations, 
  sendMessage, 
  Conversation, 
  Message 
} from '@/lib/realtime-service';
import { useToast } from '@/components/toast/toast';

interface ForwardModalProps {
  message: Message; // The message being forwarded
  currentConvId: string; // To exclude current chat
  onClose: () => void;
}

export default function ForwardModal({ message, currentConvId, onClose }: ForwardModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 1. Fetch Conversations
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      const convs = await getConversations(user.id);
      // Filter out the current conversation
      setConversations(convs.filter(c => c.id !== currentConvId));
    };
    fetchChats();
  }, [user, currentConvId]);

  // 2. Toggle Selection
  const toggleSelection = (convId: string) => {
    const next = new Set(selectedIds);
    if (next.has(convId)) next.delete(convId);
    else next.add(convId);
    setSelectedIds(next);
  };

  // 3. Handle Forwarding
  const handleForward = async () => {
    if (!user || selectedIds.size === 0) return;
    
    setIsSending(true);
    try {
      const promises = Array.from(selectedIds).map(async (targetConvId) => {
        const targetConv = conversations.find(c => c.id === targetConvId);
        if (!targetConv) return;

        // Find receiver IDs for unread counts
        const receiverIds = targetConv.participants.filter(p => p !== user.id);

        // Send the message
        // Note: We flag it as 'forwarded' in text or metadata if we had that field.
        // For now, we just send the content.
        await sendMessage(
          targetConvId,
          user.id,
          user.displayName || 'User',
          receiverIds,
          message.text, // For media, this might be caption
          message.type,
          message.mediaUrl,
          message.mediaDuration
        );
      });

      await Promise.all(promises);
      
      toast.success('Forwarded', `Message sent to ${selectedIds.size} chat(s).`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error', 'Failed to forward message');
    } finally {
      setIsSending(false);
    }
  };

  // 4. Filter for Search
  const filteredConvs = conversations.filter(c => {
    const otherId = c.participants.find(p => p !== user?.id) || '';
    const name = c.participantNames[otherId] || 'Unknown';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-md max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Forward Message</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-3 bg-gray-100 text-sm text-gray-600 border-b border-white mx-4 mt-4 rounded-lg flex gap-3 items-center">
          <div className="w-1 bg-emerald-500 h-8 rounded-full" />
          <div className="flex-1 truncate">
             {message.type === 'text' ? message.text : `📷 ${message.type} attachment`}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredConvs.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No chats found.</p>
          ) : (
            filteredConvs.map(conv => {
              if (!user) return null;
              const otherId = conv.participants.find(p => p !== user.id) || '';
              const name = conv.participantNames[otherId] || 'User';
              const photo = conv.participantPhotos?.[otherId];
              const isSelected = selectedIds.has(conv.id);

              return (
                <div 
                  key={conv.id} 
                  onClick={() => toggleSelection(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <img src={photo || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full border-2 border-white"
                      >
                        <CheckCircle size={14} />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className={`text-sm ${isSelected ? 'font-bold text-emerald-900' : 'font-medium text-gray-700'}`}>
                      {name}
                    </h4>
                  </div>

                  <div className={`text-gray-300 ${isSelected ? 'text-emerald-500' : ''}`}>
                    {isSelected ? <CheckCircle size={20} fill="currentColor" className="text-emerald-500 bg-white rounded-full" /> : <Circle size={20} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="p-4 border-t border-gray-100 bg-white flex justify-between items-center"
            >
              <span className="text-sm font-semibold text-gray-600">
                {selectedIds.size} selected
              </span>
              <button 
                onClick={handleForward}
                disabled={isSending}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSending ? 'Sending...' : (
                  <>
                    Send <Send size={16} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}