import { db, storage } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    Timestamp,
    query,
    where,
    getDocs,
    orderBy,
    limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    ExtendedUserProfile,
    ExtendedAgencyProfile,
    RecruiterProfile,
    Experience,
    Education,
    Certification,
    ProfileMedia,
    Rating,
    PrivacySettings,
    SocialLinks,
    ProfileStats,
    defaultPrivacySettings,
    defaultProfileStats,
} from '@/lib/types/profile.types';

export const ProfileService = {
    // ==========================================
    // USER PROFILE
    // ==========================================

    /**
     * Get extended user profile
     */
    async getUserProfile(uid: string): Promise<ExtendedUserProfile | null> {
        try {
            const docRef = doc(db, 'user_profiles', uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            return docSnap.data() as ExtendedUserProfile;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    },

    /**
     * Get user profile by username
     */
    async getUserProfileByUsername(username: string): Promise<ExtendedUserProfile | null> {
        try {
            // Get UID from username mapping
            const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
            if (!usernameDoc.exists()) {
                return null;
            }

            const uid = usernameDoc.data().uid;
            return await this.getUserProfile(uid);
        } catch (error) {
            console.error('Error getting user profile by username:', error);
            return null;
        }
    },

    /**
     * Create or update user profile
     */
    async updateUserProfile(uid: string, data: Partial<ExtendedUserProfile>): Promise<boolean> {
        try {
            const docRef = doc(db, 'user_profiles', uid);
            await setDoc(docRef, {
                ...data,
                uid,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        }
    },

    /**
     * Initialize user profile with defaults
     */
    async initializeUserProfile(uid: string, basicData: any): Promise<boolean> {
        try {
            const profile: Partial<ExtendedUserProfile> = {
                uid,
                username: basicData.username,
                email: basicData.email,
                displayName: basicData.displayName,
                photoURL: basicData.photoURL,
                role: basicData.role,
                skills: basicData.skills || [],
                experience: [],
                education: [],
                certifications: [],
                portfolio: [],
                socialLinks: {},
                stats: defaultProfileStats,
                privacySettings: defaultPrivacySettings,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            return await this.updateUserProfile(uid, profile);
        } catch (error) {
            console.error('Error initializing user profile:', error);
            return false;
        }
    },

    // ==========================================
    // EXPERIENCE MANAGEMENT
    // ==========================================

    /**
     * Add experience to user profile
     */
    async addExperience(uid: string, experience: Omit<Experience, 'id'>): Promise<string | null> {
        try {
            const expId = `exp_${Date.now()}`;
            const newExperience: Experience = {
                ...experience,
                id: expId,
            };

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                experience: arrayUnion(newExperience),
                updatedAt: serverTimestamp(),
            });

            return expId;
        } catch (error) {
            console.error('Error adding experience:', error);
            return null;
        }
    },

    /**
     * Update experience entry
     */
    async updateExperience(uid: string, experienceId: string, updates: Partial<Experience>): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return false;

            const updatedExperience = profile.experience.map(exp =>
                exp.id === experienceId ? { ...exp, ...updates } : exp
            );

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                experience: updatedExperience,
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error updating experience:', error);
            return false;
        }
    },

    /**
     * Delete experience entry
     */
    async deleteExperience(uid: string, experienceId: string): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return false;

            const expToDelete = profile.experience.find(exp => exp.id === experienceId);
            if (!expToDelete) return false;

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                experience: arrayRemove(expToDelete),
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error deleting experience:', error);
            return false;
        }
    },

    // ==========================================
    // EDUCATION MANAGEMENT
    // ==========================================

    /**
     * Add education to user profile
     */
    async addEducation(uid: string, education: Omit<Education, 'id'>): Promise<string | null> {
        try {
            const eduId = `edu_${Date.now()}`;
            const newEducation: Education = {
                ...education,
                id: eduId,
            };

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                education: arrayUnion(newEducation),
                updatedAt: serverTimestamp(),
            });

            return eduId;
        } catch (error) {
            console.error('Error adding education:', error);
            return null;
        }
    },

    /**
     * Delete education entry
     */
    async deleteEducation(uid: string, educationId: string): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return false;

            const eduToDelete = profile.education.find(edu => edu.id === educationId);
            if (!eduToDelete) return false;

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                education: arrayRemove(eduToDelete),
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error deleting education:', error);
            return false;
        }
    },

    // ==========================================
    // MEDIA UPLOADS
    // ==========================================

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(uid: string, file: File): Promise<string | null> {
        try {
            const filePath = `profiles/users/${uid}/profile-picture.${file.name.split('.').pop()}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update profile
            await this.updateUserProfile(uid, { photoURL: downloadURL });

            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            return null;
        }
    },

    /**
     * Upload cover image
     */
    async uploadCoverImage(uid: string, file: File): Promise<string | null> {
        try {
            const filePath = `profiles/users/${uid}/cover-image.${file.name.split('.').pop()}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update profile
            await this.updateUserProfile(uid, { coverImage: downloadURL });

            return downloadURL;
        } catch (error) {
            console.error('Error uploading cover image:', error);
            return null;
        }
    },

    /**
     * Upload video intro
     */
    async uploadVideoIntro(uid: string, file: File, onProgress?: (progress: number) => void): Promise<string | null> {
        try {
            const filePath = `profiles/users/${uid}/videos/intro.${file.name.split('.').pop()}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update profile
            await this.updateUserProfile(uid, { videoIntro: downloadURL });

            return downloadURL;
        } catch (error) {
            console.error('Error uploading video intro:', error);
            return null;
        }
    },

    /**
     * Add portfolio media
     */
    async addPortfolioMedia(uid: string, file: File, metadata?: { title?: string; description?: string }): Promise<ProfileMedia | null> {
        try {
            const mediaId = `media_${Date.now()}`;
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/portfolio/${mediaId}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const media: ProfileMedia = {
                id: mediaId,
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url: downloadURL,
                title: metadata?.title,
                description: metadata?.description,
                size: file.size,
                mimeType: file.type,
                uploadedAt: Timestamp.now(),
            };

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                portfolio: arrayUnion(media),
                updatedAt: serverTimestamp(),
            });

            return media;
        } catch (error) {
            console.error('Error adding portfolio media:', error);
            return null;
        }
    },

    // ==========================================
    // PRIVACY SETTINGS
    // ==========================================

    /**
     * Update privacy settings
     */
    async updatePrivacySettings(uid: string, settings: Partial<PrivacySettings>): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return false;

            const updatedSettings = {
                ...profile.privacySettings,
                ...settings,
            };

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                privacySettings: updatedSettings,
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            return false;
        }
    },

    // ==========================================
    // RATINGS & REVIEWS
    // ==========================================

    /**
     * Add rating to a user
     */
    async addRating(toUserId: string, fromUserId: string, rating: number, review?: string, projectId?: string): Promise<boolean> {
        try {
            // Get from user info
            const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
            const fromUserData = fromUserDoc.data();

            const ratingData: Rating = {
                id: `rating_${Date.now()}`,
                fromUserId,
                fromUserName: fromUserData?.displayName || 'Anonymous',
                fromUserPhoto: fromUserData?.photoURL,
                rating,
                review,
                projectId,
                createdAt: Timestamp.now(),
            };

            const ratingsRef = collection(db, 'user_profiles', toUserId, 'ratings');
            await setDoc(doc(ratingsRef, ratingData.id), ratingData);

            // Update average rating
            await this.updateAverageRating(toUserId);

            return true;
        } catch (error) {
            console.error('Error adding rating:', error);
            return false;
        }
    },

    /**
     * Update average rating for a user
     */
    async updateAverageRating(uid: string): Promise<void> {
        try {
            const ratingsRef = collection(db, 'user_profiles', uid, 'ratings');
            const ratingsSnap = await getDocs(ratingsRef);

            let totalRating = 0;
            let count = 0;

            ratingsSnap.forEach(doc => {
                const data = doc.data() as Rating;
                totalRating += data.rating;
                count++;
            });

            const averageRating = count > 0 ? totalRating / count : 0;

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                'stats.averageRating': averageRating,
                'stats.totalRatings': count,
            });
        } catch (error) {
            console.error('Error updating average rating:', error);
        }
    },

    /**
     * Get ratings for a user
     */
    async getRatings(uid: string, limitCount: number = 10): Promise<Rating[]> {
        try {
            const ratingsRef = collection(db, 'user_profiles', uid, 'ratings');
            const q = query(ratingsRef, orderBy('createdAt', 'desc'), limit(limitCount));
            const ratingsSnap = await getDocs(q);

            return ratingsSnap.docs.map(doc => doc.data() as Rating);
        } catch (error) {
            console.error('Error getting ratings:', error);
            return [];
        }
    },

    // ==========================================
    // AGENCY PROFILE
    // ==========================================

    /**
     * Get extended agency profile
     */
    async getAgencyProfile(agencyId: string): Promise<ExtendedAgencyProfile | null> {
        try {
            const docRef = doc(db, 'agency_profiles', agencyId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            return docSnap.data() as ExtendedAgencyProfile;
        } catch (error) {
            console.error('Error getting agency profile:', error);
            return null;
        }
    },

    /**
     * Update agency profile
     */
    async updateAgencyProfile(agencyId: string, data: Partial<ExtendedAgencyProfile>): Promise<boolean> {
        try {
            const docRef = doc(db, 'agency_profiles', agencyId);
            await setDoc(docRef, {
                ...data,
                id: agencyId,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            return true;
        } catch (error) {
            console.error('Error updating agency profile:', error);
            return false;
        }
    },

    // ==========================================
    // STATISTICS
    // ==========================================

    /**
     * Calculate and update profile statistics
     */
    async updateProfileStats(uid: string): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return false;

            // Calculate time on platform
            const createdDate = profile.createdAt?.toDate ? profile.createdAt.toDate() : new Date();
            const timeOnPlatform = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

            // Get projects completed (from projects collection)
            const projectsQuery = query(
                collection(db, 'projects'),
                where('ownerId', '==', uid),
                where('status', '==', 'completed')
            );
            const projectsSnap = await getDocs(projectsQuery);
            const projectsCompleted = projectsSnap.size;

            // Get tasks completed
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('assignee', '==', profile.username),
                where('status', 'in', ['done', 'paid'])
            );
            const tasksSnap = await getDocs(tasksQuery);
            const tasksCompleted = tasksSnap.size;

            const stats: ProfileStats = {
                ...profile.stats,
                timeOnPlatform,
                projectsCompleted,
                tasksCompleted,
            };

            await this.updateUserProfile(uid, { stats });

            return true;
        } catch (error) {
            console.error('Error updating profile stats:', error);
            return false;
        }
    },
};
