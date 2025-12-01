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
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import type { ContractTemplate, ContractType } from '@/lib/types/mail.types';

/**
 * Contract Template Service
 * 
 * Manages contract templates with variable substitution and rendering.
 * Supports both system templates and agency-custom templates.
 */
export const ContractTemplateService = {
    /**
     * Get all system templates
     */
    async getSystemTemplates(): Promise<ContractTemplate[]> {
        const q = query(
            collection(db, 'contract_templates'),
            where('visibility', '==', 'system'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ContractTemplate));
    },

    /**
     * Get templates by contract type
     */
    async getTemplatesByType(contractType: ContractType): Promise<ContractTemplate[]> {
        const q = query(
            collection(db, 'contract_templates'),
            where('type', '==', contractType),
            where('visibility', '==', 'system')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ContractTemplate));
    },

    /**
     * Get agency custom templates
     */
    async getAgencyTemplates(agencyId: string): Promise<ContractTemplate[]> {
        const q = query(
            collection(db, 'contract_templates'),
            where('visibility', '==', 'agency_custom'),
            where('agencyId', '==', agencyId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ContractTemplate));
    },

    /**
     * Get template by ID
     */
    async getTemplateById(templateId: string): Promise<ContractTemplate | null> {
        const docRef = doc(db, 'contract_templates', templateId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return {
            id: docSnap.id,
            ...docSnap.data()
        } as ContractTemplate;
    },

    /**
     * Create a new template (agency custom)
     */
    async createTemplate(templateData: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const template = {
            ...templateData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'contract_templates'), template);
        return docRef.id;
    },

    /**
     * Update template
     */
    async updateTemplate(templateId: string, updates: Partial<ContractTemplate>): Promise<void> {
        const docRef = doc(db, 'contract_templates', templateId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Delete template (agency custom only)
     */
    async deleteTemplate(templateId: string): Promise<void> {
        const template = await this.getTemplateById(templateId);

        if (template?.visibility === 'system') {
            throw new Error('Cannot delete system templates');
        }

        await deleteDoc(doc(db, 'contract_templates', templateId));
    },

    /**
     * Render template with variable substitution
     * 
     * Replaces {{variable}} placeholders with actual values
     */
    renderTemplate(template: string, variables: Record<string, any>): string {
        let rendered = template;

        // Replace all {{variable}} with actual values
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            rendered = rendered.replace(regex, String(variables[key] || ''));
        });

        return rendered;
    },

    /**
     * Extract variables from template
     * 
     * Finds all {{variable}} placeholders in template
     */
    extractVariables(template: string): string[] {
        const regex = /{{\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*}}/g;
        const matches = template.matchAll(regex);
        const variables: Set<string> = new Set();

        for (const match of matches) {
            variables.add(match[1]);
        }

        return Array.from(variables);
    },

    /**
     * Validate template variables
     * 
     * Ensures all required variables are provided
     */
    validateVariables(
        template: ContractTemplate,
        providedVariables: Record<string, any>
    ): { valid: boolean; missing: string[] } {
        const requiredVars = template.variables
            .filter(v => v.required)
            .map(v => v.key);

        const missing = requiredVars.filter(key => !providedVariables[key]);

        return {
            valid: missing.length === 0,
            missing
        };
    },

    /**
     * Generate contract body from template
     */
    async generateContractBody(
        templateId: string,
        variables: Record<string, any>
    ): Promise<string> {
        const template = await this.getTemplateById(templateId);

        if (!template) {
            throw new Error('Template not found');
        }

        // Validate variables
        const validation = this.validateVariables(template, variables);
        if (!validation.valid) {
            throw new Error(`Missing required variables: ${validation.missing.join(', ')}`);
        }

        // Render body template
        const body = this.renderTemplate(template.bodyTemplate, variables);
        const terms = this.renderTemplate(template.defaultTerms, variables);

        // Combine with terms
        return `${body}\\n\\n## Terms and Conditions\\n\\n${terms}`;
    }
};
