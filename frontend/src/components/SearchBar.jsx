import { useState, useEffect, useRef } from 'react';
import { Link2, SearchCheck } from 'lucide-react';
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
  const { t } = useLanguage();
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
      className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${hasSearched ? 'mb-8' : 'mt-[15vh]'}`}
      style={{ margin: hasSearched ? '0 auto 2rem' : '15vh auto 0', maxWidth: '768px', width: '100%' }}
    >
      <form 
        onSubmit={handleSubmit}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow)',
          borderRadius: '32px',
          padding: '4px'
        }}
        className="relative flex items-center group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] focus-within:!border-[var(--accent)] focus-within:!shadow-[0_8px_32px_var(--accent-glow)]"
      >
        <div className="relative flex-1 flex items-center h-[56px]">
          <Link2 className="absolute left-5 w-5 h-5 text-[var(--text-faint)] group-focus-within:text-[var(--accent)] transition-colors duration-300 pointer-events-none" />
          <input
            ref={inputRef}
            type="url"
            placeholder={t('hint')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isLoading}
            className="w-full h-full bg-transparent border-none text-[1.1rem] text-[var(--text)] font-medium outline-none disabled:opacity-50 placeholder:text-[var(--text-faint)] placeholder:font-normal"
            style={{ paddingLeft: '52px', paddingRight: '16px' }}
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
        
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center justify-center w-[52px] h-[52px] mr-1 rounded-[26px] text-white cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:opacity-0 disabled:-translate-x-4 disabled:pointer-events-none"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-2), var(--accent))',
            boxShadow: '0 4px 16px var(--accent-glow), inset 0 2px 0 rgba(255,255,255,0.2)'
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow), inset 0 2px 0 rgba(255,255,255,0.2)'; } }}
          onMouseLeave={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px var(--accent-glow), inset 0 2px 0 rgba(255,255,255,0.2)'; } }}
        >
          {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SearchCheck className="w-[22px] h-[22px]" />}
        </button>
      </form>
    </div>
  );
}
