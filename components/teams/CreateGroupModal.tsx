'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, Camera, Search, Check, Users, ArrowLeft 
} from 'lucide-react';
import { getFirestoreInstance } from '@/lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-store';
import { useToast } from '@/components/toast/toast';
import { createGroupConversation } from '@/lib/realtime-service';
import { uploadImage } from '@/lib/storage-service';

// --- TYPES ---
interface UserResult {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (convId: string) => void;
}

export default function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  // Steps: 1 = Select Members, 2 = Group Info
  const [step, setStep] = useState(1);
  
  // Step 1 State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Step 2 State
  const [groupName, setGroupName] = useState('');
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SEARCH LOGIC (Debounced) ---
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const db = getFirestoreInstance();
        // Simple client-side filter for demo. 
        // In Prod: Use Algolia or precise Firestore queries
        const q = query(collection(db, 'users'), limit(50));
        const snap = await getDocs(q);
        
        const hits: UserResult[] = [];
        const lowerQ = searchQuery.toLowerCase();
        
        snap.forEach(doc => {
          const d = doc.data();
          if (doc.id !== user?.id) {
             // Exclude if already selected
             if (selectedUsers.some(sel => sel.uid === doc.id)) return;

             if (d.displayName?.toLowerCase().includes(lowerQ) || d.email?.toLowerCase().includes(lowerQ)) {
               hits.push({ 
                 uid: doc.id, 
                 displayName: d.displayName || 'Unknown', 
                 photoURL: d.photoURL || d.profileImage, 
                 email: d.email 
               });
             }
          }
        });
        setSearchResults(hits);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery, user?.id, selectedUsers]);

  // --- HANDLERS ---

  const toggleUser = (u: UserResult) => {
    if (selectedUsers.some(s => s.uid === u.uid)) {
      setSelectedUsers(prev => prev.filter(s => s.uid !== u.uid));
    } else {
      setSelectedUsers(prev => [...prev, u]);
      setSearchQuery(''); // Clear search to type next name
      setSearchResults([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setGroupImageFile(file);
      setGroupImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !user) return;
    
    setIsCreating(true);
    try {
      let photoURL = '';
      if (groupImageFile) {
        photoURL = await uploadImage(groupImageFile, `groups/icons`);
      }

      // Prepare Maps
      const userIds = selectedUsers.map(u => u.uid);
      
      const userNames: {[id:string]: string} = { [user.id]: user.displayName || 'Admin' };
      const userPhotos: {[id:string]: string} = { [user.id]: user.photoURL || '' };

      selectedUsers.forEach(u => {
        userNames[u.uid] = u.displayName;
        userPhotos[u.uid] = u.photoURL || '';
      });

      const convId = await createGroupConversation(
        user.id,
        userIds,
        userNames,
        userPhotos,
        groupName,
        photoURL
      );

      toast.success('Success', `Group "${groupName}" created!`);
      onGroupCreated(convId);
      onClose();

    } catch (error) {
      console.error(error);
      toast.error('Error', 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  // --- RENDER ---

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md h-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="font-bold text-lg">
              {step === 1 ? 'Add Participants' : 'New Group'}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Area with Slide Animation */}
        <div className="flex-1 relative overflow-hidden bg-[#f0f2f5]">
          <AnimatePresence initial={false} mode="popLayout" custom={step}>
            
            {/* STEP 1: SELECT USERS */}
            {step === 1 && (
              <motion.div 
                key="step1"
                className="absolute inset-0 flex flex-col"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                {/* Search Input */}
                <div className="p-4 bg-white border-b border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedUsers.map(u => (
                      <span key={u.uid} className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in">
                        {u.displayName}
                        <button onClick={() => toggleUser(u)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Type contact name..."
                      className="w-full pl-3 pr-10 py-2 border-b border-gray-200 focus:border-emerald-500 outline-none bg-transparent transition-colors"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {isSearching && <div className="absolute right-0 top-2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {searchResults.map(u => (
                    <div 
                      key={u.uid} 
                      onClick={() => toggleUser(u)}
                      className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <img src={u.photoURL || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" />
                        {selectedUsers.some(s => s.uid === u.uid) && (
                          <div className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 border-b border-gray-100 pb-3">
                        <h4 className="font-bold text-gray-800">{u.displayName}</h4>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <div className="text-center py-8 text-gray-400">No contacts found</div>
                  )}
                </div>
                
                {/* FAB Next */}
                {selectedUsers.length > 0 && (
                  <div className="absolute bottom-6 right-6">
                    <button 
                      onClick={() => setStep(2)}
                      className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center"
                    >
                      <ArrowRight size={24} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: GROUP INFO */}
            {step === 2 && (
              <motion.div 
                key="step2"
                className="absolute inset-0 flex flex-col bg-white"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                <div className="flex-1 flex flex-col items-center p-8 pt-12">
                  
                  {/* Image Upload */}
                  <div className="relative group mb-8">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-full bg-gray-200 cursor-pointer flex items-center justify-center overflow-hidden border-4 border-gray-100 shadow-inner group-hover:border-emerald-200 transition-colors"
                    >
                      {groupImagePreview ? (
                        <img src={groupImagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={40} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full shadow-md pointer-events-none">
                      <Camera size={16} />
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </div>

                  {/* Name Input */}
                  <div className="w-full max-w-xs space-y-2">
                    <input 
                      type="text" 
                      placeholder="Group Subject (Required)"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      className="w-full py-3 border-b-2 border-gray-200 focus:border-emerald-500 outline-none text-lg text-center bg-transparent transition-colors placeholder:text-gray-400"
                      maxLength={25}
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-2">
                      <span>Provide a group subject</span>
                      <span>{groupName.length}/25</span>
                    </div>
                  </div>

                  {/* Participants Summary */}
                  <div className="mt-12 w-full">
                    <h5 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                      Participants: {selectedUsers.length}
                    </h5>
                    <div className="grid grid-cols-4 gap-4">
                      {selectedUsers.map(u => (
                         <div key={u.uid} className="flex flex-col items-center gap-1">
                           <img src={u.photoURL || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                           <span className="text-[10px] text-gray-600 truncate w-full text-center">{u.displayName.split(' ')[0]}</span>
                         </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Create Button */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim() || isCreating}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    {isCreating ? (
                      <>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Creating...
                      </>
                    ) : (
                      <>
                        <Check size={20} /> Create Group
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}