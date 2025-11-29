import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';

export interface UploadProgress {
    progress: number;
    url?: string;
    error?: string;
}

export type AttachmentType = 'image' | 'video' | 'document' | 'link';

export interface Attachment {
    id: string;
    type: AttachmentType;
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
    thumbnailUrl?: string;
}

export const StorageService = {
    /**
     * Upload a file to Firebase Storage
     * @param file - The file to upload
     * @param userId - The user ID
     * @param mailId - The mail ID (optional, for organization)
     * @param onProgress - Callback for upload progress
     * @returns Promise with the download URL
     */
    async uploadFile(
        file: File,
        userId: string,
        mailId: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = `mail-attachments/${userId}/${mailId}/${fileName}`;
        const storageRef = ref(storage, filePath);

        if (onProgress) {
            // Use uploadBytesResumable for progress tracking
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
            // Simple upload without progress
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        }
    },

    /**
     * Delete a file from Firebase Storage
     * @param url - The download URL of the file
     */
    async deleteFile(url: string): Promise<void> {
        try {
            const fileRef = ref(storage, url);
            await deleteObject(fileRef);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    },

    /**
     * Validate file type
     * @param file - The file to validate
     * @returns The attachment type or null if invalid
     */
    validateFileType(file: File): AttachmentType | null {
        const mimeType = file.type;

        // Images
        if (mimeType.startsWith('image/')) {
            return 'image';
        }

        // Videos
        if (mimeType.startsWith('video/')) {
            return 'video';
        }

        // Documents
        const documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv'
        ];

        if (documentTypes.includes(mimeType)) {
            return 'document';
        }

        return null;
    },

    /**
     * Validate file size
     * @param file - The file to validate
     * @param maxSizeMB - Maximum size in MB (default: 25MB)
     * @returns true if valid, false otherwise
     */
    validateFileSize(file: File, maxSizeMB: number = 25): boolean {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    /**
     * Get file icon based on type
     * @param mimeType - The MIME type of the file
     * @returns Icon name from lucide-react
     */
    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'Image';
        if (mimeType.startsWith('video/')) return 'Video';
        if (mimeType.includes('pdf')) return 'FileText';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Sheet';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentation';
        return 'File';
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

    /**
     * Create an attachment object from a file and URL
     * @param file - The uploaded file
     * @param url - The download URL
     * @returns Attachment object
     */
    createAttachment(file: File, url: string): Attachment {
        const type = this.validateFileType(file);

        return {
            id: Date.now().toString(),
            type: type || 'document',
            name: file.name,
            url: url,
            size: file.size,
            mimeType: file.type,
            thumbnailUrl: type === 'image' ? url : undefined
        };
    },

    /**
     * Create a link attachment
     * @param url - The link URL
     * @param name - Optional name for the link
     * @returns Attachment object
     */
    createLinkAttachment(url: string, name?: string): Attachment {
        return {
            id: Date.now().toString(),
            type: 'link',
            name: name || url,
            url: url
        };
    }
};
