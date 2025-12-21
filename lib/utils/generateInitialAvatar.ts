/**
 * Utility to generate initial-based avatars for workspaces
 * Creates consistent colored avatars based on workspace name
 */

// Color palette for avatar backgrounds - using professional colors
const AVATAR_COLORS = [
    '#059669', // emerald
    '#0891B2', // cyan
    '#7C3AED', // violet
    '#DB2777', // pink
    '#EA580C', // orange
    '#4F46E5', // indigo
    '#0D9488', // teal
    '#9333EA', // purple
    '#2563EB', // blue
    '#DC2626', // red
];

/**
 * Generate a consistent color based on string hash
 */
function getColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

/**
 * Get initials from a name (up to 2 characters)
 */
export function getInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate an SVG data URL for an initial-based avatar
 */
export function generateInitialAvatar(name: string, size: number = 64): string {
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);
    const fontSize = size * 0.4;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${bgColor}"/>
            <text 
                x="50%" 
                y="50%" 
                dominant-baseline="central" 
                text-anchor="middle" 
                fill="white" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-weight="600" 
                font-size="${fontSize}px"
            >${initials}</text>
        </svg>
    `.trim().replace(/\s+/g, ' ');

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a circular avatar (for rounded display)
 */
export function generateCircularInitialAvatar(name: string, size: number = 64): string {
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);
    const fontSize = size * 0.4;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bgColor}"/>
            <text 
                x="50%" 
                y="50%" 
                dominant-baseline="central" 
                text-anchor="middle" 
                fill="white" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-weight="600" 
                font-size="${fontSize}px"
            >${initials}</text>
        </svg>
    `.trim().replace(/\s+/g, ' ');

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Check if a URL is a valid image URL (not a generated avatar)
 */
export function isValidImageUrl(url?: string): boolean {
    if (!url) return false;
    if (url.startsWith('data:image/svg+xml')) return false; // generated avatar
    if (url === '/default-avatar.png') return false;
    if (url === '/default-group.png') return false;
    return true;
}

/**
 * Get display avatar - returns actual image if valid, otherwise generates initial avatar
 */
export function getDisplayAvatar(
    imageUrl: string | undefined,
    name: string,
    circular: boolean = true
): string {
    if (isValidImageUrl(imageUrl)) {
        return imageUrl!;
    }
    return circular
        ? generateCircularInitialAvatar(name)
        : generateInitialAvatar(name);
}
