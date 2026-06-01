import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

function GeoFlag() {
  return (
    <svg width="24" height="16" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <rect fill="#fff" width="900" height="600"/>
      <rect fill="#FF0000" x="360" width="180" height="600"/>
      <rect fill="#FF0000" y="210" width="900" height="180"/>
      <rect fill="#FF0000" x="60" y="60" width="60" height="60"/>
      <rect fill="#FF0000" x="180" y="60" width="60" height="60"/>
      <rect fill="#FF0000" x="60" y="420" width="60" height="60"/>
      <rect fill="#FF0000" x="180" y="420" width="60" height="60"/>
      <rect fill="#FF0000" x="600" y="60" width="60" height="60"/>
      <rect fill="#FF0000" x="720" y="60" width="60" height="60"/>
      <rect fill="#FF0000" x="600" y="420" width="60" height="60"/>
      <rect fill="#FF0000" x="720" y="420" width="60" height="60"/>
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
    <header style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', alignItems: 'center', gap: '16px', textAlign: 'left', marginBottom: '24px', paddingTop: '14px', paddingBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ width: '42px', height: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'var(--accent)', color: 'white', fontSize: '1.25rem', fontWeight: 800, boxShadow: '0 10px 24px var(--accent-glow)' }}>
          Z
        </span>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>
          Product Image Extractor
        </h1>
      </div>

      <button
        onClick={toggleLanguage}
        style={{ width: '44px', height: '40px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
        title="ენის შეცვლა / Change Language"
      >
        {lang === 'ka' ? <UkFlag /> : <GeoFlag />}
      </button>

      <button
        onClick={toggleTheme}
        style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s' }}
        title="თემის შეცვლა"
      >
        {theme === 'dark' ? <Moon style={{ width: 18, height: 18 }} /> : <Sun style={{ width: 18, height: 18 }} />}
      </button>
    </header>
  );
}
