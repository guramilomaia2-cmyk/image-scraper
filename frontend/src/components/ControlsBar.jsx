import { Grid3x3 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function ControlsBar({ sortValue, onSortChange, minSize, onMinSizeChange, gridSize, onGridSizeChange }) {
  const { t } = useLanguage();

  return (
    <div 
      className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-[20px] transition-all duration-300"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)'
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-[42px] bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-[12px] text-[var(--text)] font-semibold text-[0.95rem] px-4 cursor-pointer outline-none transition-all duration-300 hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.1)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
        >
          <option value="default">{t('sortDefault')}</option>
          <option value="name-asc">{t('sortNameAsc')}</option>
          <option value="name-desc">{t('sortNameDesc')}</option>
          <option value="size-desc">{t('sortSizeDesc')}</option>
          <option value="size-asc">{t('sortSizeAsc')}</option>
        </select>

        <div className="h-6 w-px bg-[var(--border)] hidden sm:block opacity-50"></div>

        <div className="flex items-center gap-2 text-[0.95rem] text-[var(--text-muted)] font-semibold">
          <label className="whitespace-nowrap">{t('minSize')}</label>
          <div className="relative">
            <input
              type="number"
              value={minSize}
              onChange={(e) => onMinSizeChange(e.target.value)}
              min="0"
              max="9999"
              className="w-[88px] h-[42px] bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-[12px] text-[var(--text)] font-bold text-[0.95rem] pl-4 pr-8 outline-none transition-all duration-300 hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.1)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[0.85rem] pointer-events-none font-medium">px</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] px-5 h-[42px] rounded-[12px] border border-[var(--glass-border)]" title="Grid size">
        <Grid3x3 className="w-5 h-5 text-[var(--text-faint)]" />
        <input
          type="range"
          min="140"
          max="400"
          value={gridSize}
          onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
          className="w-32 h-1.5 bg-[var(--border)] rounded-full outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}
