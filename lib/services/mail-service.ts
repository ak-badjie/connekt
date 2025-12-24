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
import { NotificationService } from './notification-service';
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
import { FirestoreService } from './firestore-service';

export interface MailMessage {
    id?: string;
    ownerId: string;
    type: 'received' | 'sent';
    senderId: string;
    senderUsername: string;
    senderName: string;
    senderAddress?: string;
    senderPhotoURL?: string;
    recipientUsername: string;
    recipientAddress?: string;
    recipientName?: string;
    recipientPhotoURL?: string;
    subject: string;
    body: string;
    isRead: boolean;
    folder: 'inbox' | 'sent' | 'trash' | 'drafts';
    category?: MailCategory;
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
            address: `${username}@connekt.com`,
            type: 'personal',
            displayName: displayName,
            username: username,
            domain: 'connekt.com'
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
        contractId?: string,
        senderUserId?: string // ensure sent mail ownerId is the actual uid
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

        // Get recipient profile for name/photo
        const recipientProfileRef = doc(db, 'users', recipientId);
        const recipientProfileSnap = await getDoc(recipientProfileRef);
        const recipientProfile = recipientProfileSnap.data();
        const recipientName = recipientProfile?.displayName || recipientUsername;
        const recipientPhotoURL = recipientProfile?.photoURL;

        // Get sender profile for name/photo
        let senderDisplayName = fromAddress.displayName;
        let senderPhotoURL: string | undefined;
        if (senderUserId) {
            const senderProfile = await FirestoreService.getUserProfile(senderUserId);
            if (senderProfile) {
                senderDisplayName = senderProfile.displayName || senderDisplayName;
                senderPhotoURL = senderProfile.photoURL;
            }
        }

        // Determine recipient mail type
        const isAgencyMail = recipientDomain && recipientDomain !== 'connekt.com';

        // Get recipient agency ID if this is an agency mail
        let recipientAgencyId: string | undefined;
        if (isAgencyMail) {
            try {
                // Extract agency username from domain (e.g., "agencyname.com" -> "agencyname")
                const agencyUsername = recipientDomain.replace('.com', '');
                const agency = await AgencyService.getAgencyByUsername(agencyUsername);
                if (agency) {
                    recipientAgencyId = agency.id;
                }
            } catch (error) {
                console.error('Error fetching recipient agency:', error);
            }
        }

        // Create inbox copy for recipient
        const inboxMail: Partial<ExtendedMailMessage> = {
            ownerId: recipientId,
            type: 'received',
            senderId: senderUserId || fromAddress.username,
            senderUsername: fromAddress.username,
            senderName: senderDisplayName,
            senderAddress: fromAddress.address,
            ...(senderPhotoURL && { senderPhotoURL }),
            senderMailType: fromAddress.type,
            ...(fromAddress.agencyId && { senderAgencyId: fromAddress.agencyId }),
            recipientId: recipientId,
            recipientUsername: recipientUsername,
            recipientAddress: toAddress,
            recipientName,
            ...(recipientPhotoURL && { recipientPhotoURL }),
            recipientMailType: isAgencyMail ? 'agency' : 'personal',
            ...(recipientAgencyId && { recipientAgencyId }), // Only include if we have a valid agency ID
            subject,
            body,
            ...(attachments && attachments.length > 0 && { attachments }),
            isRead: false,
            folder: 'inbox',
            ...(category && { category }),
            ...(signatureId && { signatureId }),
            ...(contractId && { contractId }),
            createdAt: serverTimestamp()
        };

        const inboxDocRef = await addDoc(collection(db, 'mails'), inboxMail);

        // Create notification for recipient
        try {
            await NotificationService.createNotification(
                recipientId,
                'mail',
                'New Email Received',
                `You have a new email from ${fromAddress.displayName}`,
                'medium',
                {
                    type: 'mail',
                    mailId: inboxDocRef.id,
                    senderId: senderUserId || fromAddress.username,
                    senderUsername: fromAddress.username,
                    senderName: senderDisplayName,
                    subject
                },
                '/mail',
                'View Email'
            );
        } catch (error) {
            console.error('Error creating mail notification:', error);
        }

        // Create sent copy for sender
        const sentMail: Partial<ExtendedMailMessage> = {
            ...inboxMail,
            ownerId: senderUserId || fromAddress.username,
            type: 'sent',
            isRead: true,
            folder: 'sent'
        };

        await addDoc(collection(db, 'mails'), sentMail);
    },

    /**
     * Original sendMail for backward compatibility
     */
    async sendMail(
        senderId: string,
        senderUsername: string,
        senderName: string,
        recipientUsername: string,
        subject: string,
        body: string,
        contractId?: string,
        category?: MailCategory
    ) {
        const fromAddress: MailAddress = {
            address: `${senderUsername}@connekt.com`,
            type: 'personal',
            displayName: senderName,
            username: senderUsername,
            domain: 'connekt.com'
        };

        await this.sendMailFromAddress(
            fromAddress,
            `${recipientUsername}@connekt.com`,
            subject,
            body,
            undefined, // attachments
            category, // category
            undefined, // signatureId
            contractId, // Pass contractId through
            senderId
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
