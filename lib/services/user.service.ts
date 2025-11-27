import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const UserService = {
    async createProfile(uid: string, data: any) {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    async checkUsernameAvailability(username: string) {
        const docRef = doc(db, 'usernames', username.toLowerCase());
        const docSnap = await getDoc(docRef);
        return !docSnap.exists();
    },

    async claimUsername(uid: string, username: string) {
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
            uid
        });
    },

    async markIntroSeen(uid: string) {
        await updateDoc(doc(db, 'users', uid), {
            introSeen: true
        });
    }
};
