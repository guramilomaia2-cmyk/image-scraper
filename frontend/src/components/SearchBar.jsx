import { useState, useEffect, useRef } from 'react';
import { Link2, Search } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('scraper-history') || '[]');
  } catch {
    return [];
  }
}

export function addToHistory(url) {
  let hist = getHistory().filter((u) => u !== url);
  hist.unshift(url);
  hist = hist.slice(0, 10);
  localStorage.setItem('scraper-history', JSON.stringify(hist));
}

export default function SearchBar({ onScrape, isLoading, hasSearched }) {
  const { t, lang } = useLanguage();
  const [url, setUrl] = useState('');
  const [history] = useState(getHistory);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    const finalUrl = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
    onScrape(finalUrl);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handlePaste = () => {
    setTimeout(() => {
      const val = inputRef.current?.value?.trim();
      if (val) {
        const finalUrl = /^https?:\/\//i.test(val) ? val : 'https://' + val;
        onScrape(finalUrl);
      }
    }, 50);
  };

  return (
    <div 
      className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${hasSearched ? 'mb-8 sticky z-45' : 'mb-10 relative z-10'}`}
      style={{ 
        margin: hasSearched ? '0 auto 2rem' : '0 auto 2.5rem', 
        maxWidth: '720px', 
        width: '100%', 
        top: hasSearched ? '96px' : 'auto',
        position: hasSearched ? 'sticky' : 'relative',
        zIndex: hasSearched ? 45 : 10
      }}
    >
      <form 
        onSubmit={handleSubmit}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow)',
          borderRadius: '28px',
          padding: '4px 6px 4px 4px'
        }}
        className="relative flex items-center group transition-all duration-300 hover:border-[rgba(0,111,245,0.4)] hover:shadow-[0_12px_40px_rgba(0,111,245,0.12)] focus-within:!border-[var(--accent)] focus-within:!shadow-[0_8px_32px_var(--accent-glow)]"
      >
        <div className="relative flex-1 flex items-center h-[52px]">
          <Link2 className="absolute left-4.5 w-5 h-5 text-[var(--accent)]/70 group-focus-within:text-[var(--accent)] transition-colors duration-300 pointer-events-none" />
          <input
            ref={inputRef}
            type="url"
            placeholder={t('hint')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isLoading}
            className="w-full h-full bg-transparent border-none text-[0.98rem] sm:text-[1.05rem] text-[var(--text)] font-normal outline-none disabled:opacity-50 placeholder:text-[var(--text-faint)]"
            style={{ paddingLeft: '48px', paddingRight: '12px' }}
            autoComplete="off"
            spellCheck="false"
            list="urlHistory"
          />
          <datalist id="urlHistory">
            {history.map((h, i) => (
              <option key={i} value={h} />
            ))}
          </datalist>
        </div>
        
        {/* Search / Extract Action Button - Always visible with clean Apple styling */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 h-[44px] px-5 rounded-[22px] text-white font-semibold text-sm cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.03] active:scale-[0.97] flex-shrink-0 shadow-md hover:shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            boxShadow: '0 4px 14px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.25)'
          }}
          title={lang === 'ka' ? 'სურათების ამოღება' : 'Extract Images'}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4 text-white" />
              <span className="hidden sm:inline font-bold tracking-tight">
                {lang === 'ka' ? 'ამოღება' : 'Extract'}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
