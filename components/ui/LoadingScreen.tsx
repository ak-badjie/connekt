'use client';

import React from 'react';
import ConnektLogo from '@/components/branding/ConnektLogo';
import ConnektMailLogo from '@/components/branding/ConnektMailLogo';
import ConnektWalletLogo from '@/components/branding/ConnektWalletLogo';
import ConnektTeamLogo from '@/components/branding/ConnektTeamLogo';
import ConnektAILogo from '@/components/branding/ConnektAILogo';
import ConnektStorageLogo from '@/components/branding/ConnektStorageLogo';

export type LoadingVariant = 'default' | 'mail' | 'wallet' | 'team' | 'ai' | 'storage';

interface LoadingScreenProps {
    variant?: LoadingVariant;
    className?: string;
}

export default function LoadingScreen({ variant = 'default', className = '' }: LoadingScreenProps) {
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const renderLogo = () => {
        switch (variant) {
            case 'mail':
                return <ConnektMailLogo />;
            case 'wallet':
                return <ConnektWalletLogo />;
            case 'team':
                return <ConnektTeamLogo />;
            case 'ai':
                return <ConnektAILogo />;
            case 'storage':
                return <ConnektStorageLogo />;
            default:
                return <ConnektLogo />;
        }
    };

    return (
        <div className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden ${className}`}>
            {renderLogo()}
        </div>
    );
}
