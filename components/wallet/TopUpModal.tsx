import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: string;
    onPaymentComplete?: () => void;
}

export function TopUpModal({ isOpen, onClose, walletId, onPaymentComplete }: TopUpModalProps) {
    const { user } = useAuth();
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleTopUp = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/wallet/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    walletId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate payment');
            }

            const { paymentUrl, transactionId } = data;

            if (!paymentUrl) {
                throw new Error('No payment URL received from server');
            }

            console.log('Opening popup, transaction:', transactionId);

            // Open Modem Pay in popup window
            const popupWidth = 500;
            const popupHeight = Math.round(window.innerHeight * 0.7);
            const left = window.screenX + (window.outerWidth - popupWidth) / 2;
            const top = window.screenY + (window.outerHeight - popupHeight) / 2;

            const popup = window.open(
                paymentUrl,
                'ModemPayPayment',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popup) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }

            // DON'T start polling immediately - the verify page will write to RTDB
            // when the payment completes and Modem Pay redirects there.
            // The RTDB listener in NotificationContext will pick it up and show Dynamic Island.
            console.log('Popup opened, waiting for return_url redirect to trigger verification');

            // Close the modal
            onClose();
            setAmount('');
            setIsLoading(false);

        } catch (err: any) {
            console.error('Top up error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center"
                    />
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-8 pointer-events-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                                    Top Up Wallet
                                </h2>
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Amount (GMD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-2xl">
                                            D
                                        </span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            disabled={isLoading}
                                            className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:ring-4 focus:ring-[#008080]/20 focus:border-[#008080] outline-none transition-all font-bold text-3xl disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
                                        Payment Method
                                    </label>
                                    <div className="p-6 border-2 border-[#008080] bg-[#008080]/5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#008080]/10 transition-colors">
                                        <div className="flex flex-col items-center gap-3 flex-1">
                                            <div className="w-32 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm p-3">
                                                <img
                                                    src="/Wave.png"
                                                    alt="Wave"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">Modem Pay</p>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border-[6px] border-[#008080]" />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-base rounded-xl font-medium">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleTopUp}
                                    disabled={isLoading}
                                    className="w-full py-5 bg-[#008080] hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-xl rounded-2xl shadow-xl shadow-teal-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={24} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Pay with Wave
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
