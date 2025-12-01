import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/services/wallet-service';
import { ModemPayService } from '@/lib/services/modem-pay-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transaction_id, status, reference, amount } = body;

        // Verify the payment status with Modem Pay directly to ensure authenticity
        // This is a security best practice to avoid trusting the webhook payload blindly
        const verification = await ModemPayService.verifyPayment(transaction_id);

        if (verification.status === 'success' || verification.status === 'completed') {
            // Extract walletId from reference (assuming format topup_{walletId}_{timestamp})
            const parts = reference.split('_');
            // walletId might contain underscores, so we need to be careful
            // Format: topup_user_123_1634567890 -> parts: ['topup', 'user', '123', '1634567890']
            // Wallet ID is 'user_123'

            // A safer way is to store the transaction intent in DB first, but for now we parse
            const walletId = parts.slice(1, -1).join('_');

            if (walletId) {
                await WalletService.updateBalance(walletId, Number(amount));
                await WalletService.addTransaction(walletId, {
                    type: 'deposit',
                    amount: Number(amount),
                    currency: 'GMD', // Or dynamic
                    description: 'Wallet Top-up via Modem Pay (Wave)',
                    status: 'completed',
                    referenceId: transaction_id
                });

                return NextResponse.json({ received: true });
            }
        }

        return NextResponse.json({ received: true, status: 'ignored' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
