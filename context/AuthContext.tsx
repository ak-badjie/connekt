'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreService, UserProfile } from '@/lib/services/firestore-service';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const profile = await FirestoreService.getUserProfile(user.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
