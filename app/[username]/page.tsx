'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/components/profile/UserProfile';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ProfileService } from '@/lib/services/profile-service';
import { ExtendedUserProfile } from '@/lib/types/profile.types';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState<ExtendedUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extract username (remove @ if present)
    const rawUsername = params.username as string;
    const username = rawUsername?.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    useEffect(() => {
        async function fetchUser() {
            if (!username) return;

            try {
                // Try to get extended profile first
                let profile = await ProfileService.getUserProfileByUsername(username);

                // If no extended profile, fall back to basic user data and initialize
                if (!profile) {
                    // Get UID from username mapping
                    const usernameRef = doc(db, 'usernames', username.toLowerCase());
                    const usernameSnap = await getDoc(usernameRef);

                    if (!usernameSnap.exists()) {
                        setError('User not found');
                        setLoading(false);
                        return;
                    }

                    const { uid } = usernameSnap.data();

                    // Get basic user data
                    const userRef = doc(db, 'users', uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        setError('User profile not found');
                        setLoading(false);
                        return;
                    }

                    const userData = userSnap.data();

                    // Initialize extended profile
                    await ProfileService.initializeUserProfile(uid, {
                        ...userData,
                        username,
                    });

                    // Fetch the newly created profile
                    profile = await ProfileService.getUserProfile(uid);
                }

                if (profile) {
                    setProfileUser(profile);
                    // Update stats in background
                    ProfileService.updateProfileStats(profile.uid);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [username]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (error || !profileUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400">The user @{username} does not exist.</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-6 py-2 bg-[#008080] text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    const isOwner = currentUser?.uid === profileUser.uid;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            <UserProfile user={profileUser} isOwner={isOwner} />
        </div>
    );
}
