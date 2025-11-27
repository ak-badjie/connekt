import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { code, uid } = await req.json();

        // 1. Find the invite code document
        const inviteRef = doc(db, 'admin_invites', code);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        const inviteData = inviteSnap.data();

        // Check if already used
        if (inviteData.isUsed) {
            return NextResponse.json({ error: 'Code already used' }, { status: 400 });
        }

        const subRole = inviteData.subRole || inviteData.role;

        // 2. Update User Profile with Admin Role
        await setDoc(doc(db, 'users', uid), {
            role: 'admin',
            subRole: subRole,
            onboardingCompleted: true, // Admins skip onboarding
            introSeen: true, // Admins skip intro
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 3. Mark Code as Used
        await updateDoc(inviteRef, {
            isUsed: true,
            usedBy: uid,
            usedAt: serverTimestamp()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Admin consume-code error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
