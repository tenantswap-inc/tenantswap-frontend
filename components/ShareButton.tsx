'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Client } from '@/shared/utils/ApiClient';

interface ShareButtonProps {
  vacancyId: string;
}

export default function ShareButton({ vacancyId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/vacancy/${vacancyId}`;
  
  const handleShare = async () => {
    setIsSharing(true);
    
    // Track share in background
    Client.post(`/listings/vacancy/${vacancyId}/track`, { action: 'SHARE' }).catch(() => {});

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this vacancy on TenantSwap',
          text: 'I found a great apartment vacancy on TenantSwap!',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed', err);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
    
    setIsSharing(false);
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      title="Share Vacancy API"
      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-200 px-3 py-1.5 text-xs font-poppins-bold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-70 whitespace-nowrap"
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? 'Copied Link' : 'Share'}
    </button>
  );
}
