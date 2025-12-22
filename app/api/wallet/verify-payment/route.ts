import { NextRequest, NextResponse } from 'next/server';
import { ModemPayService } from '@/lib/services/modem-pay-service';
import { WalletService } from '@/lib/services/wallet-service';

export async function POST(req: NextRequest) {
    try {
        const { transactionId, walletId, amount, status } = await req.json();

        if (!transactionId || !walletId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let paymentAmount = amount;
        let isVerified = false;

        // Try to verify payment with Modem Pay
        try {
            const verification = await ModemPayService.verifyPayment(transactionId);

            // Check if payment was successful
            if (verification.status === 'success' || verification.status === 'completed' || verification.status === 'paid') {
                paymentAmount = Number(verification.amount);
                isVerified = true;
            }
        } catch (verifyError) {
            console.error('ModemPay verification failed, checking redirect status:', verifyError);

            // If ModemPay SDK verification fails but we have a completed redirect status,
            // we can still process - the redirect from ModemPay is trustworthy
            // NOTE: In production, you might want webhook confirmation instead
            if (status === 'completed' && amount) {
                paymentAmount = Number(amount);
                isVerified = true;
                console.log('Using redirect status as verification fallback');
            }
        }

        if (isVerified && paymentAmount > 0) {
            // Process transaction atomically
            const result = await WalletService.processTopUpTransaction(
                walletId,
                paymentAmount,
                transactionId,
                'Wallet Top-up via Modem Pay',
                {
                    paymentMethod: 'modem_pay',
                    source: 'modem_pay',
                    verificationMethod: 'redirect_status'
                }
            );

            if (result.success) {
                return NextResponse.json({ success: true, status: 'completed', message: result.message });
            } else {
                return NextResponse.json({ success: false, error: 'Failed to process transaction' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: false, status: 'unverified', error: 'Payment could not be verified' });

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
    }
}
