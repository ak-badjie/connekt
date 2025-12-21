'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { useToast } from '@/components/toast/toast';
import { listenToConversations, Conversation } from '@/lib/realtime-service';

export default function GlobalNotificationListener() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  // Store the last known timestamp of messages to detect NEW ones
  const lastTimestampsRef = useRef<{ [convId: string]: number }>({});
  const isFirstLoadRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload notification sound
    audioRef.current = new Audio('/sounds/notification_pop.mp3'); // Ensure this file exists in public/sounds/
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Listen to ALL user conversations
    const unsubscribe = listenToConversations(user.id, (conversations) => {
      
      conversations.forEach((conv) => {
        const convId = conv.id;
        // Handle Firestore Timestamp or JS Date
        const msgTime = conv.lastMessageTime?.toMillis 
          ? conv.lastMessageTime.toMillis() 
          : new Date(conv.lastMessageTime).getTime();

        const lastKnownTime = lastTimestampsRef.current[convId] || 0;

        // CHECK: Is this a NEW message?
        if (msgTime > lastKnownTime) {
          
          // UPDATE REF
          lastTimestampsRef.current[convId] = msgTime;

          // CONDITIONS TO SHOW NOTIFICATION:
          // 1. Not the first load (prevent blasting toasts on refresh)
          // 2. Sender is NOT me
          // 3. I am NOT currently on this specific chat page
          
          const isMe = conv.lastMessageSenderId === user.id;
          const isOnChatPage = pathname === '/messaging' && window.location.search.includes(convId);

          if (!isFirstLoadRef.current && !isMe && !isOnChatPage) {
            
            // Get sender name
            const otherId = conv.participants.find(p => p !== user.id) || '';
            const senderName = conv.participantNames[otherId] || 'Someone';
            const photo = conv.participantPhotos?.[otherId];

            // 1. Play Sound
            audioRef.current?.play().catch(e => console.log('Audio play failed', e));

            // 2. Show Toast
            toast.custom({
              type: 'info',
              title: senderName,
              message: conv.lastMessageType === 'text' 
                ? conv.lastMessage 
                : `Sent a ${conv.lastMessageType}`,
              duration: 4000,
              action: {
                label: 'Reply',
                onClick: () => router.push(`/messaging?id=${convId}`)
              }
            });
          }
        }
      });

      // After first run, disable the "first load" flag
      isFirstLoadRef.current = false;
    });

    return () => unsubscribe();
  }, [user?.id, pathname, router, toast]);

  return null; // This component renders nothing visually
}