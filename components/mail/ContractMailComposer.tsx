'use client';

import { useState, useEffect } from 'react';
import { ContractTemplate, ContractVariable } from '@/lib/types/mail.types';
import { ContractTemplateService } from '@/lib/services/contract-template-service';
import GambianLegalHeader from './GambianLegalHeader';
import { SYSTEM_TEMPLATES } from '@/lib/data/contract-templates';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { AIContractDrafterModal } from './ai/AIContractDrafterModal';
import { useAuth } from '@/context/AuthContext';

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
    const [previewMode, setPreviewMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAIDrafter, setShowAIDrafter] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            // In a real app, we would await ContractTemplateService.getSystemTemplates();
            // For now, we use the static system templates directly to ensure they appear immediately
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
            setPreviewMode(false);
        }
    };

    const handleVariableChange = (key: string, value: any) => {
        setVariables(prev => ({
            ...prev,
            [key]: value
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
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <label className="flex-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Contract Template
                    </label>
                    <button
                        onClick={() => setShowAIDrafter(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="AI Contract Drafter"
                    >
                        <ConnektAIIcon className="w-5 h-5" />
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
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Mode Toggle */}
                    <div className="flex justify-end mb-4">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-1 flex">
                            <button
                                onClick={() => setPreviewMode(false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!previewMode
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={() => setPreviewMode(true)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${previewMode
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                Preview Contract
                            </button>
                        </div>
                    </div>

                    {previewMode ? (
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <GambianLegalHeader
                                size="small"
                                showConnektLogo={selectedTemplate.headerConfig?.showConnektLogo}
                                showCoatOfArms={selectedTemplate.headerConfig?.showCoatOfArms}
                                showGambianFlag={selectedTemplate.headerConfig?.showGambianFlag}
                            />
                            <div className="p-8 prose dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{
                                    __html: ContractTemplateService.renderTemplate(selectedTemplate.bodyTemplate, variables).replace(/\n/g, '<br/>')
                                }} />

                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4">Standard Terms</h3>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                        {selectedTemplate.defaultTerms}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedTemplate.variables.map((variable) => (
                                <div key={variable.key} className={variable.type === 'text' && variable.label.includes('Description') ? 'col-span-2' : ''}>
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
                    )}
                </div>
            )}

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
                    onGenerated={(contract) => {
                        // Find or create a basic template to populate
                        setVariables({
                            contractContent: contract,
                            projectName: 'AI Generated Contract'
                        });
                        setShowAIDrafter(false);
                        // Switch to preview mode to show the generated contract
                        setPreviewMode(true);
                    }}
                />
            )}
        </div>
    );
}
