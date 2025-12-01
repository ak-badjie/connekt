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
 * Note: Placeholder images are used. Replace with actual assets:
 * - /legal/connekt-logo.svg
 * - /legal/gambian-coat-of-arms.svg  
 * - /legal/gambian-flag.svg
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
                        {/* TODO: Replace with actual Connekt logo */}
                        <div
                            className="rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold"
                            style={{ width: itemSize, height: itemSize }}
                        >
                            <span className="text-xl">C</span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Connekt</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Gambia Platform</p>
                        </div>
                    </div>
                )}

                {/* Center: Gambian Coat of Arms */}
                {showCoatOfArms && (
                    <div className="flex flex-col items-center">
                        {/* TODO: Replace with actual Gambian Coat of Arms SVG */}
                        <div
                            className="rounded-full bg-gradient-to-br from-red-600 via-blue-600 to-green-600 flex items-center justify-center shadow-lg"
                            style={{ width: itemSize, height: itemSize }}
                        >
                            <div className="w-2/3 h-2/3 bg-white rounded-full flex items-center justify-center">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="text-blue-600"
                                >
                                    <path
                                        d="M12 2L2 7v6c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 hidden sm:block">
                            Republic of The Gambia
                        </p>
                    </div>
                )}

                {/* Right: Gambian Flag */}
                {showGambianFlag && (
                    <div className="flex items-center gap-2">
                        {/* TODO: Replace with actual Gambian flag image */}
                        <div
                            className="border border-gray-300 shadow-md overflow-hidden"
                            style={{ width: itemSize * 1.5, height: itemSize }}
                        >
                            {/* Gambian flag stripes: Red, Blue (with white borders), Green */}
                            <div className="flex flex-col h-full">
                                <div className="flex-1 bg-red-600"></div>
                                <div className="h-0.5 bg-white"></div>
                                <div className="flex-[2] bg-blue-600"></div>
                                <div className="h-0.5 bg-white"></div>
                                <div className="flex-1 bg-green-600"></div>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Under</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Gambian Law</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Legal Disclaimer Bar */}
            <div className="bg-gray-200 dark:bg-gray-800 px-8 py-2 print:bg-gray-100">
                <p className="text-xs text-center text-gray-700 dark:text-gray-300">
                    This is a legally binding contract registered under the laws of the Republic of The Gambia
                    {' '}• Enforced by Connekt Platform
                </p>
            </div>
        </div>
    );
}
