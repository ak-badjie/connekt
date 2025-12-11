"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Info, FileText as FileTextIcon, FileText, Sparkles, Wand2, RefreshCw } from "lucide-react";
import ConnektAIIcon from "@/components/branding/ConnektAIIcon";
import { ConnectAIService } from "@/lib/services/connect-ai.service";
import { AIGenerationOverlay } from "@/components/profile/ai/AIGenerationOverlay";
import { ContractAI } from "@/lib/services/ai/contract-ai-service";
import toast from "react-hot-toast";
import { CONTRACT_TYPES as GLOBAL_CONTRACT_TYPES, TEMPLATE_NAMES } from '@/lib/constants/contracts';

interface TemplateVariable {
    key: string;
    label?: string;
    type?: string;
    required?: boolean;
}

interface TemplateOption {
    id?: string;
    name: string;
    type: string;
    variables?: TemplateVariable[];
}

interface AIContractDrafterModalProps {
    userId: string;
    templates: TemplateOption[];
    onClose: () => void;
    onGenerated: (contractData: { templateId?: string; variables: Record<string, any> }) => void;
    initialData?: {
        templateId?: string;
        contractType?: string;
        brief?: string;
        autoStart?: boolean;
    };
    title?: string;
    mode?: 'contract' | 'proposal';
}

const CONTRACT_TYPES = [
    { value: "job_short_term", label: "Short Term Engagement" },
    { value: "job_long_term", label: "Long Term Engagement" },
    { value: "job_project_based", label: "Project Based" },
    { value: "freelance", label: "Freelance Agreement" },
    { value: "service", label: "Service Agreement" },
    { value: "nda", label: "NDA" },
    { value: "general", label: "General Contract" },
];

