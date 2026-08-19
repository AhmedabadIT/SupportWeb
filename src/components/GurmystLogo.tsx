import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const getLogoUrl = () => {
  const base = (import.meta as any).env?.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}data/logo.svg`;
};

export const GurmystLogo: React.FC<LogoProps> = ({ className = '', size = 300 }) => {
  const [logoSrc, setLogoSrc] = React.useState<string>(getLogoUrl());

  return (
    <img
      src={logoSrc}
      alt="Gurmyst Logo"
      style={{ width: size, height: size }}
      className={`select-none object-contain rounded-full shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!logoSrc.endsWith('logo.svg')) return;
        setLogoSrc('./logo.svg');
      }}
    />
  );
};

export const GurmystLogoHorizontal: React.FC<LogoProps & { showTagline?: boolean }> = ({
  className = '',
  size = 36,
  showTagline = true
}) => {
  const [logoSrc, setLogoSrc] = React.useState<string>(getLogoUrl());

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="Gurmyst Logo"
        style={{ width: size, height: size }}
        className="shrink-0 select-none object-contain rounded-full"
        referrerPolicy="no-referrer"
        onError={() => {
          if (!logoSrc.endsWith('logo.svg')) return;
          setLogoSrc('./logo.svg');
        }}
      />

      {/* Text Branding Label */}
      <div className="flex flex-col text-left justify-center">
        <div className="flex items-center text-sm sm:text-base font-black leading-none tracking-tight select-none">
          <span className="text-red-600">G</span>
          <span className="text-slate-950 dark:text-white">UR</span>
          <span className="text-red-600">M</span>
          <span className="text-slate-950 dark:text-white">YST</span>
          <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
            IT Solutions
          </span>
        </div>
        {showTagline && (
          <p className="hidden md:block text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
            Smart Solutions. <span className="text-red-500/90 dark:text-red-400">Stronger Tomorrow.</span>
          </p>
        )}
      </div>
    </div>
  );
};
