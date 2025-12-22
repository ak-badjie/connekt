import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle } from 'lucide-react';
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
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const popupRef = useRef<Window | null>(null);
    const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Listen for messages from popup window
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify origin for security
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'PAYMENT_COMPLETE') {
                setPaymentStatus('success');
                setIsLoading(false);

                // Close popup if still open
                if (popupRef.current && !popupRef.current.closed) {
                    popupRef.current.close();
                }

                // Notify parent
                onPaymentComplete?.();

                // Close modal after short delay
                setTimeout(() => {
                    onClose();
                    setPaymentStatus('idle');
                    setAmount('');
                }, 2000);
            } else if (event.data?.type === 'PAYMENT_ERROR') {
                setPaymentStatus('error');
                setError(event.data.error || 'Payment failed');
                setIsLoading(false);

                if (popupRef.current && !popupRef.current.closed) {
                    popupRef.current.close();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onClose, onPaymentComplete]);

    // Check if popup was closed manually
    useEffect(() => {
        if (paymentStatus === 'pending' && popupRef.current) {
            popupCheckInterval.current = setInterval(() => {
                if (popupRef.current?.closed) {
                    setPaymentStatus('idle');
                    setIsLoading(false);
                    if (popupCheckInterval.current) {
                        clearInterval(popupCheckInterval.current);
                    }
                }
            }, 500);
        }

        return () => {
            if (popupCheckInterval.current) {
                clearInterval(popupCheckInterval.current);
            }
        };
    }, [paymentStatus]);

    const handleTopUp = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError(null);
        setPaymentStatus('pending');

        try {
            // Build return URL to our verification page
            const returnUrl = `${window.location.origin}/payment/verify?walletId=${walletId}&amount=${amount}`;

            const response = await fetch('/api/wallet/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    walletId,
                    returnUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate payment');
            }

            const { paymentUrl } = data;

            if (!paymentUrl) {
                throw new Error('No payment URL received from server');
            }

            // Open Modem Pay in popup window (OAuth-style)
            const popupWidth = 500;
            const popupHeight = Math.round(window.innerHeight * 0.7);
            const left = window.screenX + (window.outerWidth - popupWidth) / 2;
            const top = window.screenY + (window.outerHeight - popupHeight) / 2;

            popupRef.current = window.open(
                paymentUrl,
                'ModemPayPayment',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popupRef.current) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }

            // Close the modal immediately so user can see real-time balance updates
            onClose();

        } catch (err: any) {
            console.error('Top up error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setPaymentStatus('error');
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
                        onClick={paymentStatus !== 'pending' ? onClose : undefined}
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
                                    disabled={paymentStatus === 'pending'}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>

                            {paymentStatus === 'success' ? (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4"
                                    >
                                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        Payment Successful!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Your wallet has been credited with GMD {Number(amount).toFixed(2)}
                                    </p>
                                </div>
                            ) : (
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
                                                disabled={paymentStatus === 'pending'}
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

                                    {paymentStatus === 'pending' && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-base rounded-xl font-medium text-center">
                                            Complete payment in the popup window...
                                        </div>
                                    )}

                                    <button
                                        onClick={handleTopUp}
                                        disabled={isLoading || paymentStatus === 'pending'}
                                        className="w-full py-5 bg-[#008080] hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-xl rounded-2xl shadow-xl shadow-teal-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        {isLoading || paymentStatus === 'pending' ? (
                                            <>
                                                <Loader2 className="animate-spin" size={24} />
                                                {paymentStatus === 'pending' ? 'Waiting for payment...' : 'Processing...'}
                                            </>
                                        ) : (
                                            <>
                                                Pay with Wave
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
