import React from 'react';

interface PostBankLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emblem' | 'full' | 'horizontal';
  showText?: boolean;
}

/**
 * High-precision vector emblem for Post Bank Iran
 * Matches the official identity provided in Post-Bank-Iran-Logo-1030x1030.webp
 */
export const PostBankEmblem: React.FC<{ size?: number; className?: string }> = ({ size = 34, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* 3 Horizontal accent lines extending to the right */}
      <line x1="120" y1="80" x2="190" y2="80" stroke="#10893E" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="125" y1="95" x2="190" y2="95" stroke="#10893E" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="130" y1="110" x2="190" y2="110" stroke="#10893E" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />

      {/* Main Green Globe / Circle */}
      <circle cx="100" cy="100" r="88" fill="#009640" />

      {/* 4 Characteristic Green-White Zebra Waves in the top half */}
      {/* Stripe 1 */}
      <path
        d="M62 46 C68 32 80 25 90 28 C82 38 72 48 68 62 C62 58 60 52 62 46 Z"
        fill="#ffffff"
      />
      {/* Stripe 2 */}
      <path
        d="M78 30 C86 20 100 16 112 20 C102 32 90 44 84 62 C76 56 74 42 78 30 Z"
        fill="#ffffff"
      />
      {/* Stripe 3 */}
      <path
        d="M102 20 C112 16 128 18 138 24 C126 36 112 48 104 64 C94 58 96 36 102 20 Z"
        fill="#ffffff"
      />
      {/* Stripe 4 */}
      <path
        d="M128 26 C138 24 152 30 160 38 C148 48 134 58 124 70 C116 62 120 42 128 26 Z"
        fill="#ffffff"
      />

      {/* Fluid Dynamic Wave cut across middle */}
      <path
        d="M38 74 C50 64 68 76 88 80 C108 84 134 76 156 58 C150 78 126 94 100 94 C74 94 50 86 38 74 Z"
        fill="#ffffff"
      />
    </svg>
  );
};

/**
 * Full Post Bank Iran Logo Component
 */
export const PostBankLogo: React.FC<PostBankLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  showText = true,
}) => {
  const emblemSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  if (variant === 'emblem' || !showText) {
    return <PostBankEmblem size={emblemSize} className={className} />;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center select-none text-center ${className}`}>
        <PostBankEmblem size={size === 'lg' ? 64 : 52} />
        <div className="mt-2 flex flex-col items-center">
          <span className="text-base sm:text-lg font-black text-[#e30613] dark:text-[#ff4d5a] tracking-tight font-sans">
            پست بانک ایران
          </span>
          <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 tracking-widest uppercase font-mono mt-0.5">
            POST BANK IRAN
          </span>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <PostBankEmblem size={emblemSize} />
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-black tracking-tight text-[#e30613] dark:text-[#ff4d5a] font-sans">
            پست بانک ایران
          </span>
        </div>
        <span className="text-[8px] sm:text-[9px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase font-mono mt-0.5">
          POST BANK IRAN
        </span>
      </div>
    </div>
  );
};
