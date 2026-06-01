import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

function GeoFlag() {
  return (
    <svg width="24" height="16" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#fff"/>
      <path d="M130 0h40v200h-40zM0 80h300v40H0z" fill="#f00"/>
      <g fill="#f00">
        <path d="M65 30 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
        <path d="M65 130 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
        <path d="M205 30 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
        <path d="M205 130 l10 10 10-10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z"/>
      </g>
    </svg>
  );
}

function UkFlag() {
  return (
    <svg width="24" height="16" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
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
  );
}

export default function Header() {
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{ 
      display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', alignItems: 'center', gap: '16px', 
      textAlign: 'left', marginBottom: '32px', paddingTop: '16px', paddingBottom: '16px', 
      position: 'sticky', top: 0, zIndex: 50, 
      background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', 
      borderBottom: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '12px' }}>
        <span style={{ 
          width: '46px', height: '46px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
          borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-2), var(--accent))', 
          color: 'white', fontSize: '1.4rem', fontWeight: 800, 
          boxShadow: '0 8px 24px var(--accent-glow), inset 0 2px 0 rgba(255,255,255,0.2)' 
        }}>
          Z
        </span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          Product Image Extractor
        </h1>
      </div>

      <button
        onClick={toggleLanguage}
        style={{ 
          width: '44px', height: '44px', borderRadius: '14px', 
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', 
          boxShadow: 'var(--glass-shadow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' 
        }}
        title="ენის შეცვლა / Change Language"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.background = 'var(--glass-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--glass-bg)'; }}
      >
        {lang === 'ka' ? <GeoFlag /> : <UkFlag />}
      </button>

      <button
        onClick={toggleTheme}
        style={{ 
          width: '44px', height: '44px', borderRadius: '14px', marginRight: '12px',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', 
          boxShadow: 'var(--glass-shadow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', 
          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' 
        }}
        title="თემის შეცვლა"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.background = 'var(--glass-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--glass-bg)'; }}
      >
        {theme === 'dark' ? <Moon style={{ width: 18, height: 18 }} /> : <Sun style={{ width: 18, height: 18 }} />}
      </button>
    </header>
  );
}