export function AIContractDrafterModal({ userId, templates, onClose, onGenerated, initialData, title, mode }: AIContractDrafterModalProps) {
    const [contractType, setContractType] = useState<string>(initialData?.contractType || "job_short_term");
    const [templateId, setTemplateId] = useState<string>(initialData?.templateId || "");
    const [brief, setBrief] = useState<string>(initialData?.brief || "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<string>("Ready");
    const [error, setError] = useState<string | null>(null);
    const [autoRan, setAutoRan] = useState(false);

    // 1. Initialize from URL/Props
    useEffect(() => {
        if (initialData) {
            if (initialData.brief) setBrief(initialData.brief);

            // Map generic IDs (job_proposal) to actual template IDs if needed
            if (initialData.templateId) {
                const found = templates.find(t =>
                    t.id === initialData.templateId ||
                    t.name === initialData.templateId ||
                    t.type === initialData.templateId
                );
                if (found) setTemplateId(found.id || found.name);
            }

            if (initialData.contractType) {
                setContractType(initialData.contractType);
            }
        }
    }, [initialData, templates]);

    // Auto-Start logic if requested
    useEffect(() => {
        if (!initialData?.autoStart) return;
        if (autoRan) return;
        if (!templateId || !brief.trim()) return;

        setAutoRan(true);
        setTimeout(() => handleGenerate(), 500);
    }, [initialData, templateId, brief, autoRan]);

    const handleGenerate = async () => {
        const template = templates.find(t => (t.id || t.name) === templateId);

        if (!template && !initialData?.contractType) {
            setError("Please select a template first");
            toast.error("Please select a template first");
            return;
        }

        if (!brief.trim()) {
            setError("Please provide a brief or job description");
            toast.error("Please provide a brief or job description");
            return;
        }

        setIsGenerating(true);
        setStatus("Analyzing requirements...");
        setError(null);

        try {
            // Check AI quota
            const { allowed } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                throw new Error("AI quota exceeded. Please upgrade your plan or wait until next month.");
            }

            // Determine Context - Check if this is a Proposal or Contract
            const isProposal = mode === 'proposal' ||
                initialData?.contractType === GLOBAL_CONTRACT_TYPES.PROPOSAL ||
                template?.name.toLowerCase().includes('proposal') ||
                template?.type.toLowerCase().includes('proposal');

            // Construct AI Prompt
            let systemInstruction = '';
            let userPrompt = '';

            if (isProposal) {
                setStatus("Drafting persuasive proposal...");
                systemInstruction = `You are an expert freelancer and agency consultant. 
                Your goal is to write a winning proposal based on a Job Description.
                Tone: Professional, persuasive, confident, and solution-oriented.`;

                userPrompt = `
                CONTEXT:
                I am applying for a job.
                
                JOB DESCRIPTION (The Brief):
                "${brief}"

                REQUIRED OUTPUT:
                Fill the variables for the following Proposal Template: "${template?.name || 'Standard Proposal'}".
                
                VARIABLES TO FILL (JSON Format):
                ${JSON.stringify(template?.variables?.map(v => v.key) || ['coverLetter', 'proposedTerms', 'budget', 'timeline'])}

                INSTRUCTIONS:
                - 'coverLetter': Write a compelling cover letter addressing the client's needs found in the brief.
                - 'proposedTerms' or 'approach': Outline a technical or strategic approach to solve their problem.
                - 'budget' / 'paymentAmount': Extract from brief or suggest market rate if 'Negotiable'.
                - 'timeline' / 'deadline': Extract or estimate realistic timeline.
                
                Return ONLY valid JSON with the variable keys and their filled values.
                `;
            } else {
                setStatus("Drafting legal contract...");
                systemInstruction = `You are a legal contract drafter. Draft precise terms based on the requirements provided.`;
                userPrompt = `
                CONTEXT: Contract Drafting
                CONTRACT TYPE: ${contractType}
                BRIEF: "${brief}"
                TEMPLATE: ${template?.name}
                TEMPLATE VARIABLES: ${JSON.stringify(template?.variables?.map(v => v.key))}
                
                Return a JSON object with filled values for each variable based on the brief.
                `;
            }

            // Call AI Service
            const result = await ContractAI.generateVariables(systemInstruction, userPrompt);

            if (result.error) throw new Error(result.error);

            setStatus("Finalizing...");

            // Merge AI results with fallback defaults
            const today = new Date();
            const toISODate = (d: Date) => d.toISOString().split("T")[0];
            const plusDays = (d: Date, days: number) => {
                const next = new Date(d);
                next.setDate(next.getDate() + days);
                return next;
            };

            const base: Record<string, any> = {
                // Common fields
                jobTitle: result.variables.jobTitle || template?.name || "Untitled",
                projectTitle: result.variables.projectTitle || template?.name || "Untitled",
                proposalTitle: result.variables.proposalTitle || template?.name || "Untitled",
                projectDescription: result.variables.projectDescription || brief,
                scopeOfWork: result.variables.scopeOfWork || brief,
                description: result.variables.description || brief,
                paymentTerms: result.variables.paymentTerms || "Payment terms to be confirmed",
                timeline: result.variables.timeline || "Timeline to be confirmed",
                terminationConditions: result.variables.terminationConditions || "Standard termination with notice",
                confidentialityTerms: result.variables.confidentialityTerms || "Mutual confidentiality applies",
                intellectualProperty: result.variables.intellectualProperty || "IP remains with client upon full payment",
                contractType,

                // Proposal-specific fields
                coverLetter: result.variables.coverLetter || "",
                proposedTerms: result.variables.proposedTerms || "",
                approach: result.variables.approach || "",

                // Merge all AI variables
                ...result.variables,
            };

            // Prefill template-specific fields
            const defaultsByKey: Record<string, any> = {
                contractDate: toISODate(today),
                date: toISODate(today),
                startDate: toISODate(today),
                endDate: toISODate(plusDays(today, 30)),
                validUntil: toISODate(plusDays(today, 30)),
                duration: 30,
                durationUnit: "days",
                noticePeriod: 30,
                paymentAmount: result.variables.paymentAmount || result.variables.budget || "0",
                paymentCurrency: "USD",
                paymentSchedule: "Monthly",
                paymentType: "fixed",
                paymentMilestones: result.variables.paymentMilestones || "Milestones to be defined",
                reviewPeriod: 5,
                revisionRounds: 2,
                feeAmount: "0",
                feePeriod: "month",
                fee: "0",
                currency: "USD",
                totalCost: "0",
                serviceName: template?.name || "Service",
                serviceDescription: result.variables.serviceDescription || brief,
                providerName: "Provider",
                clientName: "Client",
                contractorName: "Contractor",
                employerName: "Employer",
                employeeName: "Employee",
                senderName: "Sender",
                recipientName: "Recipient",
                executiveSummary: result.variables.executiveSummary || brief,
                solutionDetails: result.variables.solutionDetails || brief,
                deliverables: result.variables.deliverables || "Deliverables to be defined",
                terminationClause: result.variables.terminationClause || "Either party may terminate with notice",
                jobDescription: result.variables.jobDescription || brief,
                jobRequirements: result.variables.jobRequirements || "Responsibilities to be defined",
                workLocation: "Remote",
                hoursPerWeek: 40,
                benefits: "Standard benefits",
                reviewPeriodDays: 5,
                proposalDescription: result.variables.proposalDescription || brief,
                paymentTypeDetails: result.variables.paymentTypeDetails || "Fixed",
                deadline: result.variables.deadline || toISODate(plusDays(today, 14)),
                validityPeriod: result.variables.validityPeriod || "30 days",
            };

            // Ensure all template variables are filled
            if (template?.variables?.length) {
                template.variables.forEach((variable) => {
                    if (base[variable.key] === undefined) {
                        const fallback = defaultsByKey[variable.key];
                        if (fallback !== undefined) {
                            base[variable.key] = fallback;
                        } else {
                            base[variable.key] = result.variables[variable.key] || brief || template.name;
                        }
                    }
                });
            }

            // Track usage
            await ConnectAIService.trackUsage(userId, "contract_drafter", 1200, 0.0012, true);

            // Pass back to parent
            onGenerated({
                templateId: templateId || template?.id,
                variables: base
            });

            toast.success(isProposal ? "Proposal draft generated successfully!" : "Contract draft generated successfully!");
            onClose();

        } catch (err: any) {
            console.error("AI Generation failed:", err);
            setError(err.message || "Failed to generate draft. Please try again.");
            toast.error(err.message || "Failed to generate draft. Please try again.");
        } finally {
            setIsGenerating(false);
            setStatus("Ready");
        }
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isGenerating} message={status} />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-teal-50 to-white dark:from-zinc-900 dark:to-zinc-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                <Sparkles className="text-teal-600 dark:text-teal-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title || 'AI Assistant'}</h2>
                                <p className="text-xs text-gray-500">
                                    {mode === 'proposal' || initialData?.contractType === 'proposal' ? 'Drafting Job Proposal' : 'Drafting Legal Contract'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {/* Template Selection (If not auto-selected) */}
                        {!initialData?.templateId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Template *
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full p-3 pr-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none"
                                        value={templateId}
                                        onChange={(e) => setTemplateId(e.target.value)}
                                        disabled={isGenerating}
                                    >
                                        <option value="">-- Select Template --</option>
                                        {templates.map(t => (
                                            <option key={t.id || t.name} value={t.id || t.name}>
                                                {t.name} ({t.type.replace(/_/g, ' ')})
                                            </option>
                                        ))}
                                    </select>
                                    <FileTextIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Contract Type (for non-proposal flows) */}
                        {initialData?.contractType !== 'proposal' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contract Type
                                </label>
                                <div className="relative">
                                    <select
                                        value={contractType}
                                        onChange={(e) => setContractType(e.target.value)}
                                        disabled={isGenerating}
                                        className="w-full p-3 pr-10 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none"
                                    >
                                        {CONTRACT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <FileTextIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* The Brief Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {initialData?.contractType === 'proposal' ? 'Job Description & Context *' : 'Contract Requirements *'}
                            </label>
                            <textarea
                                className="w-full h-40 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none text-sm leading-relaxed"
                                placeholder={initialData?.contractType === 'proposal'
                                    ? "Paste the job description here. Mention your key skills, budget constraints, and why you are a good fit..."
                                    : "Describe the agreement details, payment terms, deadlines, and responsibilities..."}
                                value={brief}
                                onChange={(e) => setBrief(e.target.value)}
                                disabled={isGenerating}
                            />
                        </div>

                        {/* AI Status Info */}
                        {isGenerating && (
                            <div className="flex items-center justify-center gap-3 py-4 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/10 rounded-xl animate-pulse">
                                <RefreshCw className="animate-spin" size={18} />
                                <span className="text-sm font-bold">{status}</span>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                            >
                                <FileText className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </motion.div>
                        )}

                        {/* Legal Disclaimer */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-700 dark:text-amber-400">
                                    <p className="font-semibold mb-1">Important:</p>
                                    <p>
                                        {initialData?.contractType === 'proposal'
                                            ? 'AI-generated proposals are starting templates. Review and personalize before sending.'
                                            : 'AI-generated contracts should be reviewed by a legal professional before use. This is a starting template only.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !brief.trim()}
                            className="px-6 py-2 bg-[#008080] hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Wand2 size={18} />
                            {isGenerating ? 'Generating...' : 'Generate Draft'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}