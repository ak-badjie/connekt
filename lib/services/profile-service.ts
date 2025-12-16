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
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';
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

            // Get base user data for fallback/merging
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            const basicUserData = userDocSnap.exists() ? userDocSnap.data() : {};

            if (docSnap.exists()) {
                const profileData = docSnap.data();
                // MERGE: If profile bio/skills are missing, try to fill them from basic user data
                return {
                    ...profileData,
                    email: (basicUserData as any).email || (profileData as any).email,
                    photoURL: (profileData as any).photoURL || (basicUserData as any).photoURL,
                    bio: (profileData as any).bio || (basicUserData as any).bio || '',
                    skills: ((profileData as any).skills && (profileData as any).skills.length > 0)
                        ? (profileData as any).skills
                        : ((basicUserData as any).skills || []),
                    uid: uid // Ensure UID is always present
                } as ExtendedUserProfile;
            }

            // Fallback: If no profile doc exists, return constructed one from 'users'
            if (userDocSnap.exists()) {
                return {
                    uid,
                    ...basicUserData,
                    // Ensure arrays are initialized
                    experience: [],
                    education: [],
                    certifications: [],
                    portfolio: [],
                    customSections: [],
                    skills: (basicUserData as any).skills || [],
                    bio: (basicUserData as any).bio || '',
                    stats: (basicUserData as any).stats || defaultProfileStats,
                    privacySettings: (basicUserData as any).privacySettings || defaultPrivacySettings
                } as ExtendedUserProfile;
            }

            return null;
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
                coverImage: basicData.coverImage || null,
                role: basicData.role,
                bio: basicData.bio || '',
                title: basicData.title || (basicData.role === 'recruiter' ? 'Recruiter' : 'Virtual Assistant'),
                skills: basicData.skills || [],
                location: basicData.location || '',
                experience: [],
                education: [],
                certifications: [],
                portfolio: [],
                socialLinks: {},
                stats: defaultProfileStats,
                privacySettings: defaultPrivacySettings,
                sectionOrder: [
                    { sectionId: 'video_intro', type: 'default', order: 0 },
                    { sectionId: 'experience', type: 'default', order: 1 },
                    { sectionId: 'education', type: 'default', order: 2 },
                    { sectionId: 'projects', type: 'default', order: 3 },
                    { sectionId: 'reviews', type: 'default', order: 4 }
                ],
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

            // Update user_profiles collection
            await this.updateUserProfile(uid, { photoURL: downloadURL });

            // Also update users collection
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, { photoURL: downloadURL }, { merge: true });

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
    async uploadVideoIntro(
        uid: string,
        file: File,
        onProgress?: (info: { progress: number; bytesTransferred: number; totalBytes: number; state: string }) => void,
        options?: { mailAddress?: string; username?: string }
    ): Promise<string | null> {
        try {
            const profile = await this.getUserProfile(uid);
            const previousBytes = profile?.videoIntroBytes ?? 0;
            const previousUrl = profile?.videoIntro;

            const mailAddress = options?.mailAddress ?? (options?.username ? `${options.username}@connekt.com` : undefined);

            if (mailAddress && options?.username) {
                const existingQuota = await StorageQuotaService.getStorageQuota(mailAddress);
                if (!existingQuota) {
                    await StorageQuotaService.initializeUserStorage(uid, options.username);
                }
            }

            const requiredSpace = previousBytes > 0 ? Math.max(file.size - previousBytes, 0) : file.size;
            if (mailAddress && requiredSpace > 0) {
                const ok = await StorageQuotaService.checkStorageAvailable(mailAddress, requiredSpace);
                if (!ok) throw new Error('Not enough storage space available for this upload.');
            }

            // Use a stable path so replacing the intro video overwrites the same object.
            const filePath = `profiles/users/${uid}/videos/intro`;
            const storageRef = ref(storage, filePath);

            await new Promise<void>((resolve, reject) => {
                const uploadTask = uploadBytesResumable(storageRef, file, {
                    contentType: file.type || undefined,
                });

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        if (!onProgress) return;
                        const progress = snapshot.totalBytes > 0
                            ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                            : 0;
                        onProgress({
                            progress,
                            bytesTransferred: snapshot.bytesTransferred,
                            totalBytes: snapshot.totalBytes,
                            state: snapshot.state,
                        });
                    },
                    (error) => reject(error),
                    () => resolve()
                );
            });

            const downloadURL = await getDownloadURL(storageRef);

            // Update profile (track bytes so storage accounting stays correct on replace)
            await this.updateUserProfile(uid, { videoIntro: downloadURL, videoIntroBytes: file.size });

            // Best-effort cleanup of any previous object if it lives at a different path.
            if (previousUrl) {
                try {
                    const oldRef = ref(storage, previousUrl);
                    if (oldRef.fullPath !== storageRef.fullPath) {
                        await deleteObject(oldRef);
                    }
                } catch {
                    // ignore
                }
            }

            // Update ConnektStorage usage
            if (mailAddress) {
                if (previousBytes > 0) {
                    await StorageQuotaService.adjustStorageUsage(mailAddress, file.size - previousBytes, 0, false);
                } else {
                    await StorageQuotaService.updateStorageUsage(mailAddress, file.size, false);
                }
            }

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

    /**
     * Upload review media
     */
    async uploadReviewMedia(uid: string, file: File): Promise<ProfileMedia | null> {
        try {
            const mediaId = `media_${Date.now()}`;
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/reviews/${mediaId}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            return {
                id: mediaId,
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url: downloadURL,
                size: file.size,
                mimeType: file.type,
                uploadedAt: Timestamp.now(),
            };
        } catch (error) {
            console.error('Error uploading review media:', error);
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
    async addRating(toUserId: string, fromUserId: string, rating: number, review?: string, projectId?: string, media?: ProfileMedia[]): Promise<boolean> {
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
                media: media || [],
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
            let tasksCompleted = 0;
            if (profile.username) {
                const tasksQuery = query(
                    collection(db, 'tasks'),
                    where('assignee', '==', profile.username),
                    where('status', 'in', ['done', 'paid'])
                );
                const tasksSnap = await getDocs(tasksQuery);
                tasksCompleted = tasksSnap.size;
            }

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

    // ==========================================
    // CUSTOM SECTIONS
    // ==========================================

    /**
     * Add custom section to profile
     */
    async addCustomSection(uid: string, section: Omit<any, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return null;

            const sectionId = `section_${Date.now()}`;
            const newSection = {
                ...section,
                id: sectionId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                customSections: arrayUnion(newSection),
                updatedAt: serverTimestamp(),
            });

            return sectionId;
        } catch (error) {
            console.error('Error adding custom section:', error);
            return null;
        }
    },

    /**
     * Update custom section
     */
    async updateCustomSection(uid: string, sectionId: string, updates: any): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile || !profile.customSections) return false;

            const updatedSections = profile.customSections.map(section =>
                section.id === sectionId ? { ...section, ...updates, updatedAt: serverTimestamp() } : section
            );

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                customSections: updatedSections,
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error updating custom section:', error);
            return false;
        }
    },

    /**
     * Delete custom section
     */
    async deleteCustomSection(uid: string, sectionId: string): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile || !profile.customSections) return false;

            const sectionToDelete = profile.customSections.find(s => s.id === sectionId);
            if (!sectionToDelete) return false;

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                customSections: arrayRemove(sectionToDelete),
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error deleting custom section:', error);
            return false;
        }
    },

    /**
     * Reorder sections
     */
    async updateSectionOrder(uid: string, sectionOrder: any[]): Promise<boolean> {
        try {
            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                sectionOrder,
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error updating section order:', error);
            return false;
        }
    },

    // ==========================================
    // REFERRALS
    // ==========================================

    /**
     * Add referral/endorsement to profile
     */
    async addReferral(toUserId: string, fromUserId: string, data: { relationship: string; endorsement: string; skills?: string[] }): Promise<boolean> {
        try {
            const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
            const fromUserData = fromUserDoc.data();

            const referral = {
                id: `ref_${Date.now()}`,
                fromUserId,
                fromUserName: fromUserData?.displayName || 'Anonymous',
                fromUserPhoto: fromUserData?.photoURL,
                relationship: data.relationship,
                endorsement: data.endorsement,
                skills: data.skills || [],
                createdAt: serverTimestamp(),
            };

            const docRef = doc(db, 'user_profiles', toUserId);
            await updateDoc(docRef, {
                referrals: arrayUnion(referral),
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error adding referral:', error);
            return false;
        }
    },

    /**
     * Delete referral
     */
    async deleteReferral(uid: string, referralId: string): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile || !profile.referrals) return false;

            const referralToDelete = profile.referrals.find(r => r.id === referralId);
            if (!referralToDelete) return false;

            const docRef = doc(db, 'user_profiles', uid);
            await updateDoc(docRef, {
                referrals: arrayRemove(referralToDelete),
                updatedAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error('Error deleting referral:', error);
            return false;
        }
    },

    // ==========================================
    // PROJECT & TASK SYNC
    // ==========================================

    /**
     * Get user's projects for profile display (with privacy filtering)
     */
    async getUserProjects(uid: string, includePrivate: boolean = false): Promise<any[]> {
        try {
            if (!uid) return [];

            const projectsQuery = query(
                collection(db, 'projects'),
                where('ownerId', '==', uid)
            );
            const projectsSnap = await getDocs(projectsQuery);

            const projects = projectsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Filter based on privacy if needed
            // This would be further filtered on the frontend based on viewer auth status
            return projects;
        } catch (error) {
            console.error('Error getting user projects:', error);
            return [];
        }
    },

    /**
     * Get user's tasks for profile display (with privacy filtering)
     */
    async getUserTasks(username: string, includePrivate: boolean = false): Promise<any[]> {
        try {
            if (!username) return [];

            const tasksQuery = query(
                collection(db, 'tasks'),
                where('assignee', '==', username),
                where('status', 'in', ['done', 'paid'])
            );
            const tasksSnap = await getDocs(tasksQuery);

            const tasks = tasksSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            return tasks;
        } catch (error) {
            console.error('Error getting user tasks:', error);
            return [];
        }
    },

    // ==========================================
    // PRIVACY-AWARE DATA FETCHING
    // ==========================================

    /**
     * Get profile data with privacy filtering
     * @param uid - User ID
     * @param viewerUid - Viewer's User ID (null if not authenticated)
     * @param isOwner - Whether viewer is the profile owner
     */
    async getProfileWithPrivacy(uid: string, viewerUid: string | null, isOwner: boolean): Promise<any | null> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) return null;

            const privacySettings = profile.privacySettings;
            const isAuthenticated = viewerUid !== null;

            // Helper to check visibility
            const canView = (setting: 'public' | 'authenticated' | 'private') => {
                if (isOwner) return true;
                if (setting === 'public') return true;
                if (setting === 'authenticated' && isAuthenticated) return true;
                return false;
            };

            // Filter profile data based on privacy settings
            const filteredProfile = {
                ...profile,
                email: canView(privacySettings.showEmail) ? profile.email : undefined,
                phone: canView(privacySettings.showPhone) ? profile.phone : undefined,
                experience: canView(privacySettings.showExperience) ? profile.experience : [],
                education: canView(privacySettings.showEducation) ? profile.education : [],
                location: canView(privacySettings.showLocation) ? profile.location : undefined,
                socialLinks: canView(privacySettings.showSocialLinks) ? profile.socialLinks : {},
                referrals: canView(privacySettings.showReferrals) ? profile.referrals : [],
                // Projects and tasks visibility will be handled by separate queries
            };

            return filteredProfile;
        } catch (error) {
            console.error('Error getting profile with privacy:', error);
            return null;
        }
    },

    /**
     * Increment profile views
     */
    async incrementProfileViews(uid: string): Promise<boolean> {
        try {
            const docRef = doc(db, 'user_profiles', uid);
            const profile = await this.getUserProfile(uid);

            if (profile) {
                await updateDoc(docRef, {
                    'stats.profileViews': (profile.stats.profileViews || 0) + 1,
                });
            }

            return true;
        } catch (error) {
            console.error('Error incrementing profile views:', error);
            return false;
        }
    },
};
