'use client';

interface ConnektWalletLogoProps {
    size?: 'small' | 'medium' | 'large';
}

export default function ConnektWalletLogo({ size = 'medium' }: ConnektWalletLogoProps) {
    // Dimensions based on size
    const svgSizes = {
        small: 32,
        medium: 48,
        large: 96
    };

    const svgSize = svgSizes[size];
    const containerSize = size === 'large' ? 'w-32 h-32' : size === 'medium' ? 'w-16 h-16' : 'w-12 h-12';

    return (
        <div className={`relative ${containerSize} flex items-center justify-center`}>
            <svg
                width={svgSize}
                height={svgSize}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="print:fill-[#008080]"
            >
                <path
                    fill="#008080"
                    d="M19,7H18V6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,6H2V18a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V10A3,3,0,0,0,19,7ZM5,5H15a1,1,0,0,1,1,1V7H5A1,1,0,0,1,5,5ZM20,15H19a1,1,0,0,1,0-2h1Zm0-4H19a3,3,0,0,0,0,6h1v1a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V8.83A3,3,0,0,0,5,9H19a1,1,0,0,1,1,1Z"
                />
            </svg>
        </div>
    );
}
