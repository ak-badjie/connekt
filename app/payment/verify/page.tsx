'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentVerifyPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying payment...');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const transactionId = searchParams.get('transaction_id') || searchParams.get('reference');
                const walletId = searchParams.get('walletId');
                const amount = searchParams.get('amount');
                const paymentStatus = searchParams.get('status');

                if (!transactionId || !walletId) {
                    throw new Error('Missing payment information');
                }

                // Call verification API
                const response = await fetch('/api/wallet/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transactionId,
                        walletId,
                        amount: amount ? Number(amount) : undefined,
                        status: paymentStatus
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    setMessage('Payment successful! Your wallet has been credited.');

                    // Post message to parent window
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'PAYMENT_COMPLETE',
                            amount: data.amount || amount
                        }, window.location.origin);

                        // Auto-close after short delay
                        setTimeout(() => {
                            window.close();
                        }, 2000);
                    }
                } else {
                    throw new Error(data.error || 'Verification failed');
                }
            } catch (error: any) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage(error.message || 'Payment verification failed');

                // Post error to parent window
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'PAYMENT_ERROR',
                        error: error.message
                    }, window.location.origin);
                }
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 text-[#008080] animate-spin mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verifying Payment
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Please wait while we confirm your payment...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500 mt-4">
                            This window will close automatically...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verification Failed
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {message}
                        </p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Close Window
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
