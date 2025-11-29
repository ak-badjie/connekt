import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { ProfileMedia } from '@/lib/types/profile.types';
import { Timestamp } from 'firebase/firestore';

export interface UploadProgress {
    progress: number;
    url?: string;
    error?: string;
}

export const ProfileMediaService = {
    /**
     * Upload profile picture
     * @param uid - User ID
     * @param file - Image file
     * @returns Promise with download URL
     */
    async uploadProfilePicture(uid: string, file: File): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/profile-picture.${fileExt}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            return null;
        }
    },

    /**
     * Upload cover/background image
     * @param uid - User ID
     * @param file - Image file
     * @returns Promise with download URL
     */
    async uploadCoverImage(uid: string, file: File): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/cover-image.${fileExt}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading cover image:', error);
            return null;
        }
    },

    /**
     * Upload video intro with progress tracking
     * @param uid - User ID
     * @param file - Video file
     * @param onProgress - Progress callback
     * @returns Promise with download URL
     */
    async uploadVideoIntro(
        uid: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/videos/intro.${fileExt}`;
            const storageRef = ref(storage, filePath);

            if (onProgress) {
                return new Promise((resolve, reject) => {
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            onProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            } else {
                await uploadBytes(storageRef, file);
                return await getDownloadURL(storageRef);
            }
        } catch (error) {
            console.error('Error uploading video intro:', error);
            return null;
        }
    },

    /**
     * Upload portfolio media (image or video)
     * @param uid - User ID
     * @param file - Media file
     * @param metadata - Optional metadata (title, description)
     * @param onProgress - Optional progress callback
     * @returns Promise with ProfileMedia object
     */
    async uploadPortfolioMedia(
        uid: string,
        file: File,
        metadata?: { title?: string; description?: string },
        onProgress?: (progress: number) => void
    ): Promise<ProfileMedia | null> {
        try {
            const mediaId = `media_${Date.now()}`;
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/portfolio/${mediaId}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            let downloadURL: string;

            if (onProgress) {
                downloadURL = await new Promise((resolve, reject) => {
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            onProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(url);
                        }
                    );
                });
            } else {
                await uploadBytes(storageRef, file);
                downloadURL = await getDownloadURL(storageRef);
            }

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

            return media;
        } catch (error) {
            console.error('Error uploading portfolio media:', error);
            return null;
        }
    },

    /**
     * Upload project-specific media
     * @param uid - User ID
     * @param projectId - Project ID
     * @param file - Media file
     * @param onProgress - Optional progress callback
     * @returns Promise with ProfileMedia object
     */
    async uploadProjectMedia(
        uid: string,
        projectId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ProfileMedia | null> {
        try {
            const mediaId = `media_${Date.now()}`;
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/projects/${projectId}/${mediaId}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            let downloadURL: string;

            if (onProgress) {
                downloadURL = await new Promise((resolve, reject) => {
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            onProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(url);
                        }
                    );
                });
            } else {
                await uploadBytes(storageRef, file);
                downloadURL = await getDownloadURL(storageRef);
            }

            const media: ProfileMedia = {
                id: mediaId,
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url: downloadURL,
                size: file.size,
                mimeType: file.type,
                uploadedAt: Timestamp.now(),
            };

            return media;
        } catch (error) {
            console.error('Error uploading project media:', error);
            return null;
        }
    },

    /**
     * Upload experience media
     * @param uid - User ID
     * @param experienceId - Experience ID
     * @param file - Media file
     * @param onProgress - Optional progress callback
     * @returns Promise with ProfileMedia object
     */
    async uploadExperienceMedia(
        uid: string,
        experienceId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ProfileMedia | null> {
        try {
            const mediaId = `media_${Date.now()}`;
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/users/${uid}/experience/${experienceId}/${mediaId}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            let downloadURL: string;

            if (onProgress) {
                downloadURL = await new Promise((resolve, reject) => {
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            onProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(url);
                        }
                    );
                });
            } else {
                await uploadBytes(storageRef, file);
                downloadURL = await getDownloadURL(storageRef);
            }

            const media: ProfileMedia = {
                id: mediaId,
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url: downloadURL,
                size: file.size,
                mimeType: file.type,
                uploadedAt: Timestamp.now(),
            };

            return media;
        } catch (error) {
            console.error('Error uploading experience media:', error);
            return null;
        }
    },

    /**
     * Delete media from storage
     * @param url - Download URL of the file
     */
    async deleteMedia(url: string): Promise<boolean> {
        try {
            const fileRef = ref(storage, url);
            await deleteObject(fileRef);
            return true;
        } catch (error) {
            console.error('Error deleting media:', error);
            return false;
        }
    },

    /**
     * Validate file type for profile media
     * @param file - File to validate
     * @returns true if valid, false otherwise
     */
    validateFileType(file: File): boolean {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

        return validImageTypes.includes(file.type) || validVideoTypes.includes(file.type);
    },

    /**
     * Validate file size
     * @param file - File to validate
     * @param maxSizeMB - Maximum size in MB
     * @returns true if valid, false otherwise
     */
    validateFileSize(file: File, maxSizeMB: number = 100): boolean {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    /**
     * Format file size for display
     * @param bytes - File size in bytes
     * @returns Formatted string (e.g., "2.5 MB")
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },
};
