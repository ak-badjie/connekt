import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';

export interface MailMessage {
    id?: string;
    ownerId: string;
    type: 'received' | 'sent';
    senderId: string;
    senderUsername: string;
    senderName: string;
    recipientUsername: string;
    subject: string;
    body: string;
    isRead: boolean;
    folder: 'inbox' | 'sent' | 'trash';
    createdAt: any;
}

export const MailService = {
    async sendMail(senderId: string, senderUsername: string, senderName: string, recipientUsername: string, subject: string, body: string) {
        // 1. Verify Recipient Exists
        const recipientRef = doc(db, 'usernames', recipientUsername.toLowerCase());
        const recipientSnap = await getDoc(recipientRef);

        if (!recipientSnap.exists()) {
            throw new Error(`User @${recipientUsername} not found.`);
        }

        const recipientId = recipientSnap.data().uid;

        // 2. Create "Inbox" copy for Recipient
        await addDoc(collection(db, 'mails'), {
            ownerId: recipientId,
            type: 'received',
            senderId,
            senderUsername,
            senderName,
            recipientUsername,
            subject,
            body,
            isRead: false,
            folder: 'inbox',
            createdAt: serverTimestamp()
        });

        // 3. Create "Sent" copy for Sender
        await addDoc(collection(db, 'mails'), {
            ownerId: senderId,
            type: 'sent',
            senderId,
            senderUsername,
            senderName,
            recipientUsername,
            subject,
            body,
            isRead: true,
            folder: 'sent',
            createdAt: serverTimestamp()
        });
    },

    async getInbox(userId: string) {
        const q = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'inbox'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailMessage));
    },

    async getSent(userId: string) {
        const q = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'sent'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailMessage));
    },

    async markAsRead(mailId: string) {
        await updateDoc(doc(db, 'mails', mailId), { isRead: true });
    }
};
