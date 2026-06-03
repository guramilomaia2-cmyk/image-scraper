import { useState, useCallback } from 'react';
import { ZoomIn, Copy, Download, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useLanguage } from '../hooks/useLanguage';
import { getFilename, getExtension, fetchImageBlob, copyToClipboard, convertBlobToPng } from '../utils/imageUtils';
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
  const [dimensions, setDimensions] = useState(null);
  
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
        let blob = await fetchImageBlob(url);
        const mime = blob.type;
        let downloadExt = mime.split('/')[1] || 'jpg';
        if (downloadExt === 'jpeg') downloadExt = 'jpg';
        if (downloadExt === 'svg+xml') downloadExt = 'svg';

        if (downloadExt === 'avif') {
          try {
            blob = await convertBlobToPng(blob);
            downloadExt = 'png';
          } catch(e) {
            console.warn('AVIF to PNG conversion failed', e);
          }
        }

        let dName = filename.replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico|avif)$/i, '');
        dName = dName + '.' + downloadExt;

        saveAs(blob, dName);

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

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setDimensions(`${naturalWidth} x ${naturalHeight}`);
    }
  };

  const getBadgeColor = (e) => {
    switch (e?.toUpperCase()) {
      case 'SVG': return 'bg-orange-100/80 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
      case 'PNG': return 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'JPG':
      case 'JPEG': return 'bg-blue-100/80 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'GIF': return 'bg-purple-100/80 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'ICO': return 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'AVIF':
      case 'WEBP': return 'bg-slate-200/80 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-[var(--surface)] border ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent-glow)]' : 'border-[var(--glass-border)] hover:border-gray-300 dark:hover:border-gray-600'}`}
      style={{ animationDelay: `${Math.min(index * 20, 400)}ms` }}
      onClick={() => onToggleSelect(url)}
    >
      {/* Thumbnail Container */}
      <div className="relative p-2">
        <div className="relative w-full rounded-xl bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.03)] overflow-hidden" style={{ paddingBottom: '100%' }}>
          
          {/* Resolution Badge */}
          {dimensions && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-black/5 dark:border-white/10 text-[0.65rem] font-bold text-gray-600 dark:text-gray-300 z-10 shadow-sm pointer-events-none">
              {dimensions}
            </div>
          )}

          {/* Selection Indicator */}
          <div
            className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center text-[0.8rem] text-white z-10 transition-all duration-300 shadow-sm ${isSelected ? 'bg-[var(--accent)] opacity-100 scale-100' : 'bg-black/20 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 backdrop-blur-md'}`}
          >
            ✓
          </div>

          {broken ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
              <span className="text-4xl opacity-20 filter grayscale">🚫</span>
            </div>
          ) : (
            <img
              src={url}
              alt={filename}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={() => setBroken(true)}
              className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Hover Preview Button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(index);
              }}
              className="pointer-events-auto opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-10 h-10 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-lg border border-black/5 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-110 hover:text-[var(--accent)]"
              title={t('zoom')}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
        <div className="font-semibold text-[0.85rem] text-[var(--text)] truncate" title={filename}>
          {filename}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-[4px] text-[0.65rem] font-bold uppercase tracking-wider ${getBadgeColor(ext)}`}>
              {ext || '?'}
            </span>
            {sizeStr && (
              <span className="px-1.5 py-0.5 rounded-[4px] text-[0.7rem] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                {sizeStr}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={t('copyUrl')}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              title={t('download')}
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
    </div>
  );
}
