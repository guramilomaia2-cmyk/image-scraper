import { Moon, Sun, Globe } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

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
      {/* Brand Logo - Standalone branded asset */}
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
              height: '46px', 
              width: 'auto', 
              objectFit: 'contain',
              filter: theme === 'dark' 
                ? 'drop-shadow(0 2px 12px var(--accent-glow))' 
                : 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))'
            }} 
          />
          <h1 className="sr-only">PixExtract</h1>
        </a>
      </div>

      {/* Header Actions - Unified Apple Glass Buttons */}
      <div className="header-actions flex items-center gap-2 sm:gap-3 pr-1 sm:pr-2">
        {/* Language Toggle Button */}
        <button
          type="button"
          className="header-btn group flex items-center gap-2 h-10 px-3.5 rounded-xl cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5"
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
          <Globe className="w-4 h-4 text-[var(--accent)] transition-transform duration-300 group-hover:rotate-45" />
          <span className="text-xs font-bold tracking-wider select-none">
            {lang === 'ka' ? 'ქართული' : 'English'}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="header-btn group flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5"
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
