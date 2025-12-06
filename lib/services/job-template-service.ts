import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    serverTimestamp,
    orderBy,
    deleteDoc
} from 'firebase/firestore';
import { JobTemplate } from '@/lib/types/workspace.types';

export const JobTemplateService = {
    /**
     * Create or Update a Job Template
     */
    async saveTemplate(workspaceId: string, template: Omit<JobTemplate, 'id' | 'createdAt'>, templateId?: string): Promise<string> {
        const id = templateId || doc(collection(db, `workspaces/${workspaceId}/templates`)).id;
        const templateRef = doc(db, `workspaces/${workspaceId}/templates`, id);

        await setDoc(templateRef, {
            ...template,
            id,
            workspaceId,
            createdAt: serverTimestamp()
        }, { merge: true });

        return id;
    },

    /**
     * Get all templates for a workspace
     */
    async getTemplates(workspaceId: string): Promise<JobTemplate[]> {
        const templatesRef = collection(db, `workspaces/${workspaceId}/templates`);
        const q = query(templatesRef, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as JobTemplate);
    },

    /**
     * Delete a template
     */
    async deleteTemplate(workspaceId: string, templateId: string): Promise<void> {
        const templateRef = doc(db, `workspaces/${workspaceId}/templates`, templateId);
        await deleteDoc(templateRef);
    }
};
