import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

function GeoFlag() {
  return (
    <span className="inline-block overflow-hidden rounded-[3px] border border-black/10 dark:border-white/15 shadow-sm leading-none flex-shrink-0" style={{ width: '20px', height: '14px' }}>
      <svg width="20" height="14" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
        <rect width="300" height="200" fill="#fff"/>
        <path d="M130 0h40v200h-40zM0 80h300v40H0z" fill="#f00"/>
        <g fill="#f00">
          <path d="M65 30 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
          <path d="M65 130 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
          <path d="M205 30 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
          <path d="M205 130 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
        </g>
      </svg>
    </span>
  );
}

function UkFlag() {
  return (
    <span className="inline-block overflow-hidden rounded-[3px] border border-black/10 dark:border-white/15 shadow-sm leading-none flex-shrink-0" style={{ width: '20px', height: '14px' }}>
      <svg width="20" height="14" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
        <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
        <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
        <g clipPath="url(#s)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </g>
      </svg>
    </span>
  );
}

export default function Header() {
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header 
      className="glass-header"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: '24px'
      }}
    >
      {/* Brand Logo - text duplication removed; logo already contains PixExtract brand typography */}
      <div className="flex items-center pl-1 sm:pl-2">
        <a 
          href={`/${lang}`} 
          className="flex items-center group transition-transform duration-300 hover:scale-[1.02]"
          title="PixExtract Home"
        >
          <img 
            src={theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"} 
            alt="PixExtract" 
            className="header-logo transition-all duration-300"
            style={{ 
              height: '44px', 
              width: 'auto', 
              objectFit: 'contain',
              filter: theme === 'dark' 
                ? 'drop-shadow(0 2px 10px var(--accent-glow))' 
                : 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))'
            }} 
          />
          <h1 className="sr-only">PixExtract</h1>
        </a>
      </div>

      {/* Header Actions - Unified neutral glass style with matching height, borders, and hover glow */}
      <div className="header-actions flex items-center gap-2 sm:gap-3 pr-1 sm:pr-2">
        {/* Language Toggle Button */}
        <button
          type="button"
          className="header-btn group relative flex items-center gap-2 h-10 px-3 rounded-xl cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5"
          onClick={toggleLanguage}
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            boxShadow: 'var(--glass-shadow)',
            color: 'var(--text)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--glass-hover)';
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 4px 16px var(--accent-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
          }}
          title={lang === 'ka' ? 'Switch to English' : 'ქართულზე გადართვა'}
        >
          {lang === 'ka' ? <GeoFlag /> : <UkFlag />}
          <span className="text-xs font-bold tracking-wider uppercase opacity-90 select-none">
            {lang === 'ka' ? 'KA' : 'EN'}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="header-btn flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5"
          onClick={toggleTheme}
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            boxShadow: 'var(--glass-shadow)',
            color: 'var(--text)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--glass-hover)';
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 4px 16px var(--accent-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
          }}
          title={theme === 'dark' ? 'ღია თემა (Light)' : 'მუქი თემა (Dark)'}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12 text-[var(--accent)]" />
          ) : (
            <Sun className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45 text-[var(--accent)]" />
          )}
        </button>
      </div>
    </header>
  );
}
