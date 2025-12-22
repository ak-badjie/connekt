'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
    useEffect(() => {
        // Close the window after a short delay
        const timer = setTimeout(() => {
            if (window.opener) {
                // Post success message to parent just in case real-time listener is slow
                window.opener.postMessage({ type: 'PAYMENT_COMPLETE' }, window.location.origin);
                window.close();
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
            <div className="text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Successful!
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    This window will close automatically...
                </p>
            </div>
        </div>
    );
}
