import React from 'react';

interface BrandLogoProps {
  name: string;
  ticker?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ name, ticker, size = 'md', className = '' }) => {
  const norm = (name || '').toLowerCase();

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-24 h-24 text-base'
  }[size];

  // Nivea (Exact from SVG)
  if (norm.includes('nivea')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#0032A0] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white tracking-widest text-[0.65em] uppercase font-sans">
          NIVEA
        </span>
      </div>
    );
  }

  // Apple
  if (norm.includes('apple')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-slate-900 shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 170 170" className="w-[60%] h-[60%] fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.69-7.87-12.01-14.36-6.19-9.24-11.11-19.82-14.77-31.73-3.66-11.91-5.49-23.01-5.49-33.3 0-14.36 3.73-26.06 11.18-35.1 7.45-9.05 16.74-13.68 27.87-13.9 4.8 0 10.11 1.25 15.93 3.76 5.81 2.5 9.77 3.76 11.87 3.76 1.8 0 5.9-1.32 12.31-3.97 6.42-2.65 11.8-3.79 16.14-3.41 12.56.88 22.45 5.37 29.68 13.48-11.18 6.75-16.66 16.13-16.44 28.14.22 9.48 3.82 17.38 10.8 23.69 6.98 6.31 15.15 9.87 24.51 10.68-2.13 6.35-4.74 12.74-7.83 19.16zm-38.35-103.5c0-6.19 2.22-12.01 6.66-17.47 4.44-5.46 10.02-9.25 16.74-11.38.33 2.12.49 4.13.49 6.03 0 6.08-2.35 11.97-7.05 17.67-4.7 5.7-10.42 9.38-17.16 11.05-.22-1.85-.34-3.82-.34-5.9z" />
        </svg>
      </div>
    );
  }

  // Netflix
  if (norm.includes('netflix')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-[#E50914] tracking-wider text-[0.6em] font-sans">
          NETFLIX
        </span>
      </div>
    );
  }

  // Nvidia
  if (norm.includes('nvidia')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black border border-[#76B900]/40 shadow-md ${sizeStyles} ${className}`}>
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 80" className="w-[50%] h-[50%] fill-[#76B900]" xmlns="http://www.w3.org/2000/svg">
            <path d="M46.7 13.4c-12.8 0-23.7 7.7-28.7 18.9 4.6-6.6 11.9-10.7 20-10.7 13.7 0 24.8 11.1 24.8 24.8s-11.1 24.8-24.8 24.8c-8.2 0-15.5-4.1-20.1-10.8 5 11.3 16 19.1 28.8 19.1 17.7 0 32-14.3 32-32s-14.3-34.1-32-34.1zm-8.8 24.7c-4.6 0-8.3 3.7-8.3 8.3s3.7 8.3 8.3 8.3 8.3-3.7 8.3-8.3-3.7-8.3-8.3-8.3z" />
          </svg>
          <span className="font-black text-[#76B900] text-[0.45em] tracking-tighter -mt-1 font-sans">
            NVIDIA
          </span>
        </div>
      </div>
    );
  }

  // Tesla
  if (norm.includes('tesla')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#E82127] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white tracking-widest text-[0.6em] font-sans">
          TESLA
        </span>
      </div>
    );
  }

  // Mercedes-Benz
  if (norm.includes('mercedes')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-slate-900 border-2 border-slate-300 shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] fill-none stroke-slate-200 stroke-[4]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="42" />
          <path d="M50 8 L50 50 M50 50 L14 71 M50 50 L86 71" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // McDonald's
  if (norm.includes('mcdonald')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#DA291C] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-[#FFC72C] text-[1.2em] font-serif leading-none drop-shadow">
          M
        </span>
      </div>
    );
  }

  // Burger King
  if (norm.includes('burger')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#D62300] border-2 border-[#FFC72C] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-[#FFC72C] text-[0.7em] font-sans">
          BK
        </span>
      </div>
    );
  }

  // Telegram
  if (norm.includes('telegram')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#229ED9] shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-white -translate-x-[1px] translate-y-[1px]" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      </div>
    );
  }

  // Twitter / X
  if (norm.includes('twitter') || norm.includes('x')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.8em]">𝕏</span>
      </div>
    );
  }

  // TikTok
  if (norm.includes('tiktok')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-[#EE1D52] drop-shadow-[1px_1px_0_#69C9D0] text-[0.75em]">
          🎵 TT
        </span>
      </div>
    );
  }

  // Instagram
  if (norm.includes('instagram')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-none stroke-white stroke-2" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
        </svg>
      </div>
    );
  }

  // Pinterest
  if (norm.includes('pinterest')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#E60023] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.8em] italic font-serif">P</span>
      </div>
    );
  }

  // Amazon
  if (norm.includes('amazon')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#131921] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-[#FF9900] text-[0.55em] font-sans tracking-tight">
          amazon
        </span>
      </div>
    );
  }

  // Nike
  if (norm.includes('nike')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[70%] h-[70%] fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.707 5.293c-.26-.26-.64-.34-.98-.2l-18 7c-.43.17-.71.58-.72 1.04-.02.46.23.89.65 1.09l5.5 2.75 2.12 4.24c.2.4.61.66 1.06.67h.07c.43 0 .82-.23 1.03-.61l2.5-4.5 5.5 2.75c.18.09.37.13.56.13.26 0 .52-.08.74-.24.37-.28.56-.73.49-1.18l-1-7c-.07-.47-.38-.86-.84-1.01l-10-3.33 11.29-2.82c.4-.1.71-.38.83-.78.11-.4-.01-.83-.31-1.13z"/>
        </svg>
      </div>
    );
  }

  // Sony
  if (norm.includes('sony')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.55em] tracking-widest font-serif">
          SONY
        </span>
      </div>
    );
  }

  // YouTube
  if (norm.includes('youtube')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#FF0000] shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[50%] h-[50%] fill-white" xmlns="http://www.w3.org/2000/svg">
          <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
        </svg>
      </div>
    );
  }

  // Coca-Cola
  if (norm.includes('coca')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#DC2626] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.5em] italic font-serif tracking-tighter">
          Coke
        </span>
      </div>
    );
  }

  // IKEA
  if (norm.includes('ikea')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#0058A3] shadow-md ${sizeStyles} ${className}`}>
        <div className="bg-[#FFCC00] px-1.5 py-0.5 rounded-full">
          <span className="font-black text-[#0058A3] text-[0.55em] font-sans tracking-wider">
            IKEA
          </span>
        </div>
      </div>
    );
  }

  // Snapchat
  if (norm.includes('snapchat')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#FFFC00] shadow-md ${sizeStyles} ${className}`}>
        <span className="text-[0.9em]">👻</span>
      </div>
    );
  }

  // LEGO
  if (norm.includes('lego')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#D11013] border-2 border-[#FFD500] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.55em] font-sans italic tracking-tighter drop-shadow-[1px_1px_0_#000]">
          LEGO
        </span>
      </div>
    );
  }

  // Spotify
  if (norm.includes('spotify')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#1DB954] shadow-md ${sizeStyles} ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-slate-950" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.586 14.424c-.18.295-.563.387-.857.207-2.348-1.435-5.304-1.76-8.785-.964-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.714 1.115.293.18.386.563.207.856zm1.223-2.724c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.233 1.328.366.226.48.707.257 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.016-.129-1.167-.624-.15-.495.13-1.017.625-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.284.327z"/>
        </svg>
      </div>
    );
  }

  // Xbox
  if (norm.includes('xbox')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#107C10] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.8em]">✕</span>
      </div>
    );
  }

  // Microsoft
  if (norm.includes('microsoft')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-white shadow-md p-2 ${sizeStyles} ${className}`}>
        <div className="grid grid-cols-2 gap-1 w-[70%] h-[70%]">
          <div className="bg-[#F25022] rounded-xs" />
          <div className="bg-[#7FBA00] rounded-xs" />
          <div className="bg-[#00A4EF] rounded-xs" />
          <div className="bg-[#FFB900] rounded-xs" />
        </div>
      </div>
    );
  }

  // SpaceX
  if (norm.includes('spacex')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-black shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.55em] tracking-wider font-sans">
          SPACEX
        </span>
      </div>
    );
  }

  // Boeing
  if (norm.includes('boeing')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-[#0033A0] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.5em] tracking-tighter font-sans">
          BOEING
        </span>
      </div>
    );
  }

  // Emirates
  if (norm.includes('emirates')) {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-[#D71921] shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.5em] tracking-tight font-serif">
          Emirates
        </span>
      </div>
    );
  }

  // Uber
  if (norm.includes('uber')) {
    return (
      <div className={`relative flex items-center justify-center rounded-full bg-black shadow-md ${sizeStyles} ${className}`}>
        <span className="font-black text-white text-[0.6em] tracking-wider font-sans">
          Uber
        </span>
      </div>
    );
  }

  // Default fallback badge
  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-slate-800 text-white font-black shadow-md ${sizeStyles} ${className}`}>
      <span>{ticker || name.slice(0, 3).toUpperCase()}</span>
    </div>
  );
};
