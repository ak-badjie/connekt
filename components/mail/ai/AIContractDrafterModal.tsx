"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Info, FileText as FileTextIcon, FileText } from "lucide-react";
import ConnektAIIcon from "@/components/branding/ConnektAIIcon";
import { ConnectAIService } from "@/lib/services/connect-ai.service";
import { AIGenerationOverlay } from "@/components/profile/ai/AIGenerationOverlay";

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

export function AIContractDrafterModal({ userId, templates, onClose, onGenerated, initialData }: AIContractDrafterModalProps) {
    const [contractType, setContractType] = useState<string>(initialData?.contractType || "job_short_term");
    const [templateId, setTemplateId] = useState<string>(initialData?.templateId || "");
    const [brief, setBrief] = useState<string>(initialData?.brief || "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoRan, setAutoRan] = useState(false);

    // Sync state when initial data changes
    useEffect(() => {
        if (initialData?.contractType) setContractType(initialData.contractType);
        if (initialData?.templateId) setTemplateId(initialData.templateId);
        if (initialData?.brief) setBrief(initialData.brief);
    }, [initialData]);

    // Auto-run generation when requested and fields are present
    useEffect(() => {
        if (!initialData?.autoStart) return;
        if (autoRan) return;
        if (!templateId || !brief.trim()) return;

        setAutoRan(true);
        handleGenerate();
    }, [initialData, templateId, brief, autoRan]);

    const handleGenerate = async () => {
        if (!templateId) {
            setError("Please choose a contract template");
            return;
        }

        if (!brief.trim()) {
            setError("Please describe the contract you want generated");
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);

            const { allowed } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                throw new Error("AI quota exceeded. Please upgrade your plan or wait until next month.");
            }

            const selectedTemplate = templates.find((t) => (t.id || t.name) === templateId);
            const templateName = selectedTemplate?.name || "Contract";

            const variables = {
                templateName,
                contractType,
                description: brief,
            };

            const contractData = await ConnectAIService.draftContract(contractType as any, variables, userId);

            const today = new Date();
            const toISODate = (d: Date) => d.toISOString().split("T")[0];
            const plusDays = (d: Date, days: number) => {
                const next = new Date(d);
                next.setDate(next.getDate() + days);
                return next;
            };

            const base: Record<string, any> = {
                jobTitle: contractData.jobTitle || templateName,
                projectTitle: contractData.jobTitle || templateName,
                proposalTitle: contractData.jobTitle || templateName,
                projectDescription: contractData.projectDescription || brief,
                scopeOfWork: contractData.projectDescription || brief,
                description: contractData.projectDescription || brief,
                paymentTerms: contractData.paymentTerms || "Payment terms to be confirmed",
                timeline: contractData.timeline || "Timeline to be confirmed",
                terminationConditions: contractData.terminationConditions || "Standard termination with notice",
                confidentialityTerms: contractData.confidentialityTerms || "Mutual confidentiality applies",
                intellectualProperty: contractData.intellectualProperty || "IP remains with client upon full payment",
                contractType,
            };

            // Prefill template-specific fields so the form isn't empty after AI generate
            const defaultsByKey: Record<string, any> = {
                contractDate: toISODate(today),
                date: toISODate(today),
                startDate: toISODate(today),
                endDate: toISODate(plusDays(today, 30)),
                validUntil: toISODate(plusDays(today, 30)),
                duration: 30,
                durationUnit: "days",
                noticePeriod: 30,
                paymentAmount: "0",
                paymentCurrency: "USD",
                paymentSchedule: "Monthly",
                paymentType: "fixed",
                paymentMilestones: contractData.paymentTerms || "Milestones to be defined",
                reviewPeriod: 5,
                revisionRounds: 2,
                feeAmount: "0",
                feePeriod: "month",
                fee: "0",
                currency: "USD",
                totalCost: "0",
                serviceName: templateName,
                serviceDescription: contractData.projectDescription || brief,
                providerName: "Provider",
                clientName: "Client",
                contractorName: "Contractor",
                employerName: "Employer",
                employeeName: "Employee",
                senderName: "Sender",
                recipientName: "Recipient",
                proposalTitle: templateName,
                executiveSummary: contractData.projectDescription || brief,
                solutionDetails: contractData.projectDescription || brief,
                deliverables: contractData.projectDescription || "Deliverables to be defined",
                paymentTerms: contractData.paymentTerms || "Payment terms to be confirmed",
                terminationClause: contractData.terminationConditions || "Either party may terminate with notice",
                jobDescription: contractData.projectDescription || brief,
                jobRequirements: contractData.projectDescription || "Responsibilities to be defined",
                workLocation: "Remote",
                hoursPerWeek: 40,
                benefits: "Standard benefits",
                reviewPeriodDays: 5,
                proposalDescription: contractData.projectDescription || brief,
                paymentTypeDetails: contractData.paymentTerms || "Fixed",
            };

            if (selectedTemplate?.variables?.length) {
                selectedTemplate.variables.forEach((variable) => {
                    if (base[variable.key] === undefined) {
                        const fallback = defaultsByKey[variable.key];
                        if (fallback !== undefined) {
                            base[variable.key] = fallback;
                        } else {
                            base[variable.key] = contractData[variable.key] || brief || templateName;
                        }
                    }
                });
            }

            const mapped = base;

            await ConnectAIService.trackUsage(userId, "contract_drafter", 1200, 0.0012, true);

            onGenerated({ templateId, variables: mapped });
            onClose();
        } catch (err: any) {
            console.error("Contract generation error:", err);
            setError(err.message || "Failed to generate contract");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isGenerating} message="Drafting your contract..." />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                <ConnektAIIcon className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Contract Drafter</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Choose a template, describe the contract, and we will prefill it.</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Template *</label>
                                <div className="relative">
                                    <select
                                        value={templateId}
                                        onChange={(e) => setTemplateId(e.target.value)}
                                        className="w-full appearance-none p-3 pr-10 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select a template</option>
                                        {templates.map((t) => (
                                            <option key={t.id || t.name} value={t.id || t.name}>
                                                {t.name} ({t.type.replace(/_/g, " ")})
                                            </option>
                                        ))}
                                    </select>
                                    <FileTextIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Contract Type</label>
                                <div className="relative">
                                    <select
                                        value={contractType}
                                        onChange={(e) => setContractType(e.target.value)}
                                        className="w-full appearance-none p-3 pr-10 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    >
                                        {CONTRACT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <FileTextIcon className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Describe the contract *</label>
                            <textarea
                                value={brief}
                                onChange={(e) => setBrief(e.target.value)}
                                placeholder="Describe parties, scope, payment, timelines, deliverables, and any special clauses."
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                rows={6}
                            />
                        </div>

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

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-700 dark:text-amber-400">
                                    <p className="font-semibold mb-1">Important:</p>
                                    <p>AI-generated contracts should be reviewed by a legal professional before use. This is a starting template only.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!templateId || !brief.trim() || isGenerating}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <ConnektAIIcon className="w-5 h-5" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}