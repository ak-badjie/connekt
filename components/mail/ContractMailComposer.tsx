'use client';

import { useState, useEffect } from 'react';
import { ContractTemplate, ContractVariable } from '@/lib/types/mail.types';
import { ContractTemplateService } from '@/lib/services/contract-template-service';
import GambianLegalHeader from './GambianLegalHeader';
import { SYSTEM_TEMPLATES } from '@/lib/data/contract-templates';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { AIContractDrafterModal } from './ai/AIContractDrafterModal';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';

interface ContractMailComposerProps {
    onContractGenerated: (contractData: {
        title: string;
        description: string;
        terms: any;
        templateId?: string;
    }) => void;
}

export default function ContractMailComposer({ onContractGenerated }: ContractMailComposerProps) {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
    const [variables, setVariables] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [showAIDrafter, setShowAIDrafter] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setTemplates(SYSTEM_TEMPLATES as unknown as ContractTemplate[]);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load templates', error);
            setLoading(false);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId || t.name === templateId);
        if (template) {
            setSelectedTemplate(template);
            setVariables({});
        }
    };

    const handleVariableChange = (key: string, value: any) => {
        setVariables(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleAIGenerated = (contractData: Record<string, any>) => {
        // Populate form fields with AI-generated data
        setVariables(prev => ({
            ...prev,
            ...contractData
        }));
    };

    const handleGenerate = () => {
        if (!selectedTemplate) return;

        // Validate required variables
        const missingVars = selectedTemplate.variables
            .filter(v => v.required && !variables[v.key])
            .map(v => v.label);

        if (missingVars.length > 0) {
            alert(`Please fill in the following required fields: ${missingVars.join(', ')}`);
            return;
        }

        const contractBody = ContractTemplateService.renderTemplate(selectedTemplate.bodyTemplate, variables);

        // Extract terms for the contract object
        const terms = {
            ...variables,
            contractType: selectedTemplate.type
        };

        onContractGenerated({
            title: variables.jobTitle || variables.projectTitle || variables.proposalTitle || selectedTemplate.name,
            description: contractBody,
            terms: terms,
            templateId: selectedTemplate.id
        });
    };

    if (loading) {
        return <div className="p-4 text-center">Loading templates...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <label className="flex-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Contract Template
                    </label>
                    <button
                        onClick={() => setShowAIDrafter(true)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="AI Contract Drafter"
                    >
                        <ConnektAIIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">AI Contract Drafter</span>
                    </button>
                </div>
                <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    value={selectedTemplate?.id || selectedTemplate?.name || ''}
                >
                    <option value="">-- Choose a Template --</option>
                    {templates.map((template, index) => (
                        <option key={template.id || index} value={template.id || template.name}>
                            {template.name} ({template.type.replace(/_/g, ' ')})
                        </option>
                    ))}
                </select>
            </div>

            {selectedTemplate && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Form Fields */}
                    <div className="w-1/2 p-4 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Contract Details
                        </h3>
                        <div className="space-y-4">
                            {selectedTemplate.variables.map((variable) => (
                                <div key={variable.key}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {variable.label} {variable.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {variable.type === 'date' ? (
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={variables[variable.key] || ''}
                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                        />
                                    ) : variable.type === 'number' || variable.type === 'currency' ? (
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={variables[variable.key] || ''}
                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                            placeholder={variable.type === 'currency' ? '0.00' : ''}
                                        />
                                    ) : variable.label.includes('Description') || variable.label.includes('List') || variable.label.includes('Terms') ? (
                                        <textarea
                                            rows={4}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={variables[variable.key] || ''}
                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={variables[variable.key] || ''}
                                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Live Preview */}
                    <div className="w-1/2 p-4 overflow-y-auto bg-white dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Live Preview
                        </h3>
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <GambianLegalHeader
                                size="small"
                                showConnektLogo={selectedTemplate.headerConfig?.showConnektLogo}
                                showCoatOfArms={selectedTemplate.headerConfig?.showCoatOfArms}
                                showGambianFlag={selectedTemplate.headerConfig?.showGambianFlag}
                            />
                            <div className="p-8 prose dark:prose-invert max-w-none prose-p:my-4 prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4 prose-li:my-2">
                                <div className="space-y-4">
                                    <ReactMarkdown>
                                        {ContractTemplateService.renderTemplate(selectedTemplate.bodyTemplate, variables)}
                                    </ReactMarkdown>
                                </div>

                                <div className="mt-12 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-6">Standard Terms</h3>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                                        <ReactMarkdown>
                                            {selectedTemplate.defaultTerms}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            {selectedTemplate && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={handleGenerate}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Attach Contract to Mail
                    </button>
                </div>
            )}

            {/* AI Contract Drafter Modal */}
            {showAIDrafter && user && (
                <AIContractDrafterModal
                    userId={user.uid}
                    onClose={() => setShowAIDrafter(false)}
                    onGenerated={(contractData) => {
                        handleAIGenerated(contractData);
                        setShowAIDrafter(false);
                    }}
                />
            )}
        </div>
    );
}
