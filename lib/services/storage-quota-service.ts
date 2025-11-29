import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';

export interface StorageQuota {
    userId: string;
    mailAddress: string; // e.g., "username@connekt.com" or "username@agencyhandle.com"
    totalQuota: number; // in bytes (1GB = 1073741824 bytes)
    usedSpace: number; // in bytes
    filesCount: number;
    mailAttachmentsSize: number; // in bytes
    otherFilesSize: number; // in bytes
    lastUpdated: any;
}

export interface AgencyStorageQuota {
    agencyId: string;
    totalQuota: number; // 1GB shared among all agency mail addresses
    usedSpace: number;
    filesCount: number;
    mailAddresses: string[]; // All mail addresses using this quota
    lastUpdated: any;
}

const ONE_GB_IN_BYTES = 1073741824; // 1GB = 1,073,741,824 bytes

export const StorageQuotaService = {
    /**
     * Initialize storage quota for a new user (1GB)
     */
    async initializeUserStorage(userId: string, username: string): Promise<void> {
        const mailAddress = `${username}@connekt.com`;
        const storageRef = doc(db, 'storage_quotas', mailAddress);

        await setDoc(storageRef, {
            userId,
            mailAddress,
            totalQuota: ONE_GB_IN_BYTES,
            usedSpace: 0,
            filesCount: 0,
            mailAttachmentsSize: 0,
            otherFilesSize: 0,
            lastUpdated: serverTimestamp()
        });
    },

    /**
     * Initialize storage quota for a new agency (1GB shared)
     */
    async initializeAgencyStorage(agencyId: string, agencyHandle: string): Promise<void> {
        const storageRef = doc(db, 'agency_storage_quotas', agencyId);

        await setDoc(storageRef, {
            agencyId,
            totalQuota: ONE_GB_IN_BYTES,
            usedSpace: 0,
            filesCount: 0,
            mailAddresses: [],
            lastUpdated: serverTimestamp()
        });
    },

    /**
     * Get storage quota for a mail address
     */
    async getStorageQuota(mailAddress: string): Promise<StorageQuota | null> {
        const storageRef = doc(db, 'storage_quotas', mailAddress);
        const snap = await getDoc(storageRef);

        if (!snap.exists()) return null;
        return snap.data() as StorageQuota;
    },

    /**
     * Get agency storage quota
     */
    async getAgencyStorageQuota(agencyId: string): Promise<AgencyStorageQuota | null> {
        const storageRef = doc(db, 'agency_storage_quotas', agencyId);
        const snap = await getDoc(storageRef);

        if (!snap.exists()) return null;
        return snap.data() as AgencyStorageQuota;
    },

    /**
     * Update storage usage when file is uploaded
     */
    async updateStorageUsage(mailAddress: string, fileSize: number, isMailAttachment: boolean = false): Promise<void> {
        const storageRef = doc(db, 'storage_quotas', mailAddress);

        const updateData: any = {
            usedSpace: increment(fileSize),
            filesCount: increment(1),
            lastUpdated: serverTimestamp()
        };

        if (isMailAttachment) {
            updateData.mailAttachmentsSize = increment(fileSize);
        } else {
            updateData.otherFilesSize = increment(fileSize);
        }

        await updateDoc(storageRef, updateData);
    },

    /**
     * Update agency storage usage
     */
    async updateAgencyStorageUsage(agencyId: string, fileSize: number): Promise<void> {
        const storageRef = doc(db, 'agency_storage_quotas', agencyId);

        await updateDoc(storageRef, {
            usedSpace: increment(fileSize),
            filesCount: increment(1),
            lastUpdated: serverTimestamp()
        });
    },

    /**
     * Check if user has enough storage space
     */
    async checkStorageAvailable(mailAddress: string, requiredSpace: number): Promise<boolean> {
        const quota = await this.getStorageQuota(mailAddress);
        if (!quota) return false;

        const availableSpace = quota.totalQuota - quota.usedSpace;
        return availableSpace >= requiredSpace;
    },

    /**
     * Check if agency has enough storage space
     */
    async checkAgencyStorageAvailable(agencyId: string, requiredSpace: number): Promise<boolean> {
        const quota = await this.getAgencyStorageQuota(agencyId);
        if (!quota) return false;

        const availableSpace = quota.totalQuota - quota.usedSpace;
        return availableSpace >= requiredSpace;
    },

    /**
     * Format bytes to readable format
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Convert bytes to GB
     */
    bytesToGB(bytes: number): number {
        return bytes / ONE_GB_IN_BYTES;
    },

    /**
     * Convert GB to bytes
     */
    gbToBytes(gb: number): number {
        return gb * ONE_GB_IN_BYTES;
    },

    /**
     * Add mail address to agency storage tracking
     */
    async addMailAddressToAgency(agencyId: string, mailAddress: string): Promise<void> {
        const storageRef = doc(db, 'agency_storage_quotas', agencyId);
        const snap = await getDoc(storageRef);

        if (snap.exists()) {
            const currentAddresses = snap.data().mailAddresses || [];
            if (!currentAddresses.includes(mailAddress)) {
                await updateDoc(storageRef, {
                    mailAddresses: [...currentAddresses, mailAddress],
                    lastUpdated: serverTimestamp()
                });
            }
        }
    },

    /**
     * Get all user's mail addresses with storage info
     */
    async getUserMailAddresses(userId: string, username: string, agencyIds: string[] = []): Promise<{
        mailAddress: string;
        type: 'personal' | 'agency';
        storageUsed: number;
        storageTotal: number;
        agencyId?: string;
    }[]> {
        const addresses = [];

        // Personal mail
        const personalMail = `${username}@connekt.com`;
        const personalQuota = await this.getStorageQuota(personalMail);

        if (personalQuota) {
            addresses.push({
                mailAddress: personalMail,
                type: 'personal' as const,
                storageUsed: personalQuota.usedSpace,
                storageTotal: personalQuota.totalQuota
            });
        }

        // Agency mails
        for (const agencyId of agencyIds) {
            const agencyQuota = await this.getAgencyStorageQuota(agencyId);
            if (agencyQuota) {
                // Get agency handle to construct mail address
                const agencyDoc = await getDoc(doc(db, 'agencies', agencyId));
                if (agencyDoc.exists()) {
                    const agencyHandle = agencyDoc.data().username;
                    const agencyMail = `${username}@${agencyHandle}.com`;

                    addresses.push({
                        mailAddress: agencyMail,
                        type: 'agency' as const,
                        storageUsed: agencyQuota.usedSpace,
                        storageTotal: agencyQuota.totalQuota,
                        agencyId
                    });
                }
            }
        }

        return addresses;
    }
};
