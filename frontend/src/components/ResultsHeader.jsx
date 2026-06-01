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
    <div 
      className="flex items-center justify-between flex-wrap gap-4 mb-6 py-4 px-6 transition-all duration-300 mx-2 sm:mx-6"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: '28px'
      }}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 bg-[var(--accent)] rounded-[12px] text-base font-bold text-white shadow-[0_4px_12px_var(--accent-glow)]">
          {totalCount}
        </span>
        <span className="text-[1.05rem] font-bold text-[var(--text)]">
          {t('imagesLabel')}
        </span>
        {showFiltered && (
          <span className="text-[0.95rem] font-medium text-[var(--text-faint)]">
            ({filteredCount} {t('shownLabel')})
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onDownloadAll}
          disabled={isDownloading}
          className="inline-flex items-center justify-center gap-2 px-6 shrink-0 text-white font-bold text-[1rem] cursor-pointer whitespace-nowrap transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-2), var(--accent))',
            boxShadow: '0 6px 20px var(--accent-glow), inset 0 2px 0 rgba(255,255,255,0.25)',
            borderRadius: '16px',
            border: 'none',
            height: '50px'
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
          onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'none'; }}
        >
          <Download className="w-[18px] h-[18px]" />
          <span>{isDownloading ? t('processing') : downloadLabel}</span>
        </button>

        <button
          onClick={onExportUrls}
          className="inline-flex items-center justify-center gap-2 px-6 shrink-0 text-[var(--text)] font-bold text-[1rem] cursor-pointer whitespace-nowrap transition-all duration-300"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            borderRadius: '16px',
            height: '50px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.background = 'var(--glass-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--glass-bg)'; }}
        >
          <ClipboardList className="w-[18px] h-[18px] opacity-80" />
          <span>{t('exportUrls')}</span>
        </button>

        {selectedCount > 0 && (
          <button
            onClick={onDeselectAll}
            className="inline-flex items-center justify-center gap-2 px-5 shrink-0 font-bold text-[1rem] text-[var(--success)] cursor-pointer whitespace-nowrap transition-all duration-300"
            style={{
              background: 'rgba(52, 199, 89, 0.1)',
              border: '1px solid rgba(52, 199, 89, 0.3)',
              boxShadow: '0 4px 12px rgba(52, 199, 89, 0.1)',
              borderRadius: '16px',
              height: '50px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.background = 'rgba(52, 199, 89, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(52, 199, 89, 0.1)'; }}
          >
            <CheckSquare className="w-[18px] h-[18px]" />
            <span>{selectedCount}</span>
            <span>{t('deselect')}</span>
          </button>
        )}

        <button
          onClick={onClear}
          className="inline-flex items-center justify-center gap-1.5 h-[50px] px-5 shrink-0 bg-transparent text-[var(--text-muted)] border border-transparent rounded-[16px] font-bold text-[1rem] cursor-pointer transition-all duration-300 hover:text-[var(--error)] hover:bg-[rgba(255,59,48,0.1)] hover:border-[rgba(255,59,48,0.2)] hover:scale-105"
        >
          <X className="w-[20px] h-[20px]" />
          <span>{t('clear')}</span>
        </button>
      </div>
    </div>
  );
}
