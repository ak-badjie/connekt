'use client';

import { useState, useEffect } from 'react';
import { FileSignature, Eye } from 'lucide-react';
import { UnifiedContractViewer } from '@/components/contracts/UnifiedContractViewer';
import { ContractSigningService } from '@/lib/services/contract-signing-service';
import { useAuth } from '@/context/AuthContext';

interface MailContractAttachmentProps {
    contractId: string;
    mailId: string;
}

export function MailContractAttachment({ contractId, mailId }: MailContractAttachmentProps) {
    const { user, userProfile } = useAuth();
    const [contract, setContract] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState(false);

    useEffect(() => {
        loadContract();
    }, [contractId]);

    const loadContract = async () => {
        try {
            const contractData = await ContractSigningService.getContract(contractId);
            setContract(contractData);
        } catch (error) {
            console.error('Failed to load contract:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async (contractId: string, fullName: string) => {
        if (!user || !userProfile) return;

        await ContractSigningService.signContract(
            contractId,
            user.uid,
            userProfile?.username || 'unknown',
            fullName
        );

        // Reload contract to show signed status
        await loadContract();
    };

    if (loading) {
        return (
            <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            </div>
        );
    }

    if (!contract) {
        return null;
    }

    const canSign = user?.uid === contract.toUserId && contract.status === 'pending';
    const isSigned = contract.status === 'signed';

    return (
        <>
            <div className="mt-4 p-4 bg-gradient-to-r from-[#008080]/10 to-teal-600/10 border-2 border-[#008080]/30 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                        <FileSignature className="text-[#008080]" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                            {contract.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {contract.type.replace(/_/g, ' ').toUpperCase()} Contract
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span>From: <span className="font-medium text-[#008080]">@{contract.fromUsername}</span></span>
                            <span>•</span>
                            <span>To: <span className="font-medium text-[#008080]">@{contract.toUsername}</span></span>
                        </div>

                        {isSigned ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                                ✓ Signed by {contract.signatureFullName}
                            </div>
                        ) : canSign ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium">
                                ⏳ Awaiting Your Signature
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-400 rounded-lg text-sm font-medium">
                                ⏳ Pending
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setViewing(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#008080] to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-[#008080] transition-all flex items-center gap-2 shadow-lg shadow-teal-500/30"
                    >
                        <Eye size={16} />
                        View Contract
                    </button>
                </div>
            </div>

            {/* Contract Viewer Modal */}
            {viewing && (
                <UnifiedContractViewer
                    contractId={contractId}
                    contract={contract}
                    isOpen={viewing}
                    onClose={() => setViewing(false)}
                    onSign={canSign ? handleSign : undefined}
                    canSign={canSign}
                />
            )}
        </>
    );
}
