import { useEffect, useState, useCallback, useRef } from 'react';
import { X, Copy, Download } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { getFilename, getExtension, formatBytes, copyToClipboard, fetchImageBlob, convertBlobToPng } from '../utils/imageUtils';
import { showToast } from './Toast';
import { saveAs } from 'file-saver';

export default function Lightbox({ images, currentIndex, onClose, onNavigate, fileSizeCache }) {
  const { t } = useLanguage();
  const [resolution, setResolution] = useState('');
  const [fileSize, setFileSize] = useState('');
  const imgRef = useRef(null);

  const url = images[currentIndex];
  const ext = url ? getExtension(url).toUpperCase() || '?' : '';

  // Load resolution
  useEffect(() => {
    if (!url) return;
    setResolution(ext);
    setFileSize(fileSizeCache?.[url] || '');

    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setResolution(`${ext}  ·  ${img.naturalWidth} × ${img.naturalHeight} px`);
      }
    };
    img.src = url;

    // Fetch file size if not cached
    if (!fileSizeCache?.[url]) {
      fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
        .then((r) => {
          const cl = r.headers.get('content-length');
          if (cl) setFileSize(formatBytes(parseInt(cl)));
        })
        .catch(() => {});
    }

    return () => {
      img.onload = null;
    };
  }, [url, ext, fileSizeCache]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNavigate]);

  const handleCopy = useCallback(() => {
    if (!url) return;
    copyToClipboard(url).then(() => showToast(t('toastCopied')));
  }, [url, t]);

  const handleDownload = useCallback(async () => {
    if (!url) return;
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

      const fname = getFilename(url);
      let dName = fname.replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico|avif)$/i, '');
      dName = dName + '.' + downloadExt;

      saveAs(blob, dName);
      showToast(`${t('toastDownloaded')}: ${dName}`);
    } catch {
      window.open(url, '_blank');
    }
  }, [url, t]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/88 backdrop-blur-[10px] cursor-pointer"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-[1] max-w-[90vw] max-h-[90vh] bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden flex flex-col shadow-[var(--shadow-lg)] animate-lightbox-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-[34px] h-[34px] bg-black/50 border border-[var(--border)] rounded-lg text-[var(--text)] text-[0.9rem] cursor-pointer flex items-center justify-center z-[2] transition-colors duration-200 hover:bg-red-500/40"
        >
          <X className="w-[18px] h-[18px]" />
        </button>

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => onNavigate(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 backdrop-blur-lg border border-[var(--border)] rounded-lg text-white text-2xl leading-none cursor-pointer flex items-center justify-center z-[2] transition-all duration-200 hover:bg-[rgba(245,130,32,0.82)] hover:scale-110"
            >
              ‹
            </button>
            <button
              onClick={() => onNavigate(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 backdrop-blur-lg border border-[var(--border)] rounded-lg text-white text-2xl leading-none cursor-pointer flex items-center justify-center z-[2] transition-all duration-200 hover:bg-[rgba(245,130,32,0.82)] hover:scale-110"
            >
              ›
            </button>
          </>
        )}

        {/* Image */}
        <img
          ref={imgRef}
          src={url}
          alt="Preview"
          className="max-w-full max-h-[74vh] object-contain block"
        />

        {/* Footer */}
        <div className="p-3 px-4 flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[0.75rem] text-[var(--text-muted)] whitespace-nowrap overflow-hidden text-ellipsis">
              {url}
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[0.82rem] font-semibold text-[var(--accent)]">
                {resolution}
              </span>
              {fileSize && (
                <span className="text-[0.8rem] text-[var(--accent)] font-medium">
                  {fileSize}
                </span>
              )}
              <span className="text-[0.78rem] text-[var(--text-faint)] ml-auto">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="w-[34px] h-[34px] flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[0.95rem] cursor-pointer transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] hover:scale-110"
              title={t('copyUrl')}
            >
              <Copy className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] border border-[var(--accent)] rounded-lg text-white font-semibold text-[0.85rem] cursor-pointer transition-all duration-200 hover:bg-[#e87517]"
            >
              <Download className="w-[18px] h-[18px]" />
              {t('download')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
