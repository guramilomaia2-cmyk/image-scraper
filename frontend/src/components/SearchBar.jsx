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

export default function SearchBar({ onScrape, isLoading }) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [history] = useState(getHistory);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3.5 mb-3 shadow-[var(--shadow)] border-l-4 border-l-[var(--accent)] transition-all duration-200 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_4px_var(--accent-glow),var(--shadow)]">
      <div className="flex items-center gap-2.5">
        <Link2 className="w-[18px] h-[18px] shrink-0 text-[var(--accent)]" />
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="https://example.com"
          autoComplete="off"
          spellCheck="false"
          list="urlHistory"
          className="flex-1 bg-transparent border-none outline-none text-[var(--text)] font-[inherit] text-base min-w-0 min-h-[42px] px-1"
        />
        <datalist id="urlHistory">
          {history.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-[var(--accent)] border border-[var(--accent)] rounded-lg text-white font-semibold text-[0.95rem] cursor-pointer whitespace-nowrap shadow-[0_12px_20px_rgba(245,130,32,0.18)] transition-all duration-200 hover:bg-[#e87517] hover:border-[#e87517] hover:shadow-[0_14px_26px_rgba(245,130,32,0.24)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <SearchCheck className="w-[18px] h-[18px]" />
          <span>{t('title')}</span>
        </button>
      </div>
      <div className="mt-2 ml-8 text-xs text-[var(--text-faint)]">{t('hint')}</div>
    </div>
  );
}
