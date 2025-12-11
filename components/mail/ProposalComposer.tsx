'use client';

import { useEffect, useState } from 'react';
import { ContractTemplate } from '@/lib/types/mail.types';
import { ContractTemplateService } from '@/lib/services/contract-template-service';
import GambianLegalHeader from './GambianLegalHeader';
import { SYSTEM_TEMPLATES } from '@/lib/data/contract-templates';
import { TEMPLATE_IDS, TEMPLATE_NAMES, CONTRACT_TYPES } from '@/lib/constants/contracts';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { AIContractDrafterModal } from './ai/AIContractDrafterModal';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';

interface ProposalComposerProps {
    onProposalGenerated: (proposalData: {
        title: string;
        description: string;
        defaultTerms?: string;
        terms: any;
        templateId?: string;
    }) => void;
    autoAIRequest?: {
        templateId?: string;
        contractType?: string;
        brief?: string;
        variables?: Record<string, any>;
        autoStart?: boolean;
    };
    // New prop to handle manual template passing
    templateId?: string;
    initialData?: Record<string, any>;
}

export default function ProposalComposer({
    onProposalGenerated,
    autoAIRequest,
    templateId,
    initialData
}: ProposalComposerProps) {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
    const [variables, setVariables] = useState<Record<string, any>>(initialData || {});
    const [loading, setLoading] = useState(true);
    const [showAIDrafter, setShowAIDrafter] = useState(false);
    const { user } = useAuth();
    const [autoTriggered, setAutoTriggered] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    // 1. Handle Auto-Selection Logic
    useEffect(() => {
        if (!templates.length) return;

        // Determine which ID we are looking for (from props or autoRequest)
        const targetId = templateId || autoAIRequest?.templateId;

        if (targetId) {
            // Map generic URL IDs to actual Template Names if necessary
            let templateName = targetId;
            if (targetId === TEMPLATE_IDS.JOB_PROPOSAL) templateName = TEMPLATE_NAMES.JOB_PROPOSAL;
            if (targetId === TEMPLATE_IDS.PROJECT_PROPOSAL) templateName = TEMPLATE_NAMES.PROJECT_PROPOSAL;
            if (targetId === TEMPLATE_IDS.TASK_PROPOSAL) templateName = TEMPLATE_NAMES.TASK_PROPOSAL;

            const template = templates.find(t =>
                t.id === targetId ||
                t.name === templateName ||
                t.type === targetId
            );

            if (template) {
                setSelectedTemplate(template);
            }
        }

        // Merge variables
        if (autoAIRequest?.variables) {
            setVariables(prev => ({ ...prev, ...autoAIRequest.variables }));
        }

        // Handle AI Auto-Start
        if (autoAIRequest?.autoStart && !autoTriggered) {
            setAutoTriggered(true);
            setShowAIDrafter(true);
        }
    }, [autoAIRequest, templates, templateId, autoTriggered]);

    const loadTemplates = () => {
        try {
            // Filter only Proposal-related templates
            const proposalTemplates = (SYSTEM_TEMPLATES as unknown as ContractTemplate[]).filter(t =>
                t.name.toLowerCase().includes('proposal') ||
                t.name.includes('Bid') ||
                t.type === 'general'
            );
            setTemplates(proposalTemplates);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load proposal templates', error);
            setLoading(false);
        }
    };

    const handleTemplateSelect = (id: string) => {
        const template = templates.find(t => t.id === id || t.name === id);
        if (template) setSelectedTemplate(template);
    };

    const handleVariableChange = (key: string, value: any) => {
        setVariables(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleAIGenerated = (proposalData: { templateId?: string; variables: Record<string, any> }) => {
        // Update template if AI changed it
        if (proposalData.templateId) {
            const template = templates.find(t => t.id === proposalData.templateId || t.name === proposalData.templateId);
            if (template) setSelectedTemplate(template);
        }

        // Merge AI variables
        setVariables(prev => ({ ...prev, ...proposalData.variables }));
    };

    const handleGenerate = () => {
        if (!selectedTemplate) return;

        // Validation
        const missingVars = selectedTemplate.variables
            .filter(v => v.required && !variables[v.key] && variables[v.key] !== 0)
            .map(v => v.label);

        if (missingVars.length > 0) {
            alert(`Please fill in: ${missingVars.join(', ')}`);
            return;
        }

        try {
            const proposalBody = ContractTemplateService.renderTemplate(selectedTemplate.bodyTemplate, variables);
            const terms = {
                ...variables,
                contractType: selectedTemplate.type || CONTRACT_TYPES.GENERAL,
                proposal: true // Vital flag
            };

            const title = variables.proposalTitle || variables.projectTitle || variables.jobTitle || `${selectedTemplate.name}`;

            onProposalGenerated({
                title,
                description: proposalBody,
                defaultTerms: selectedTemplate.defaultTerms,
                terms,
                templateId: selectedTemplate.id
            });
        } catch (error) {
            console.error('Failed to generate proposal:', error);
            alert('Generation failed.');
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading templates...</div>;
    }

    // Context Banner Data
    const contextName = variables.proposalContext?.jobTitle ||
        variables.jobTitle ||
        variables.projectTitle ||
        variables.taskTitle || '';
    const contextType = variables.proposalContext?.jobType || 'Job';

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 mb-2">
                    <label className="flex-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Select Proposal Template
                    </label>
                    <button
                        onClick={() => setShowAIDrafter(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg transition-colors border border-teal-200 dark:border-teal-800"
                    >
                        <ConnektAIIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">AI Assistant</span>
                    </button>
                </div>
                <select
                    className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    value={selectedTemplate?.id || selectedTemplate?.name || ''}
                >
                    <option value="">-- Choose a Template --</option>
                    {templates.map((template, index) => (
                        <option key={template.id || index} value={template.id || template.name}>
                            {template.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedTemplate && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Form */}
                    <div className="w-1/2 p-4 overflow-y-auto border-r border-gray-200 dark:border-zinc-700 custom-scrollbar">
                        {contextName && (
                            <div className="mb-6 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-900/30">
                                <label className="block text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
                                    Applying To ({contextType})
                                </label>
                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                    {contextName}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {selectedTemplate.variables.map((variable) => (
                                <div key={variable.key}>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">
                                        {variable.label} {variable.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {variable.label.toLowerCase().includes('summary') || variable.label.toLowerCase().includes('description') || variable.label.toLowerCase().includes('cover') ? (
                                        <textarea
                                            rows={5}
                                            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            value={variables[variable.key] || ''}
                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                        />
                                    ) : (
                                        <input
                                            type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text'}
                                            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            value={variables[variable.key] || ''}
                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="w-1/2 p-4 overflow-y-auto bg-gray-100 dark:bg-zinc-950/50 custom-scrollbar">
                        <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 min-h-full">
                            {/* Branding Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-zinc-700 flex flex-col items-center">
                                <GambianLegalHeader
                                    size="small"
                                    showConnektLogo={true}
                                    showCoatOfArms={false}
                                    showGambianFlag={false}
                                />
                                <h2 className="mt-4 text-xl font-bold uppercase text-gray-900 dark:text-white text-center">
                                    {variables.proposalTitle || selectedTemplate.name}
                                </h2>
                            </div>

                            <div className="p-8 prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>
                                    {ContractTemplateService.renderTemplate(selectedTemplate.bodyTemplate, variables)}
                                </ReactMarkdown>

                                {selectedTemplate.defaultTerms && (
                                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-700">
                                        <h4 className="font-bold uppercase text-xs text-gray-500 mb-2">Standard Terms</h4>
                                        <div className="text-xs text-gray-500">
                                            <ReactMarkdown>{selectedTemplate.defaultTerms}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedTemplate && (
                <div className="p-4 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 flex justify-end">
                    <button
                        onClick={handleGenerate}
                        className="bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg shadow-teal-500/20"
                    >
                        Attach Proposal
                    </button>
                </div>
            )}

            {/* AI Modal */}
            {showAIDrafter && user && (
                <AIContractDrafterModal
                    userId={user.uid}
                    templates={templates}
                    onClose={() => setShowAIDrafter(false)}
                    title="Draft Proposal with AI"
                    mode="proposal"
                    initialData={autoAIRequest ? {
                        templateId: autoAIRequest.templateId, // Generic ID
                        contractType: CONTRACT_TYPES.PROPOSAL, // Force type
                        brief: autoAIRequest.brief,
                        autoStart: autoAIRequest.autoStart,
                    } : {
                        contractType: CONTRACT_TYPES.PROPOSAL
                    }}
                    onGenerated={(data) => {
                        handleAIGenerated(data);
                        setShowAIDrafter(false);
                    }}
                />
            )}
        </div>
    );
}
