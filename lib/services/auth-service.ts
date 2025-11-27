import { auth, googleProvider } from '@/lib/firebase';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    User
} from 'firebase/auth';
import { FirestoreService } from './firestore-service';

export const AuthService = {
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // Check if profile exists, if not create basic one
            const profile = await FirestoreService.getUserProfile(result.user.uid);
            if (!profile) {
                await FirestoreService.createUserProfile(result.user.uid, {
                    email: result.user.email ?? undefined,
                    displayName: result.user.displayName ?? undefined,
                    photoURL: result.user.photoURL ?? undefined,
                    role: 'va',
                    onboardingCompleted: false
                });
            }
            return result.user;
        } catch (error) {
            throw error;
        }
    },

    async loginWithEmail(email: string, pass: string) {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    },

    async registerWithEmail(email: string, pass: string, role?: 'employer' | 'va') {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await FirestoreService.createUserProfile(result.user.uid, {
            email: result.user.email ?? undefined,
            role: role || 'va',
            onboardingCompleted: false
        });
        return result.user;
    },

    async logout() {
        return firebaseSignOut(auth);
    }
};
