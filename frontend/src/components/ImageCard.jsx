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
      className="group relative rounded-[24px] overflow-hidden cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
      style={{ 
        animationDelay: `${Math.min(index * 20, 400)}ms`,
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
        boxShadow: isSelected ? '0 0 0 4px var(--accent-glow), 0 20px 40px rgba(0,0,0,0.15)' : 'var(--glass-shadow)',
        transform: isSelected ? 'scale(0.97)' : 'none'
      }}
      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent)'; } }}
      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; } }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: '85%' }}
        onClick={handleThumbClick}
      >
        {/* Selection check */}
        <div
          className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-[1rem] text-white z-10 pointer-events-none transition-all duration-300 shadow-lg"
          style={{
            background: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            opacity: isSelected ? 1 : 0,
            transform: isSelected ? 'scale(1)' : 'scale(0.5)'
          }}
        >
          ✓
        </div>
        
        {/* Reveal check on hover if not selected */}
        {!isSelected && (
          <div className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-[1rem] text-white z-10 pointer-events-none transition-all duration-300 shadow-lg opacity-0 scale-50 group-hover:opacity-60 group-hover:scale-100 bg-[rgba(255,255,255,0.2)] border border-white/30 backdrop-blur-md">
            ✓
          </div>
        )}

        {isGif && (
          <span className="absolute top-4 right-4 bg-black/50 backdrop-blur-xl border border-white/20 rounded-[10px] px-2.5 py-1 text-[0.75rem] font-black text-[#ff375f] tracking-widest z-10 pointer-events-none shadow-xl">
            GIF
          </span>
        )}

        {broken ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <span className="text-5xl opacity-20 filter grayscale">🚫</span>
            <span className="text-[0.9rem] font-medium tracking-wide opacity-60">{t('broken')}</span>
          </div>
        ) : (
          <img
            src={url}
            alt={filename}
            loading="lazy"
            onError={() => setBroken(true)}
            className="absolute inset-0 w-full h-full object-contain p-5 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.12]"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end justify-center pb-5 gap-3 pointer-events-none">
          <button
            data-action="preview"
            onClick={handlePreview}
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-[14px] text-white text-[0.9rem] font-bold cursor-pointer transition-all duration-300 hover:bg-white/30 hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          >
            <ZoomIn className="w-4 h-4" />
            {t('zoom')}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between gap-3 border-t border-[var(--glass-border)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[0.85rem] text-[var(--text)] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" title={filename}>
              {filename}
            </span>
            {ext && (
              <span className="shrink-0 px-2 py-0.5 rounded-[8px] text-[0.65rem] font-black tracking-widest bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent-glow)] uppercase">
                {ext}
              </span>
            )}
          </div>
          <span className="text-[0.8rem] text-[var(--text-faint)] font-medium tracking-wide">{sizeStr || ''}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            title={t('copyUrl')}
            className="w-9 h-9 flex items-center justify-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] rounded-[12px] text-[var(--text-muted)] cursor-pointer transition-all duration-300 hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
          >
            <Copy className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            title={t('download')}
            className="w-9 h-9 flex items-center justify-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] rounded-[12px] text-[var(--text-muted)] cursor-pointer transition-all duration-300 hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:hover:transform-none"
          >
            {downloading ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Download className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
