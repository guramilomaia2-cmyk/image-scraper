import { Grid3x3 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function ControlsBar({ sortValue, onSortChange, minSize, onMinSizeChange, gridSize, onGridSizeChange }) {
  const { t } = useLanguage();

  return (
    <div className="flex items-start flex-wrap gap-3 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-[var(--shadow)]">
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="min-h-[36px] bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--text)] font-[inherit] text-[0.85rem] py-1.5 px-2.5 cursor-pointer outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        >
          <option value="default">{t('sortDefault')}</option>
          <option value="name-asc">{t('sortNameAsc')}</option>
          <option value="name-desc">{t('sortNameDesc')}</option>
          <option value="size-desc">{t('sortSizeDesc')}</option>
          <option value="size-asc">{t('sortSizeAsc')}</option>
        </select>

        <div className="flex items-center gap-1.5 text-[0.82rem] text-[var(--text-muted)]">
          <label className="whitespace-nowrap">{t('minSize')}</label>
          <input
            type="number"
            value={minSize}
            onChange={(e) => onMinSizeChange(e.target.value)}
            min="0"
            max="9999"
            className="w-[58px] min-h-[36px] bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--text)] font-[inherit] text-[0.82rem] py-1 px-2 outline-none text-center transition-colors duration-200 focus:border-[var(--accent)]"
          />
          <span className="text-[var(--text-faint)] text-[0.78rem]">px</span>
        </div>

        <div className="flex items-center gap-2" title="Grid size">
          <Grid3x3 className="w-[18px] h-[18px] text-[var(--accent)]" />
          <input
            type="range"
            min="140"
            max="400"
            value={gridSize}
            onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
            className="w-[90px] h-1 bg-[var(--border)] rounded-sm outline-none cursor-pointer accent-[var(--accent)]"
          />
        </div>
      </div>
    </div>
  );
}
