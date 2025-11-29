import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { AgencyService } from './agency-service';
import type {
    ExtendedMailMessage,
    MailAddress,
    MailCategory,
    MailDraft,
    MailFilters,
    MailStats,
    Contract,
    ContractType,
    ContractTerms
} from '@/lib/types/mail.types';

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

export interface Signature {
    id?: string;
    userId: string;
    name: string;
    content: string;
    isDefault: boolean;
    createdAt?: any;
}

export const MailService = {
    /**
     * Get all mail addresses available to a user (personal + agency emails)
     */
    async getUserMailAddresses(userId: string, username: string, displayName: string): Promise<MailAddress[]> {
        const addresses: MailAddress[] = [];

        // Personal address
        addresses.push({
            address: `${username}@connektmail.com`,
            type: 'personal',
            displayName: displayName,
            username: username,
            domain: 'connektmail.com'
        });

        // Get agency addresses
        try {
            const ownedAgencies = await AgencyService.getUserAgencies(userId);
            const memberAgencies = await AgencyService.getAgenciesUserBelongsTo(userId);
            const allAgencies = [...ownedAgencies, ...memberAgencies];

            for (const agency of allAgencies) {
                const agencyEmail = await AgencyService.getUserAgencyEmail(agency.id!, userId);
                if (agencyEmail) {
                    const [agencyUsername] = agencyEmail.split('@');
                    addresses.push({
                        address: agencyEmail,
                        type: 'agency',
                        displayName: displayName,
                        username: agencyUsername,
                        domain: `${agency.username}.com`,
                        agencyId: agency.id,
                        agencyName: agency.name
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching agency addresses:', error);
        }

        return addresses;
    },

    /**
     * Send mail from a specific address (personal or agency)
     */
    async sendMailFromAddress(
        fromAddress: MailAddress,
        toAddress: string,
        subject: string,
        body: string,
        attachments?: any[],
        category?: MailCategory,
        signatureId?: string,
        contractId?: string
    ): Promise<void> {
        // Parse recipient address
        const [recipientUsername, recipientDomain] = toAddress.split('@');

        // Verify recipient exists
        const recipientRef = doc(db, 'usernames', recipientUsername.toLowerCase());
        const recipientSnap = await getDoc(recipientRef);

        if (!recipientSnap.exists()) {
            throw new Error(`User @${recipientUsername} not found.`);
        }

        const recipientId = recipientSnap.data().uid;

        // Get recipient profile for name
        const recipientProfileRef = doc(db, 'users', recipientId);
        const recipientProfileSnap = await getDoc(recipientProfileRef);
        const recipientName = recipientProfileSnap.data()?.displayName || recipientUsername;

        // Determine recipient mail type
        const isAgencyMail = recipientDomain && recipientDomain !== 'connektmail.com';

        // Create inbox copy for recipient
        const inboxMail: Partial<ExtendedMailMessage> = {
            ownerId: recipientId,
            type: 'received',
            senderId: fromAddress.username,
            senderUsername: fromAddress.username,
            senderName: fromAddress.displayName,
            senderAddress: fromAddress.address,
            senderMailType: fromAddress.type,
            senderAgencyId: fromAddress.agencyId,
            recipientId: recipientId,
            recipientUsername: recipientUsername,
            recipientAddress: toAddress,
            recipientMailType: isAgencyMail ? 'agency' : 'personal',
            subject,
            body,
            attachments: attachments || [],
            isRead: false,
            folder: 'inbox',
            category,
            signatureId,
            contractId,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'mails'), inboxMail);

        // Create sent copy for sender
        const sentMail: Partial<ExtendedMailMessage> = {
            ...inboxMail,
            ownerId: fromAddress.username, // This should be userId but we don't have it
            type: 'sent',
            isRead: true,
            folder: 'sent'
        };

        await addDoc(collection(db, 'mails'), sentMail);
    },

    /**
     * Original sendMail for backward compatibility
     */
    async sendMail(senderId: string, senderUsername: string, senderName: string, recipientUsername: string, subject: string, body: string) {
        const fromAddress: MailAddress = {
            address: `${senderUsername}@connektmail.com`,
            type: 'personal',
            displayName: senderName,
            username: senderUsername,
            domain: 'connektmail.com'
        };

        await this.sendMailFromAddress(
            fromAddress,
            `${recipientUsername}@connektmail.com`,
            subject,
            body
        );
    },

    /**
     * Get inbox mails for a specific address
     */
    async getInbox(userId: string, mailAddress?: string): Promise<MailMessage[]> {
        const q = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'inbox'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailMessage));
    },

    /**
     * Get sent mails
     */
    async getSent(userId: string): Promise<MailMessage[]> {
        const q = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'sent'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailMessage));
    },

    /**
     * Get drafts
     */
    async getDrafts(userId: string, mailAddress?: string): Promise<MailDraft[]> {
        const q = query(
            collection(db, 'mail_drafts'),
            where('userId', '==', userId),
            orderBy('lastSavedAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailDraft));
    },

    /**
     * Save draft
     */
    async saveDraft(draft: Partial<MailDraft>): Promise<string> {
        const draftData = {
            ...draft,
            lastSavedAt: serverTimestamp()
        };

        if (draft.id) {
            // Update existing draft
            await updateDoc(doc(db, 'mail_drafts', draft.id), draftData);
            return draft.id;
        } else {
            // Create new draft
            const docRef = await addDoc(collection(db, 'mail_drafts'), draftData);
            return docRef.id;
        }
    },

    /**
     * Delete draft
     */
    async deleteDraft(draftId: string): Promise<void> {
        await deleteDoc(doc(db, 'mail_drafts', draftId));
    },

    /**
     * Get mails by category
     */
    async getMailsByCategory(userId: string, category: MailCategory): Promise<MailMessage[]> {
        const q = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MailMessage));
    },

    /**
     * Mark mail as read
     */
    async markAsRead(mailId: string): Promise<void> {
        await updateDoc(doc(db, 'mails', mailId), { isRead: true });
    },

    /**
     * Mark mail as unread
     */
    async markAsUnread(mailId: string): Promise<void> {
        await updateDoc(doc(db, 'mails', mailId), { isRead: false });
    },

    /**
     * Move mail to trash
     */
    async moveToTrash(mailId: string): Promise<void> {
        await updateDoc(doc(db, 'mails', mailId), { folder: 'trash' });
    },

    /**
     * Restore from trash
     */
    async restoreFromTrash(mailId: string, originalFolder: 'inbox' | 'sent'): Promise<void> {
        await updateDoc(doc(db, 'mails', mailId), { folder: originalFolder });
    },

    /**
     * Permanently delete mail
     */
    async permanentlyDelete(mailId: string): Promise<void> {
        await deleteDoc(doc(db, 'mails', mailId));
    },

    /**
     * Get mail statistics
     */
    async getMailStats(userId: string): Promise<MailStats> {
        const inboxQuery = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'inbox')
        );
        const inboxSnap = await getDocs(inboxQuery);
        const unread = inboxSnap.docs.filter(doc => !doc.data().isRead).length;

        const sentQuery = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'sent')
        );
        const sentSnap = await getDocs(sentQuery);

        const draftsQuery = query(
            collection(db, 'mail_drafts'),
            where('userId', '==', userId)
        );
        const draftsSnap = await getDocs(draftsQuery);

        const trashQuery = query(
            collection(db, 'mails'),
            where('ownerId', '==', userId),
            where('folder', '==', 'trash')
        );
        const trashSnap = await getDocs(trashQuery);

        return {
            totalInbox: inboxSnap.size,
            unreadInbox: unread,
            totalSent: sentSnap.size,
            totalDrafts: draftsSnap.size,
            totalTrash: trashSnap.size,
            storageUsedByAttachments: 0 // TODO: Calculate from attachments
        };
    }
};
