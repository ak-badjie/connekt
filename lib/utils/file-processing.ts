/**
 * File Processing Utilities for Resume Parser
 * Handles validation and base64 conversion for AI processing
 */

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

    return imageTypes.includes(file.type) ||
        imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Check if file is a supported document type
 */
export function isSupportedFile(file: File): boolean {
    const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic'
    ];

    const supportedExtensions = [
        '.pdf', '.doc', '.docx', '.txt',
        '.jpg', '.jpeg', '.png', '.webp', '.heic'
    ];

    return supportedTypes.includes(file.type) ||
        supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Convert file to base64 for AI processing
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to convert file to base64'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get MIME type for Gemini API
 */
export function getMimeType(file: File): string {
    // Map common types
    const mimeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain'
    };

    // Try to get from file type first
    if (file.type) return file.type;

    // Fallback to extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? (mimeMap[ext] || 'application/octet-stream') : 'application/octet-stream';
}

/**
 * Get file as data URL for preview
 */
export async function getFileDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
