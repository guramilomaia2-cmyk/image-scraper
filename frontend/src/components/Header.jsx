import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

export default function Header() {
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 text-left mb-6 py-3.5">
      <div className="flex items-center gap-3 mb-0.5">
        <span className="w-[42px] h-[42px] inline-flex items-center justify-center rounded-lg bg-[var(--accent)] text-white text-xl font-extrabold shadow-[0_10px_24px_var(--accent-glow)]">
          Z
        </span>
        <h1 className="text-[1.55rem] font-bold leading-tight text-[var(--text)]">
          Product Image Extractor
        </h1>
      </div>

      <button
        onClick={toggleLanguage}
        className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text)] cursor-pointer transition-all duration-200 hover:-translate-y-px hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
        title="ენის შეცვლა / Change Language"
      >
        {lang === 'ka' ? '🇬🇧' : '🇬🇪'}
      </button>

      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] cursor-pointer transition-all duration-200 hover:-translate-y-px hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
        title="თემის შეცვლა"
      >
        {theme === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
      </button>
    </header>
  );
}
