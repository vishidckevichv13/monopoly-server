import React from 'react';

interface BrandLogoProps {
  name: string;
  ticker?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

// Map brands to SVG paths in /brands/
const BRAND_SVG_MAP: Record<string, string> = {
  mcd: '/brands/mcd.svg',
  'mcdonald': '/brands/mcd.svg',
  "mcdonald's": '/brands/mcd.svg',
  bk: '/brands/bk.svg',
  'burger king': '/brands/bk.svg',
  spacex: '/brands/spacex.svg',
  spcx: '/brands/spacex.svg',
  nivea: '/brands/nivea.svg',
  telegram: '/brands/telegram.svg',
  tg: '/brands/telegram.svg',
  twitter: '/brands/twitter.svg',
  'twitter (x)': '/brands/twitter.svg',
  x: '/brands/twitter.svg',
  tiktok: '/brands/TikTok.svg',
  tt: '/brands/TikTok.svg',
  bmw: '/brands/bmw.svg',
  instagram: '/brands/Instagram.svg',
  insta: '/brands/Instagram.svg',
  pinterest: '/brands/Pinterest.svg',
  pin: '/brands/Pinterest.svg',
  boeing: '/brands/boeing.svg',
  ba: '/brands/boeing.svg',
  amazon: '/brands/amazon.svg',
  amzn: '/brands/amazon.svg',
  nike: '/brands/nike.svg',
  sony: '/brands/sony.svg',
  netflix: '/brands/netflix.svg',
  nflx: '/brands/netflix.svg',
  youtube: '/brands/youtube.svg',
  yt: '/brands/youtube.svg',
  'coca-cola': '/brands/сocaсola.svg',
  'coca cola': '/brands/сocaсola.svg',
  coca: '/brands/сocaсola.svg',
  emirates: '/brands/emirates.svg',
  ek: '/brands/emirates.svg',
  ikea: '/brands/ikea.svg',
  snapchat: '/brands/snapchat.svg',
  snap: '/brands/snapchat.svg',
  'mercedes-benz': '/brands/mercedesbenz.svg',
  'mercedes': '/brands/mercedesbenz.svg',
  mb: '/brands/mercedesbenz.svg',
  lego: '/brands/lego.svg',
  spotify: '/brands/spotify.svg',
  spot: '/brands/spotify.svg',
  xbox: '/brands/xbox.svg',
  nvidia: '/brands/nvidia.svg',
  nvda: '/brands/nvidia.svg',
  uber: '/brands/uber.svg',
  microsoft: '/brands/microsoft.svg',
  msft: '/brands/microsoft.svg',
  apple: '/brands/apple.svg',
  aapl: '/brands/apple.svg'
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  name,
  ticker,
  size = 'md',
  className = ''
}) => {
  const normKey = (ticker || name || '').toLowerCase().trim();
  const svgPath = BRAND_SVG_MAP[normKey] || BRAND_SVG_MAP[name.toLowerCase().trim()];

  const sizeClasses = {
    sm: 'w-8 h-8 max-h-8 max-w-8',
    md: 'w-12 h-12 max-h-12 max-w-12',
    lg: 'w-20 h-20 max-h-20 max-w-20',
    full: 'w-full h-full'
  }[size];

  if (svgPath) {
    return (
      <img
        src={svgPath}
        alt={name}
        className={`object-contain filter drop-shadow-sm select-none ${sizeClasses} ${className}`}
        loading="lazy"
        draggable={false}
      />
    );
  }

  // Fallback badge if no SVG is available
  return (
    <div
      className={`flex items-center justify-center font-black rounded-lg bg-white/20 text-white select-none ${sizeClasses} ${className}`}
    >
      <span className="text-sm uppercase tracking-wider">{ticker || name.slice(0, 3)}</span>
    </div>
  );
};
