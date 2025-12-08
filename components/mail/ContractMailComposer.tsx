'use client';

import { useState, useEffect } from 'react';
import { ContractTemplate } from '@/lib/types/mail.types';
import { ContractTemplateService } from '@/lib/services/contract-template-service';
import GambianLegalHeader from './GambianLegalHeader';
import { SYSTEM_TEMPLATES } from '@/lib/data/contract-templates';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { AIContractDrafterModal } from './ai/AIContractDrafterModal';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace, Project, Task } from '@/lib/types/workspace.types';
import { TaskService } from '@/lib/services/task-service';

interface ContractMailComposerProps {
    onContractGenerated: (contractData: {
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
    recipientEmail?: string;
    autoSelectTaskId?: string;
    autoSelectProjectId?: string;
    autoSelectWorkspaceId?: string;
}

export default function ContractMailComposer({
    onContractGenerated,
    autoAIRequest,
    recipientEmail,
    autoSelectTaskId,
    autoSelectProjectId,
    autoSelectWorkspaceId
}: ContractMailComposerProps) {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
    const [variables, setVariables] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    const [showAIDrafter, setShowAIDrafter] = useState(false);
    const { user } = useAuth();
    const [autoTriggered, setAutoTriggered] = useState(false);

    // Manual Context Selection
    const [myWorkspaces, setMyWorkspaces] = useState<Workspace[]>([]);
    const [workspaceProjects, setWorkspaceProjects] = useState<Project[]>([]);
    const [projectTasks, setProjectTasks] = useState<Task[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');

    const loadTemplates = async () => {
        try {
            setTemplates(SYSTEM_TEMPLATES as unknown as ContractTemplate[]);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load templates', error);
            setLoading(false);
        }
    };

    const loadWorkspaces = async () => {
        if (!user) return;
        try {
            const ws = await WorkspaceService.getUserWorkspaces(user.uid);
            setMyWorkspaces(ws);
        } catch (e) {
            console.error('Error loading workspaces', e);
        }
    };

    useEffect(() => {
        loadTemplates();
        if (user) {
            loadWorkspaces();
        }
    }, [user]);

    // Auto-update Client/Contractor Names
    useEffect(() => {
        setVariables(prev => ({
            ...prev,
            clientName: user?.displayName || user?.email || 'Client',
            contractorName: recipientEmail ? recipientEmail.split('@')[0] : 'Contractor'
        }));
    }, [user, recipientEmail]);

    // Pre-select template and auto-open AI drafter when provided
    useEffect(() => {
        if (!autoAIRequest || !templates.length) return;

        if (autoAIRequest.templateId) {
            const template = templates.find(t => t.id === autoAIRequest.templateId || t.name === autoAIRequest.templateId);
            if (template) {
                setSelectedTemplate(template);
            }
        }

        if (autoAIRequest.variables) {
            setVariables(prev => ({ ...prev, ...autoAIRequest.variables }));
        }

        if (autoAIRequest.autoStart && !autoTriggered) {
            setAutoTriggered(true);
            setShowAIDrafter(true);
        }
    }, [autoAIRequest, templates, autoTriggered]);

    const handleWorkspaceSelect = async (wsId: string) => {
        setSelectedWorkspaceId(wsId);
        setSelectedProjectId('');
        setSelectedTaskId('');
        setProjectTasks([]);

        // Auto-fill workspace name into variables if applicable
        const ws = myWorkspaces.find(w => w.id === wsId);
        if (ws) {
            setVariables(prev => ({
                ...prev,
                workspaceName: ws.name,
                companyName: ws.name
            }));
        }

        if (wsId) {
            try {
                const projects = await EnhancedProjectService.getWorkspaceProjects(wsId);
                setWorkspaceProjects(projects);
            } catch (e) {
                console.error('Error loading projects', e);
            }
        } else {
            setWorkspaceProjects([]);
        }
    };

    const handleProjectSelect = async (pId: string) => {
        setSelectedProjectId(pId);
        setSelectedTaskId('');
        const proj = workspaceProjects.find(p => p.id === pId);

        if (proj) {
            setVariables(prev => ({
                ...prev,
                projectId: proj.id,
                projectTitle: proj.title,
                projectDescription: proj.description,
                paymentAmount: proj.budget || prev.paymentAmount,
                deadline: proj.deadline || prev.deadline
            }));

            // Fetch tasks for the project
            try {
                const tasks = await TaskService.getProjectTasks(pId);
                setProjectTasks(tasks);
            } catch (e) {
                console.error('Error loading tasks', e);
                setProjectTasks([]);
            }
        } else {
            setProjectTasks([]);
        }
    };

    const handleTaskSelect = (tId: string) => {
        setSelectedTaskId(tId);
        const task = projectTasks.find(t => t.id === tId);
        if (task) {
            setVariables(prev => ({
                ...prev,
                taskId: task.id,
                taskTitle: task.title,
                taskDescription: task.description,
                projectTitle: task.title, // Map to projectTitle for Freelance template
                projectDescription: task.description,
                paymentAmount: task.pricing?.amount || prev.paymentAmount,
                deadline: task.timeline?.dueDate || prev.deadline
            }));
        }
    };

    // Auto-select Workspace
    useEffect(() => {
        if (autoSelectWorkspaceId && myWorkspaces.length > 0) {
            const wsExists = myWorkspaces.find(w => w.id === autoSelectWorkspaceId);
            if (wsExists && selectedWorkspaceId !== autoSelectWorkspaceId) {
                handleWorkspaceSelect(autoSelectWorkspaceId);
            }
        }
    }, [autoSelectWorkspaceId, myWorkspaces]);

    // Auto-select Project (dependent on workspaceProjects being loaded)
    useEffect(() => {
        if (autoSelectProjectId && workspaceProjects.length > 0) {
            const projExists = workspaceProjects.find(p => p.id === autoSelectProjectId);
            if (projExists && selectedProjectId !== autoSelectProjectId) {
                handleProjectSelect(autoSelectProjectId);
            }
        }
    }, [autoSelectProjectId, workspaceProjects]);

    // Auto-select task(s) when autoSelectTaskId is provided
    useEffect(() => {
        if (autoSelectTaskId && projectTasks.length > 0) {
            const taskIds = autoSelectTaskId.split(',').filter(id => id.trim());

            if (taskIds.length === 1) {
                const taskExists = projectTasks.find(t => t.id === taskIds[0]);
                if (taskExists && selectedTaskId !== taskIds[0]) {
                    handleTaskSelect(taskIds[0]);
                }
            } else if (taskIds.length > 1) {
                const selectedTasks = projectTasks.filter(t => taskIds.includes(t.id!));
                if (selectedTasks.length > 0) {
                    setSelectedTaskId(selectedTasks[0].id!);
                    const totalBudget = selectedTasks.reduce((sum, t) => sum + (t.pricing?.amount || 0), 0);
                    const taskTitles = selectedTasks.map(t => t.title).join(', ');
                    const taskDescriptions = selectedTasks.map((t, i) => `${i + 1}. ${t.title}: ${t.description}`).join('\n\n');

                    setVariables(prev => ({
                        ...prev,
                        taskId: selectedTasks.map(t => t.id).join(','),
                        taskTitle: `Multiple Tasks: ${taskTitles}`,
                        taskDescription: taskDescriptions,
                        projectTitle: `Multiple Tasks (${selectedTasks.length})`,
                        projectDescription: taskDescriptions,
                        paymentAmount: totalBudget,
                        paymentCurrency: selectedTasks[0].pricing?.currency || prev.paymentCurrency,
                        deadline: selectedTasks[0].timeline?.dueDate || prev.deadline
                    }));
                }
            }
        }
    }, [autoSelectTaskId, projectTasks]);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId || t.name === templateId);
        if (template) {
            setSelectedTemplate(template);
        }
    };

    const handleVariableChange = (key: string, value: any) => {
        setVariables(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleAIGenerated = (contractData: { templateId?: string; variables: Record<string, any> }) => {
        if (contractData.templateId) {
            const template = templates.find(t => t.id === contractData.templateId || t.name === contractData.templateId);
            if (template) {
                setSelectedTemplate(template);
            }
        }

        setVariables(prev => ({
            ...prev,
            ...contractData.variables
        }));
    };

    const handleGenerate = () => {
        if (!selectedTemplate) return;

        const missingVars = selectedTemplate.variables
            .filter(v => v.required && !variables[v.key])
            .map(v => v.label);

        if (missingVars.length > 0) {
            alert(`Please fill in the following required fields: ${missingVars.join(', ')}`);
            return;
        }

        const contractBody = ContractTemplateService.renderTemplate(selectedTemplate.bodyTemplate, variables);
        const terms = {
            ...variables,
            contractType: selectedTemplate.type
        };

        onContractGenerated({
            title: variables.jobTitle || variables.projectTitle || variables.proposalTitle || selectedTemplate.name,
            description: contractBody,
            defaultTerms: selectedTemplate.defaultTerms,
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
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Select Workspace
                        </label>
                        <select
                            value={selectedWorkspaceId}
                            onChange={(e) => handleWorkspaceSelect(e.target.value)}
                            className="w-full py-1.5 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- None --</option>
                            {myWorkspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Select Project
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => handleProjectSelect(e.target.value)}
                            disabled={!selectedWorkspaceId}
                            className="w-full py-1.5 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            <option value="">-- None --</option>
                            {workspaceProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Select Task
                        </label>
                        <select
                            value={selectedTaskId}
                            onChange={(e) => handleTaskSelect(e.target.value)}
                            disabled={!selectedProjectId}
                            className="w-full py-1.5 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            <option value="">-- None --</option>
                            {projectTasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end pb-0.5">
                        <button
                            onClick={() => setShowAIDrafter(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors text-xs font-semibold"
                            title="AI Contract Drafter"
                        >
                            <ConnektAIIcon className="w-4 h-4" />
                            <span>AI Drafter</span>
                        </button>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contract Template
                    </label>
                    <select
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        value={selectedTemplate?.id || selectedTemplate?.name || ''}
                    >
                        <option value="">-- Choose a Template --</option>
                        {templates.filter(t => {
                            if (selectedTaskId) {
                                return ['project', 'task_admin'].includes(t.type);
                            }
                            if (selectedProjectId) {
                                return ['project', 'project_admin'].includes(t.type);
                            }
                            if (selectedWorkspaceId) {
                                return ['job', 'project'].includes(t.type);
                            }
                            return true;
                        }).map((template, index) => (
                            <option key={template.id || index} value={template.id || template.name}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedTemplate && (
                <div className="flex-1 flex overflow-hidden">
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

            {showAIDrafter && user && (
                <AIContractDrafterModal
                    userId={user.uid}
                    templates={templates}
                    onClose={() => setShowAIDrafter(false)}
                    initialData={autoAIRequest ? {
                        templateId: autoAIRequest.templateId,
                        contractType: autoAIRequest.contractType,
                        brief: autoAIRequest.brief,
                        autoStart: autoAIRequest.autoStart,
                    } : undefined}
                    onGenerated={(contractData) => {
                        handleAIGenerated(contractData);
                        setShowAIDrafter(false);
                    }}
                />
            )}
        </div>
    );
}
