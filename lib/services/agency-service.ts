import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

// Agency Types & Interfaces
export interface Agency {
    id?: string;
    name: string;
    username: string; // Agency handle/domain (e.g., "garden")
    domain: string; // Full domain (e.g., "garden.com")
    logoUrl?: string;
    ownerId: string; // User ID of agency owner
    members: AgencyMember[];
    createdAt?: Timestamp | any;
    updatedAt?: Timestamp | any;
}

export interface AgencyMember {
    userId: string;
    agencyEmail: string; // e.g., "abdul@garden.com"
    role: 'owner' | 'admin' | 'member';
    addedAt?: Timestamp | any;
}

export const AgencyService = {
    /**
     * Validate if agency username/handle is available
     */
    async validateAgencyDomain(username: string): Promise<boolean> {
        try {
            const normalizedUsername = username.toLowerCase().trim();

            // Check format
            const regex = /^[a-zA-Z0-9_-]+$/;
            if (!regex.test(normalizedUsername) || normalizedUsername.length < 3) {
                return false;
            }

            // Check if already exists
            const docRef = doc(db, 'agency_usernames', normalizedUsername);
            const docSnap = await getDoc(docRef);

            return !docSnap.exists();
        } catch (error) {
            console.error('Error validating agency domain:', error);
            return false;
        }
    },

    /**
     * Create a new agency
     */
    async createAgency(agencyData: {
        name: string;
        username: string;
        logoUrl?: string;
        ownerId: string;
        ownerAgencyEmail: string; // Owner's email in the agency domain
    }): Promise<Agency | null> {
        try {
            const normalizedUsername = agencyData.username.toLowerCase().trim();

            // Validate domain availability
            const isAvailable = await this.validateAgencyDomain(normalizedUsername);
            if (!isAvailable) {
                throw new Error('Agency username is not available');
            }

            // Create agency document
            const agencyRef = doc(collection(db, 'agencies'));
            const agencyId = agencyRef.id;

            const ownerMember: AgencyMember = {
                userId: agencyData.ownerId,
                agencyEmail: agencyData.ownerAgencyEmail,
                role: 'owner',
                addedAt: Timestamp.now()
            };

            const agency: Agency = {
                id: agencyId,
                name: agencyData.name,
                username: normalizedUsername,
                domain: `${normalizedUsername}.com`,
                logoUrl: agencyData.logoUrl || '',
                ownerId: agencyData.ownerId,
                members: [ownerMember],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Save agency
            await setDoc(agencyRef, agency);

            // Claim username
            await setDoc(doc(db, 'agency_usernames', normalizedUsername), {
                agencyId: agencyId,
                claimedAt: serverTimestamp()
            });

            // Update owner's user document with agency email
            const userRef = doc(db, 'users', agencyData.ownerId);
            await updateDoc(userRef, {
                agencyEmails: arrayUnion(agencyData.ownerAgencyEmail),
                updatedAt: serverTimestamp()
            });

            return agency;
        } catch (error) {
            console.error('Error creating agency:', error);
            return null;
        }
    },

    /**
     * Get agency by username/handle
     */
    async getAgencyByUsername(username: string): Promise<Agency | null> {
        try {
            const normalizedUsername = username.toLowerCase().trim();

            // Get agency ID from username mapping
            const usernameDoc = await getDoc(doc(db, 'agency_usernames', normalizedUsername));
            if (!usernameDoc.exists()) {
                return null;
            }

            const agencyId = usernameDoc.data().agencyId;
            return await this.getAgencyById(agencyId);
        } catch (error) {
            console.error('Error getting agency by username:', error);
            return null;
        }
    },

    /**
     * Get agency by ID
     */
    async getAgencyById(agencyId: string): Promise<Agency | null> {
        try {
            const agencyDoc = await getDoc(doc(db, 'agencies', agencyId));
            if (!agencyDoc.exists()) {
                return null;
            }

            return {
                id: agencyDoc.id,
                ...agencyDoc.data()
            } as Agency;
        } catch (error) {
            console.error('Error getting agency by ID:', error);
            return null;
        }
    },

    /**
     * Get all agencies owned by a user
     */
    async getUserAgencies(userId: string): Promise<Agency[]> {
        try {
            const q = query(
                collection(db, 'agencies'),
                where('ownerId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            const agencies: Agency[] = [];

            querySnapshot.forEach((doc) => {
                agencies.push({
                    id: doc.id,
                    ...doc.data()
                } as Agency);
            });

            return agencies;
        } catch (error) {
            console.error('Error getting user agencies:', error);
            return [];
        }
    },

    /**
     * Get all agencies where user is a member (but not owner)
     */
    async getAgenciesUserBelongsTo(userId: string): Promise<Agency[]> {
        try {
            // Query all agencies
            const querySnapshot = await getDocs(collection(db, 'agencies'));
            const agencies: Agency[] = [];

            querySnapshot.forEach((doc) => {
                const agency = {
                    id: doc.id,
                    ...doc.data()
                } as Agency;

                // Check if user is a member but not owner
                const isMember = agency.members?.some(
                    member => member.userId === userId && member.role !== 'owner'
                );

                if (isMember) {
                    agencies.push(agency);
                }
            });

            return agencies;
        } catch (error) {
            console.error('Error getting agencies user belongs to:', error);
            return [];
        }
    },

    /**
     * Add a member to an agency
     */
    async addAgencyMember(
        agencyId: string,
        member: {
            userId: string;
            agencyEmail: string;
            role: 'admin' | 'member';
        }
    ): Promise<boolean> {
        try {
            const agencyRef = doc(db, 'agencies', agencyId);

            const newMember: AgencyMember = {
                userId: member.userId,
                agencyEmail: member.agencyEmail,
                role: member.role,
                addedAt: Timestamp.now()
            };

            await updateDoc(agencyRef, {
                members: arrayUnion(newMember),
                updatedAt: serverTimestamp()
            });

            // Update user's document with agency email
            const userRef = doc(db, 'users', member.userId);
            await updateDoc(userRef, {
                agencyEmails: arrayUnion(member.agencyEmail),
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error adding agency member:', error);
            return false;
        }
    },

    /**
     * Remove a member from an agency
     */
    async removeAgencyMember(agencyId: string, userId: string): Promise<boolean> {
        try {
            const agency = await this.getAgencyById(agencyId);
            if (!agency) {
                return false;
            }

            // Find the member to remove
            const memberToRemove = agency.members.find(m => m.userId === userId);
            if (!memberToRemove) {
                return false;
            }

            // Don't allow removing the owner
            if (memberToRemove.role === 'owner') {
                throw new Error('Cannot remove agency owner');
            }

            const agencyRef = doc(db, 'agencies', agencyId);
            await updateDoc(agencyRef, {
                members: arrayRemove(memberToRemove),
                updatedAt: serverTimestamp()
            });

            // Remove agency email from user's document
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                agencyEmails: arrayRemove(memberToRemove.agencyEmail),
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error removing agency member:', error);
            return false;
        }
    },

    /**
     * Check if user has access to an agency (is owner or member)
     */
    async userHasAccess(agencyId: string, userId: string): Promise<boolean> {
        try {
            const agency = await this.getAgencyById(agencyId);
            if (!agency) {
                return false;
            }

            return agency.members.some(member => member.userId === userId);
        } catch (error) {
            console.error('Error checking user access:', error);
            return false;
        }
    },

    /**
     * Get user's agency email for a specific agency
     */
    async getUserAgencyEmail(agencyId: string, userId: string): Promise<string | null> {
        try {
            const agency = await this.getAgencyById(agencyId);
            if (!agency) {
                return null;
            }

            const member = agency.members.find(m => m.userId === userId);
            return member?.agencyEmail || null;
        } catch (error) {
            console.error('Error getting user agency email:', error);
            return null;
        }
    }
};
