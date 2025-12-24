/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - REGISTRY
 * ============================================================================
 * 
 * Contract document management: CRUD operations and queries.
 * This is the data layer - no business logic, just storage operations.
 * 
 * @module legal.registry
 */

import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';

import type {
    LegalDocument,
    LegalDocumentType,
    LegalDocumentStatus,
    LegalAuditEntry,
    LegalServiceResponse,
    CreateContractInput,
    ContractQueryFilters
} from './legal.types';

import { LEGAL_COLLECTIONS, LEGAL_DOCUMENT_STATUS } from './legal.constants';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Remove undefined values from object (Firestore doesn't accept undefined)
 */
const sanitize = <T extends Record<string, any>>(obj: T): T => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize) as unknown as T;
    if (obj instanceof Date || obj instanceof Timestamp) return obj;

    return Object.fromEntries(
        Object.entries(obj)
            .map(([k, v]) => [k, sanitize(v)])
            .filter(([_, v]) => v !== undefined)
    ) as T;
};

// ============================================================================
// LEGAL REGISTRY SERVICE
// ============================================================================

export const LegalRegistry = {
    // ========================================================================
    // CREATE
    // ========================================================================

    /**
     * Create a new contract document
     */
    async create(input: CreateContractInput): Promise<LegalServiceResponse<string>> {
        try {
            const now = serverTimestamp();

            const document: Partial<LegalDocument> = {
                type: input.type,
                status: LEGAL_DOCUMENT_STATUS.PENDING,
                fromUserId: input.fromUserId,
                fromUsername: input.fromUsername,
                fromMailAddress: input.fromMailAddress,
                toUserId: input.toUserId,
                toUsername: input.toUsername,
                toMailAddress: input.toMailAddress,
                title: input.title,
                description: input.description,
                terms: input.terms,
                templateId: input.templateId,
                audit: [{
                    at: Timestamp.now(),
                    by: input.fromUserId,
                    action: 'created',
                    details: `Contract created: ${input.title}`
                }],
                createdAt: now,
                ...(input.expiresInDays && {
                    expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
                })
            };

            const sanitized = sanitize(document);
            const docRef = await addDoc(collection(db, LEGAL_COLLECTIONS.CONTRACTS), sanitized);

            return {
                success: true,
                data: docRef.id,
                message: 'Contract created successfully'
            };
        } catch (error) {
            console.error('[LegalRegistry.create] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create contract'
            };
        }
    },

    /**
     * Create a draft contract (not sent)
     */
    async createDraft(input: CreateContractInput): Promise<LegalServiceResponse<string>> {
        try {
            const now = serverTimestamp();

            const document: Partial<LegalDocument> = {
                type: input.type,
                status: LEGAL_DOCUMENT_STATUS.DRAFT,
                fromUserId: input.fromUserId,
                fromUsername: input.fromUsername,
                fromMailAddress: input.fromMailAddress,
                toUserId: input.toUserId,
                toUsername: input.toUsername,
                toMailAddress: input.toMailAddress,
                title: input.title,
                description: input.description,
                terms: input.terms,
                templateId: input.templateId,
                audit: [{
                    at: Timestamp.now(),
                    by: input.fromUserId,
                    action: 'draft_created',
                    details: 'Draft saved'
                }],
                createdAt: now,
            };

            const sanitized = sanitize(document);
            const docRef = await addDoc(collection(db, LEGAL_COLLECTIONS.CONTRACTS), sanitized);

            return {
                success: true,
                data: docRef.id,
                message: 'Draft saved successfully'
            };
        } catch (error) {
            console.error('[LegalRegistry.createDraft] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save draft'
            };
        }
    },

    // ========================================================================
    // READ
    // ========================================================================

    /**
     * Get a contract by ID
     */
    async getById(contractId: string): Promise<LegalServiceResponse<LegalDocument>> {
        try {
            const docRef = doc(db, LEGAL_COLLECTIONS.CONTRACTS, contractId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return {
                    success: false,
                    error: 'Contract not found'
                };
            }

            return {
                success: true,
                data: { id: docSnap.id, ...docSnap.data() } as LegalDocument
            };
        } catch (error) {
            console.error('[LegalRegistry.getById] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch contract'
            };
        }
    },

    /**
     * Query contracts with filters
     */
    async query(filters: ContractQueryFilters): Promise<LegalServiceResponse<LegalDocument[]>> {
        try {
            const constraints: any[] = [];

            // User filter
            if (filters.userId) {
                if (filters.direction === 'sent') {
                    constraints.push(where('fromUserId', '==', filters.userId));
                } else if (filters.direction === 'received') {
                    constraints.push(where('toUserId', '==', filters.userId));
                }
                // 'both' requires two queries, simplified to received for now
            }

            // Workspace filter
            if (filters.workspaceId) {
                constraints.push(where('terms.workspaceId', '==', filters.workspaceId));
            }

            // Project filter
            if (filters.projectId) {
                constraints.push(where('terms.projectId', '==', filters.projectId));
            }

            // Type filter
            if (filters.type) {
                if (Array.isArray(filters.type)) {
                    constraints.push(where('type', 'in', filters.type));
                } else {
                    constraints.push(where('type', '==', filters.type));
                }
            }

            // Status filter
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    constraints.push(where('status', 'in', filters.status));
                } else {
                    constraints.push(where('status', '==', filters.status));
                }
            }

            // Ordering
            constraints.push(
                orderBy(filters.orderBy || 'createdAt', filters.orderDirection || 'desc')
            );

            // Limit
            if (filters.limit) {
                constraints.push(limit(filters.limit));
            }

            const q = query(collection(db, LEGAL_COLLECTIONS.CONTRACTS), ...constraints);
            const snapshot = await getDocs(q);

            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LegalDocument));

            return {
                success: true,
                data: documents
            };
        } catch (error) {
            console.error('[LegalRegistry.query] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to query contracts',
                data: []
            };
        }
    },

    /**
     * Get contracts sent by a user
     */
    async getSentByUser(userId: string, status?: LegalDocumentStatus): Promise<LegalDocument[]> {
        const result = await this.query({
            userId,
            direction: 'sent',
            status,
            orderBy: 'createdAt',
            orderDirection: 'desc'
        });
        return result.data || [];
    },

    /**
     * Get contracts received by a user
     */
    async getReceivedByUser(userId: string, status?: LegalDocumentStatus): Promise<LegalDocument[]> {
        const result = await this.query({
            userId,
            direction: 'received',
            status,
            orderBy: 'createdAt',
            orderDirection: 'desc'
        });
        return result.data || [];
    },

    /**
     * Get pending contracts for a user (to sign)
     */
    async getPendingForUser(userId: string): Promise<LegalDocument[]> {
        return this.getReceivedByUser(userId, LEGAL_DOCUMENT_STATUS.PENDING);
    },

    /**
     * Get active contracts for a user
     */
    async getActiveForUser(userId: string): Promise<LegalDocument[]> {
        const result = await this.query({
            userId,
            direction: 'received',
            status: [LEGAL_DOCUMENT_STATUS.SIGNED, LEGAL_DOCUMENT_STATUS.ACCEPTED],
            orderBy: 'createdAt',
            orderDirection: 'desc'
        });
        return result.data || [];
    },

    // ========================================================================
    // UPDATE
    // ========================================================================

    /**
     * Update contract fields
     */
    async update(
        contractId: string,
        updates: Partial<LegalDocument>,
        auditEntry?: Omit<LegalAuditEntry, 'at'>
    ): Promise<LegalServiceResponse> {
        try {
            const docRef = doc(db, LEGAL_COLLECTIONS.CONTRACTS, contractId);

            const updateData: any = {
                ...sanitize(updates),
                updatedAt: serverTimestamp()
            };

            // Add audit entry if provided
            if (auditEntry) {
                updateData.audit = arrayUnion({
                    at: Timestamp.now(),
                    ...auditEntry
                });
            }

            await updateDoc(docRef, updateData);

            return {
                success: true,
                message: 'Contract updated successfully'
            };
        } catch (error) {
            console.error('[LegalRegistry.update] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update contract'
            };
        }
    },

    /**
     * Update contract status
     */
    async updateStatus(
        contractId: string,
        status: LegalDocumentStatus,
        userId: string,
        details?: string
    ): Promise<LegalServiceResponse> {
        return this.update(
            contractId,
            { status },
            {
                by: userId,
                action: `status_changed_to_${status}`,
                details: details || `Status changed to ${status}`
            }
        );
    },

    /**
     * Add audit entry to contract
     */
    async addAudit(
        contractId: string,
        entry: Omit<LegalAuditEntry, 'at'>
    ): Promise<LegalServiceResponse> {
        try {
            const docRef = doc(db, LEGAL_COLLECTIONS.CONTRACTS, contractId);

            await updateDoc(docRef, {
                audit: arrayUnion({
                    at: Timestamp.now(),
                    ...entry
                }),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[LegalRegistry.addAudit] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add audit entry'
            };
        }
    },

    // ========================================================================
    // DELETE
    // ========================================================================

    /**
     * Delete a draft contract
     */
    async deleteDraft(contractId: string, userId: string): Promise<LegalServiceResponse> {
        try {
            const contract = await this.getById(contractId);

            if (!contract.success || !contract.data) {
                return { success: false, error: 'Contract not found' };
            }

            if (contract.data.status !== LEGAL_DOCUMENT_STATUS.DRAFT) {
                return { success: false, error: 'Only draft contracts can be deleted' };
            }

            if (contract.data.fromUserId !== userId) {
                return { success: false, error: 'Unauthorized to delete this contract' };
            }

            const docRef = doc(db, LEGAL_COLLECTIONS.CONTRACTS, contractId);
            await deleteDoc(docRef);

            return {
                success: true,
                message: 'Draft deleted successfully'
            };
        } catch (error) {
            console.error('[LegalRegistry.deleteDraft] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete draft'
            };
        }
    },

    // ========================================================================
    // UTILITY
    // ========================================================================

    /**
     * Check if user is authorized for a contract
     */
    async isAuthorized(contractId: string, userId: string, role: 'sender' | 'recipient' | 'either'): Promise<boolean> {
        const result = await this.getById(contractId);
        if (!result.success || !result.data) return false;

        const contract = result.data;

        switch (role) {
            case 'sender':
                return contract.fromUserId === userId;
            case 'recipient':
                return contract.toUserId === userId;
            case 'either':
                return contract.fromUserId === userId || contract.toUserId === userId;
            default:
                return false;
        }
    },

    /**
     * Check if contract exists and is in expected status
     */
    async checkStatus(contractId: string, expectedStatus: LegalDocumentStatus | LegalDocumentStatus[]): Promise<LegalServiceResponse<LegalDocument>> {
        const result = await this.getById(contractId);

        if (!result.success || !result.data) {
            return { success: false, error: 'Contract not found' };
        }

        const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

        if (!statuses.includes(result.data.status)) {
            return {
                success: false,
                error: `Contract is not in expected status. Current: ${result.data.status}, Expected: ${statuses.join(' or ')}`
            };
        }

        return result;
    }
};
