import { useState, useCallback, useRef } from 'react';
import { useLanguage } from './hooks/useLanguage';
import { getFilename, parseSizeStr, fetchFileSize, fetchImageBlob, copyToClipboard } from './utils/imageUtils';
import { addToHistory } from './components/SearchBar';
import { showToast } from './components/Toast';
import JSZip from 'jszip';

import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ControlsBar from './components/ControlsBar';
import ResultsHeader from './components/ResultsHeader';
import ImageGrid from './components/ImageGrid';
import Lightbox from './components/Lightbox';
import Toast from './components/Toast';

import { ScanSearch, ImageOff, FilterX } from 'lucide-react';

export default function App() {
  const { t, lang } = useLanguage();

  // ─── State ───
  const [allImages, setAllImages] = useState([]);
  const [displayImages, setDisplayImages] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState(null); // { msg, type: 'success'|'error' }
  const [hasSearched, setHasSearched] = useState(false);
  const [pageTitle, setPageTitle] = useState('images');

  // Filters
  const [sortValue, setSortValue] = useState('default');
  const [minSize, setMinSize] = useState('50');
  const [gridSize, setGridSize] = useState(220);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // File sizes cache
  const fileSizeCacheRef = useRef({});
  const [fileSizeCache, setFileSizeCache] = useState({});
  const dimensionCacheRef = useRef({});

  // ─── Apply filters + sort ───
  const applyFiltersAndSort = useCallback(
    (images, sort, minPx, sizeCache) => {
      const minVal = parseInt(minPx) || 0;
      const dimCache = dimensionCacheRef.current;

      let filtered = images.filter((url) => {
        if (minVal > 0) {
          const d = dimCache[url];
          if (d !== undefined && d !== null) {
            if (d.w < minVal && d.h < minVal) return false;
          }
        }
        return true;
      });

      if (sort === 'name-asc') {
        filtered.sort((a, b) => getFilename(a).localeCompare(getFilename(b)));
      } else if (sort === 'name-desc') {
        filtered.sort((a, b) => getFilename(b).localeCompare(getFilename(a)));
      } else if (sort === 'size-desc') {
        filtered.sort((a, b) => parseSizeStr(sizeCache[b] || '') - parseSizeStr(sizeCache[a] || ''));
      } else if (sort === 'size-asc') {
        filtered.sort((a, b) => parseSizeStr(sizeCache[a] || '') - parseSizeStr(sizeCache[b] || ''));
      }

      return filtered;
    },
    []
  );

  // When filters change, recompute display
  const updateDisplay = useCallback(
    (images, sort, min) => {
      const filtered = applyFiltersAndSort(images, sort, min, fileSizeCacheRef.current);
      setDisplayImages(filtered);
    },
    [applyFiltersAndSort]
  );

  // ─── Scrape ───
  const handleScrape = useCallback(
    async (url) => {
      setIsLoading(true);
      setStatus(null);
      setHasSearched(true);
      setAllImages([]);
      setDisplayImages([]);
      setSelectedUrls(new Set());
      setSortValue('default');
      fileSizeCacheRef.current = {};
      setFileSizeCache({});
      dimensionCacheRef.current = {};

      try {
        const resp = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: AbortSignal.timeout(120000),
        });

        const text = await resp.text();
        if (!resp.ok) {
          let errMsg;
          try {
            const errJson = JSON.parse(text);
            errMsg = errJson.error || `HTTP ${resp.status}`;
          } catch {
            errMsg = `HTTP ${resp.status}`;
          }
          throw new Error(errMsg);
        }

        const json = JSON.parse(text);
        const images = json.images || [];
        const title = json.title || 'images';
        const preset = json.preset || '';

        setPageTitle(title.replace(/[\\/:*?"<>|]/g, '-').trim() || 'images');
        setAllImages(images);

        // Cache image dimensions
        images.forEach((imgUrl) => {
          if (imgUrl.startsWith('data:')) return;
          const img = new Image();
          img.onload = () => {
            dimensionCacheRef.current[imgUrl] = { w: img.naturalWidth, h: img.naturalHeight };
          };
          img.onerror = () => {
            dimensionCacheRef.current[imgUrl] = null;
          };
          img.src = imgUrl;
        });

        // Apply filters
        const minPx = parseInt(minSize) || 0;
        const filtered = applyFiltersAndSort(images, 'default', minPx, {});
        setDisplayImages(filtered);

        if (images.length > 0) {
          const statusMsg = t('statusFound')(images.length, 0, preset);
          setStatus({ msg: statusMsg, type: 'success' });

          // Fetch file sizes in background
          const toFetch = images.slice(0, 80);
          Promise.all(
            toFetch.map(async (imgUrl) => {
              const size = await fetchFileSize(imgUrl);
              if (size) {
                fileSizeCacheRef.current[imgUrl] = size;
              }
            })
          ).then(() => {
            setFileSizeCache({ ...fileSizeCacheRef.current });
            // Re-apply filters with updated sizes
            updateDisplay(images, sortValue, minSize);
          });
        } else {
          setStatus(null);
        }

        addToHistory(url);
      } catch (err) {
        const errMsg = t('errorPrefix') + (err.message || t('unknownError'));
        setStatus({ msg: errMsg, type: 'error' });
        setAllImages([]);
        setDisplayImages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minSize, sortValue, applyFiltersAndSort, updateDisplay, t]
  );

  // ─── Sort change ───
  const handleSortChange = useCallback(
    (val) => {
      setSortValue(val);
      updateDisplay(allImages, val, minSize);
    },
    [allImages, minSize, updateDisplay]
  );

  // ─── Min size change ───
  const handleMinSizeChange = useCallback(
    (val) => {
      setMinSize(val);
      updateDisplay(allImages, sortValue, val);
    },
    [allImages, sortValue, updateDisplay]
  );

  // ─── Selection ───
  const handleToggleSelect = useCallback((url) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedUrls(new Set());
    showToast(t('toastDeselected'));
  }, [t]);

  // ─── Download All / Selected as ZIP ───
  const handleDownloadAll = useCallback(async () => {
    const toDownload = selectedUrls.size > 0 ? [...selectedUrls] : displayImages;
    if (!toDownload.length) return;

    setIsDownloading(true);
    const label =
      selectedUrls.size > 0
        ? `${selectedUrls.size} ${lang === 'ka' ? 'მონიშნული' : 'selected'}`
        : lang === 'ka'
          ? 'ყველა'
          : 'all';
    showToast(`📦 ${lang === 'ka' ? 'ZIP იქმნება' : 'Creating ZIP'} (${label})...`, 15000);

    try {
      const zipName = pageTitle === 'images' ? 'images' : pageTitle;
      const zip = new JSZip();
      const folder = zip.folder(zipName);
      const usedNames = {};
      let successCount = 0;

      await Promise.all(
        toDownload.map(async (imgUrl) => {
          try {
            const blob = await fetchImageBlob(imgUrl);
            let name = getFilename(imgUrl);
            let ext = (blob.type || '').split('/')[1] || '';
            if (ext === 'jpeg') ext = 'jpg';
            if (ext === 'svg+xml') ext = 'svg';

            if (ext) {
              name = name.replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico|avif)$/i, '');
              name += '.' + ext;
            } else if (!name.includes('.')) {
              name += '.jpg';
            }

            if (usedNames[name]) {
              usedNames[name]++;
              const parts = name.split('.');
              const e = parts.pop();
              name = `${parts.join('.')}_${usedNames[name]}.${e}`;
            } else {
              usedNames[name] = 1;
            }
            folder.file(name, blob);
            successCount++;
          } catch (err) {
            console.error('Failed to download for zip:', imgUrl, err);
          }
        })
      );

      if (successCount === 0) throw new Error('No files successfully downloaded');

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      showToast(t('toastZipDone'));
    } catch (e) {
      console.error(e);
      showToast(t('toastZipFail'));
    } finally {
      setIsDownloading(false);
    }
  }, [selectedUrls, displayImages, pageTitle, lang, t]);

  // ─── Export URLs ───
  const handleExportUrls = useCallback(() => {
    const urls = selectedUrls.size > 0 ? [...selectedUrls] : displayImages;
    if (!urls.length) return;
    const content = urls.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'image-urls.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast(`${t('toastExport')} (${urls.length})`);
  }, [selectedUrls, displayImages, t]);

  // ─── Clear ───
  const handleClear = useCallback(() => {
    setAllImages([]);
    setDisplayImages([]);
    setSelectedUrls(new Set());
    setStatus(null);
    setHasSearched(false);
    setSortValue('default');
    fileSizeCacheRef.current = {};
    setFileSizeCache({});
    dimensionCacheRef.current = {};
  }, []);

  // ─── Lightbox ───
  const handleOpenLightbox = useCallback((index) => {
    setLightboxIndex(index);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(-1);
  }, []);

  const handleLightboxNavigate = useCallback(
    (dir) => {
      setLightboxIndex((prev) => {
        const next = prev + dir;
        if (next < 0 || next >= displayImages.length) return prev;
        return next;
      });
    },
    [displayImages.length]
  );

  // ─── Render ───
  const showControls = allImages.length > 0;
  const showEmpty = hasSearched && !isLoading && allImages.length === 0;
  const showNoFilter = allImages.length > 0 && displayImages.length === 0;
  const showInitial = !hasSearched && !isLoading;
  const showGrid = displayImages.length > 0;

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '1440px', margin: '0 auto', padding: '24px 24px 64px' }}>
      <Header />
      <SearchBar onScrape={handleScrape} isLoading={isLoading} hasSearched={hasSearched} />

      {/* Status */}
      {status && (
        <div
          className={`flex items-center gap-3 px-6 py-4 rounded-[20px] text-[0.95rem] font-bold mb-6 mx-auto w-max max-w-full transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${
            status.type === 'error'
              ? 'text-[var(--error)]'
              : 'text-[var(--success)]'
          }`}
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: status.type === 'error' ? '1px solid rgba(255,59,48,0.3)' : '1px solid rgba(52,199,89,0.3)',
            boxShadow: status.type === 'error' ? '0 8px 32px rgba(255,59,48,0.15)' : '0 8px 32px rgba(52,199,89,0.15)'
          }}
        >
          {status.type === 'success' ? <span className="text-xl">✨</span> : <span className="text-xl">⚠️</span>}
          {status.msg}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-5 py-24 text-[var(--text)] transition-all duration-500 animate-in fade-in">
          <div className="w-12 h-12 border-4 border-[var(--glass-border)] border-t-[var(--accent)] rounded-full animate-spin shadow-[0_0_20px_var(--accent-glow)]" />
          <p className="font-semibold tracking-wide text-[1.1rem] opacity-80">{t('loading')}</p>
        </div>
      )}

      {/* Controls */}
      {showControls && !isLoading && (
        <ControlsBar
          sortValue={sortValue}
          onSortChange={handleSortChange}
          minSize={minSize}
          onMinSizeChange={handleMinSizeChange}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
        />
      )}

      {/* Results Header */}
      {showControls && !isLoading && (
        <ResultsHeader
          totalCount={allImages.length}
          filteredCount={displayImages.length}
          selectedCount={selectedUrls.size}
          onDownloadAll={handleDownloadAll}
          onExportUrls={handleExportUrls}
          onDeselectAll={handleDeselectAll}
          onClear={handleClear}
          isDownloading={isDownloading}
        />
      )}

      {/* Image Grid */}
      {showGrid && !isLoading && (
        <ImageGrid
          images={displayImages}
          selectedUrls={selectedUrls}
          onToggleSelect={handleToggleSelect}
          onOpenLightbox={handleOpenLightbox}
          gridSize={gridSize}
          fileSizeCache={fileSizeCache}
        />
      )}

      {/* Empty State */}
      {showEmpty && (
        <div className="text-center py-24 px-6 text-[var(--text)] transition-all duration-500 animate-in fade-in zoom-in-95"
             style={{ margin: '0 auto', maxWidth: '768px', width: '100%', borderRadius: '24px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div className="text-[4rem] mb-6 block opacity-80 drop-shadow-2xl hover:scale-110 transition-transform duration-500">
            <ImageOff className="w-12 h-12 mx-auto text-[var(--accent)] drop-shadow-[0_0_15px_var(--accent-glow)]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">{t('emptyTitle')}</h2>
          <p className="text-[1.05rem] opacity-70 font-medium max-w-md mx-auto">{t('emptyDesc')}</p>
        </div>
      )}

      {/* No Filter Results */}
      {showNoFilter && !isLoading && (
        <div className="text-center py-24 px-6 text-[var(--text)] transition-all duration-500 animate-in fade-in zoom-in-95"
             style={{ margin: '0 auto', maxWidth: '768px', width: '100%', borderRadius: '24px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div className="text-[4rem] mb-6 block opacity-80 drop-shadow-2xl hover:scale-110 transition-transform duration-500">
            <FilterX className="w-12 h-12 mx-auto text-[var(--accent)] drop-shadow-[0_0_15px_var(--accent-glow)]" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">{t('noFilterTitle')}</h2>
          <p className="text-[1.05rem] opacity-70 font-medium max-w-md mx-auto">{t('noFilterDesc')}</p>
        </div>
      )}

      {/* Initial State */}
      {showInitial && (
        <div className="text-center py-32 px-6 text-[var(--text)] transition-all duration-700 animate-in fade-in zoom-in-95"
             style={{ margin: '5vh auto 0', maxWidth: '768px', width: '100%', borderRadius: '32px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div className="text-[5rem] mb-8 block drop-shadow-2xl hover:scale-110 hover:-rotate-3 transition-transform duration-500">
            <ScanSearch className="w-16 h-16 mx-auto text-[var(--accent)] drop-shadow-[0_10px_25px_var(--accent-glow)]" />
          </div>
          <h2 className="text-[1.8rem] font-bold mb-4 tracking-tight">{t('initialTitle') || 'Ready to Extract?'}</h2>
          <p className="text-[1.1rem] opacity-70 font-medium max-w-md mx-auto leading-relaxed">{t('initialText')}</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <Lightbox
          images={displayImages}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleLightboxNavigate}
          fileSizeCache={fileSizeCache}
        />
      )}

      <Toast />
    </div>
  );
}
