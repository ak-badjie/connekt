'use client';

interface GambianLegalHeaderProps {
    size?: 'small' | 'medium' | 'large';
    showConnektLogo?: boolean;
    showCoatOfArms?: boolean;
    showGambianFlag?: boolean;
}

/**
 * Gambian Legal Header Component
 * 
 * Displays the official header for Connekt contract documents under Gambian law.
 * Includes Connekt logo, Gambian Coat of Arms, and Gambian flag.
 * 
 * Images used:
 * - /connekt-africa-logo.png
 * - /gambian_coat_of_arm.jpg  
 * - /gambian_flag.png
 */
export default function GambianLegalHeader({
    size = 'medium',
    showConnektLogo = true,
    showCoatOfArms = true,
    showGambianFlag = true
}: GambianLegalHeaderProps) {
    const sizeClasses = {
        small: 'h-16',
        medium: 'h-24',
        large: 'h-32'
    };

    const logoSize = {
        small: 48,
        medium: 64,
        large: 80
    };

    const containerHeight = sizeClasses[size];
    const itemSize = logoSize[size];

    return (
        <div className="w-full border-b-2 border-gray-300 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 print:bg-white">
            {/* Main Header */}
            <div className={`flex items-center justify-between px-8 ${containerHeight}`}>
                {/* Left: Connekt Logo */}
                {showConnektLogo && (
                    <div className="flex items-center gap-2">
                        <img
                            src="/connekt-africa-logo.png"
                            alt="Connekt Africa Logo"
                            style={{ width: itemSize, height: itemSize, objectFit: 'contain' }}
                            className="rounded-lg"
                        />
                    </div>
                )}

                {/* Center: Gambian Coat of Arms */}
                {showCoatOfArms && (
                    <div className="flex flex-col items-center">
                        <img
                            src="/gambian_coat_of_arm.jpg"
                            alt="Gambian Coat of Arms"
                            style={{ width: itemSize, height: itemSize, objectFit: 'contain' }}
                            className="rounded-lg shadow-lg"
                        />
                    </div>
                )}

                {/* Right: Gambian Flag */}
                {showGambianFlag && (
                    <div className="flex items-center gap-2">
                        <img
                            src="/gambian_flag.png"
                            alt="Gambian Flag"
                            style={{ width: itemSize * 1.5, height: itemSize, objectFit: 'cover' }}
                            className="border border-gray-300 shadow-md"
                        />
                    </div>
                )}
            </div>

            {/* Legal Disclaimer Bar */}

        </div>
    );
}
