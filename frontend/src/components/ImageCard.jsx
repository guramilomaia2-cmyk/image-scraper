import { useState, useCallback } from 'react';
import { ZoomIn, Copy, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { getFilename, getExtension, fetchImageBlob, copyToClipboard } from '../utils/imageUtils';
import { showToast } from './Toast';

export default function ImageCard({
  url,
  index,
  isSelected,
  onToggleSelect,
  onOpenLightbox,
  sizeStr,
}) {
  const { t } = useLanguage();
  const [broken, setBroken] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const filename = getFilename(url);
  const ext = getExtension(url);
  const isGif = ext === 'gif';

  const handleCopy = useCallback(
    (e) => {
      e.stopPropagation();
      copyToClipboard(url).then(() => showToast(t('toastCopied')));
    },
    [url, t]
  );

  const handleDownload = useCallback(
    async (e) => {
      e.stopPropagation();
      setDownloading(true);
      try {
        const blob = await fetchImageBlob(url);
        const mime = blob.type;
        let downloadExt = mime.split('/')[1] || 'jpg';
        if (downloadExt === 'jpeg') downloadExt = 'jpg';
        if (downloadExt === 'svg+xml') downloadExt = 'svg';
        let dName = filename.replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico|avif)$/i, '');
        dName = dName + '.' + downloadExt;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = dName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        showToast(`${t('toastDownloaded')}: ${dName}`);
      } catch (err) {
        console.error('Download failed', err);
        window.open(url, '_blank');
      } finally {
        setDownloading(false);
      }
    },
    [url, filename, t]
  );

  const handleThumbClick = useCallback(
    (e) => {
      if (e.target.closest('[data-action="preview"]')) return;
      onToggleSelect(url);
    },
    [url, onToggleSelect]
  );

  const handlePreview = useCallback(
    (e) => {
      e.stopPropagation();
      onOpenLightbox(index);
    },
    [index, onOpenLightbox]
  );

  return (
    <div
      className={`bg-[var(--surface)] border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 animate-fade-in-up ${
        isSelected
          ? 'border-[var(--success)] shadow-[0_0_0_2px_var(--success-glow),0_8px_24px_rgba(0,0,0,0.2)]'
          : 'border-[var(--border)] hover:border-[rgba(245,130,32,0.65)] hover:shadow-[0_16px_38px_rgba(15,23,42,0.13)] hover:-translate-y-[3px]'
      }`}
      style={{ animationDelay: `${Math.min(index * 20, 400)}ms` }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full pt-[72%] overflow-hidden bg-checkered dark:bg-checkered-dark"
        onClick={handleThumbClick}
      >
        {/* Selection check */}
        <div
          className={`absolute top-2 left-2 w-[26px] h-[26px] bg-[var(--accent)] rounded-full flex items-center justify-center text-[0.85rem] text-white z-[3] pointer-events-none transition-all duration-150 ${
            isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.6]'
          }`}
        >
          ✓
        </div>

        {isGif && (
          <span className="absolute top-2 right-2 bg-black/65 backdrop-blur-sm border border-white/15 rounded-md px-1.5 py-0.5 text-[0.7rem] font-bold text-pink-400 tracking-wide z-[3] pointer-events-none">
            GIF
          </span>
        )}

        {broken ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[var(--text-muted)] text-[0.78rem]">
            <span className="text-3xl opacity-40">🚫</span>
            <span>{t('broken')}</span>
          </div>
        ) : (
          <img
            src={url}
            alt={filename}
            loading="lazy"
            onError={() => setBroken(true)}
            className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-400 group-hover:scale-[1.06]"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3 gap-2">
          <button
            data-action="preview"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(22,24,29,0.82)] backdrop-blur-lg border border-white/20 rounded-lg text-white text-[0.78rem] font-medium cursor-pointer transition-colors duration-200 hover:bg-white/28"
          >
            <ZoomIn className="w-[14px] h-[14px]" />
            {t('zoom')}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-1.5 min-h-[56px] border-t border-[var(--border)]">
        <div className="flex-1 min-w-0 flex flex-col gap-px">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[0.76rem] text-[var(--text)] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" title={filename}>
              {filename}
            </span>
            {ext && (
              <span className="shrink-0 px-1.5 py-px rounded-[5px] text-[0.65rem] font-bold tracking-wide bg-[rgba(245,130,32,0.12)] text-[var(--accent)] border border-[rgba(245,130,32,0.28)] leading-[1.5]">
                {ext.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-[0.7rem] text-[var(--text-faint)]">{sizeStr || ''}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            title={t('copyUrl')}
            className="w-7 h-7 flex items-center justify-center bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--text)] text-[0.75rem] cursor-pointer transition-all duration-200 hover:text-[var(--accent)] hover:border-[rgba(245,130,32,0.45)] hover:-translate-y-px"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            title={t('download')}
            className="w-7 h-7 flex items-center justify-center bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--text)] text-[0.8rem] cursor-pointer transition-all duration-200 hover:text-[var(--accent)] hover:border-[rgba(245,130,32,0.45)] hover:-translate-y-px disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
