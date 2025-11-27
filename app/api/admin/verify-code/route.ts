import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        // Query admin_invites by document ID (which is the code itself)
        const inviteRef = doc(db, 'admin_invites', code);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            return NextResponse.json({ valid: false });
        }

        const inviteData = inviteSnap.data();

        // Check if already used
        if (inviteData.isUsed) {
            return NextResponse.json({ valid: false });
        }

        return NextResponse.json({
            valid: true,
            subRole: inviteData.subRole || inviteData.role
        });

    } catch (error) {
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}
