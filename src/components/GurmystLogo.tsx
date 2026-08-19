import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const GurmystLogo: React.FC<LogoProps> = ({ className = '', size = 300 }) => {
  return (
    <img
      src="/data/logo.svg"
      alt="Gurmyst Logo"
      style={{ width: size, height: size }}
      className={`select-none object-contain rounded-full shrink-0 ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

export const GurmystLogoHorizontal: React.FC<LogoProps & { showTagline?: boolean }> = ({
  className = '',
  size = 40,
  showTagline = true
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/data/logo.svg"
        alt="Gurmyst Logo"
        style={{ width: size, height: size }}
        className="shrink-0 select-none object-contain rounded-full"
        referrerPolicy="no-referrer"
      />

      {/* Text Branding Label */}
      <div className="flex flex-col text-left">
        <div className="flex items-center text-md font-extrabold leading-none tracking-tight select-none">
          <span className="text-red-600">G</span>
          <span className="text-slate-950 dark:text-white">UR</span>
          <span className="text-red-600">M</span>
          <span className="text-slate-950 dark:text-white">YST</span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">IT Solutions</span>
        </div>
        {showTagline && (
          <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
            Smart Solutions. <span className="text-red-500/90 dark:text-red-400">Stronger Tomorrow.</span>
          </p>
        )}
      </div>
    </div>
  );
};
