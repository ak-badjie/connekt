import { NextRequest, NextResponse } from 'next/server';
import { ModemPayService } from '@/lib/services/modem-pay-service';
import { WalletService } from '@/lib/services/wallet-service';

export async function POST(req: NextRequest) {
    try {
        const { transactionId, walletId } = await req.json();

        if (!transactionId || !walletId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify payment with Modem Pay
        const verification = await ModemPayService.verifyPayment(transactionId);

        // Check if payment was successful
        // Note: Adjust status check based on actual SDK response structure
        if (verification.status === 'success' || verification.status === 'completed' || verification.status === 'paid') {

            // Process transaction atomically using the new service method
            // This handles idempotency (checking if referenceId exists) and updates balance + history in one transaction
            const result = await WalletService.processTopUpTransaction(
                walletId,
                Number(verification.amount),
                transactionId,
                'Wallet Top-up via Modem Pay',
                {
                    paymentMethod: verification.payment_method,
                    source: 'modem_pay',
                    gatewayId: verification.payment_method_id
                }
            );

            if (result.success) {
                return NextResponse.json({ success: true, status: 'completed', message: result.message });
            } else {
                return NextResponse.json({ success: false, error: 'Failed to process transaction' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: false, status: verification.status });

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
    }
}
