import { Download, ClipboardList, CheckSquare, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function ResultsHeader({
  totalCount,
  filteredCount,
  selectedCount,
  onDownloadAll,
  onExportUrls,
  onDeselectAll,
  onClear,
  isDownloading,
}) {
  const { t } = useLanguage();
  const showFiltered = filteredCount < totalCount;

  const downloadLabel =
    selectedCount > 0 ? t('downloadCount')(selectedCount) : t('downloadAll');

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-5 py-3 px-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-[var(--shadow)]">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center min-w-[36px] h-9 px-2.5 bg-[var(--accent)] rounded-lg text-base font-bold text-white">
          {totalCount}
        </span>
        <span className="text-base font-medium text-[var(--text-muted)]">
          {t('imagesLabel')}
        </span>
        {showFiltered && (
          <span className="text-[0.85rem] text-[var(--text-faint)]">
            ({filteredCount} {t('shownLabel')})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onDownloadAll}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-[var(--accent)] border border-[var(--accent)] rounded-lg text-white font-semibold text-[0.95rem] cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-[#e87517] hover:border-[#e87517] hover:shadow-[0_12px_22px_var(--accent-glow)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="w-[18px] h-[18px]" />
          <span>{isDownloading ? t('processing') : downloadLabel}</span>
        </button>

        <button
          onClick={onExportUrls}
          className="inline-flex items-center gap-2 py-2 px-4 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg font-medium text-[0.88rem] cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] hover:-translate-y-px"
        >
          <ClipboardList className="w-[18px] h-[18px]" />
          <span>{t('exportUrls')}</span>
        </button>

        {selectedCount > 0 && (
          <button
            onClick={onDeselectAll}
            className="inline-flex items-center gap-2 py-2 px-4 bg-[var(--surface)] border border-[rgba(16,185,129,0.4)] rounded-lg font-medium text-[0.88rem] text-[var(--success)] cursor-pointer whitespace-nowrap transition-all duration-200 hover:border-[var(--success)] hover:bg-[rgba(16,185,129,0.08)]"
          >
            <CheckSquare className="w-[18px] h-[18px]" />
            <span>{selectedCount}</span>
            <span>{t('deselect')}</span>
          </button>
        )}

        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-transparent text-[var(--text-muted)] border border-transparent rounded-lg font-[inherit] text-[0.88rem] cursor-pointer transition-colors duration-200 hover:text-[var(--text)] hover:border-[var(--border)]"
        >
          <X className="w-[18px] h-[18px]" />
          <span>{t('clear')}</span>
        </button>
      </div>
    </div>
  );
}
