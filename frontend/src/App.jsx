import { useState, useCallback, useRef } from 'react';
import { useLanguage } from './hooks/useLanguage';
import { getFilename, parseSizeStr, fetchFileSize, fetchImageBlob, copyToClipboard } from './utils/imageUtils';
import { addToHistory } from './components/SearchBar';
import { showToast } from './components/Toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  const [readyZipUrl, setReadyZipUrl] = useState(null);
  const [readyZipName, setReadyZipName] = useState('');
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
      const safeZipName = zipName.replace(/[^a-z0-9\-_]/gi, '_');
      
      const zipUrl = URL.createObjectURL(content);
      setReadyZipUrl(zipUrl);
      setReadyZipName(`${safeZipName}.zip`);
      
      saveAs(content, `${safeZipName}.zip`);

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
          className={`flex items-center gap-3 px-6 py-4 text-[0.95rem] font-bold mb-6 mx-6 sm:mx-auto w-max max-w-[calc(100%-48px)] sm:max-w-full transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${
            status.type === 'error'
              ? 'text-[var(--error)]'
              : 'text-[var(--success)]'
          }`}
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: status.type === 'error' ? '1px solid rgba(255,59,48,0.3)' : '1px solid rgba(52,199,89,0.3)',
            boxShadow: status.type === 'error' ? '0 8px 32px rgba(255,59,48,0.15)' : '0 8px 32px rgba(52,199,89,0.15)',
            borderRadius: '28px'
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

      {/* Sticky Controls Wrapper */}
      {showControls && !isLoading && (
        <div className="sticky z-40 transition-all duration-300" style={{ top: '177px' }}>
          <ControlsBar
            sortValue={sortValue}
            onSortChange={handleSortChange}
            minSize={minSize}
            onMinSizeChange={handleMinSizeChange}
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
          />

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
        </div>
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
        <div className="text-center py-16 px-6 text-[var(--text)] transition-all duration-700 animate-in fade-in zoom-in-95 flex flex-col items-center justify-center"
             style={{ margin: '5vh auto 0', maxWidth: '800px', width: '100%', borderRadius: '32px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <h2 className="text-[2rem] font-bold mb-4 tracking-tight text-center w-full">{t('appTitle')}</h2>
          <p className="text-[1.1rem] opacity-70 font-medium max-w-2xl text-center leading-relaxed mb-10">
            {t('aboutText')}
          </p>
          
          <div className="text-center bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-3xl p-8 md:p-10 max-w-3xl w-full border border-[var(--glass-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <h3 className="text-[1.3rem] font-bold mb-10 text-[var(--accent)] flex items-center justify-center gap-3">
              <ScanSearch className="w-6 h-6" />
              {t('instructionsTitle')}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[0.95rem] opacity-90 font-medium">
              <li className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-sm">1</div>
                <div>
                  <h4 className="font-bold text-[1.1rem] mb-2">{t('instruction1Title')}</h4>
                  <p className="opacity-80 leading-relaxed">{t('instruction1Desc')}</p>
                </div>
              </li>
              <li className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-sm">2</div>
                <div>
                  <h4 className="font-bold text-[1.1rem] mb-2">{t('instruction2Title')}</h4>
                  <p className="opacity-80 leading-relaxed">{t('instruction2Desc')}</p>
                </div>
              </li>
              <li className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-sm">3</div>
                <div>
                  <h4 className="font-bold text-[1.1rem] mb-2">{t('instruction3Title')}</h4>
                  <p className="opacity-80 leading-relaxed">{t('instruction3Desc')}</p>
                </div>
              </li>
            </ul>
          </div>
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

      {/* Fallback Manual ZIP Download Button */}
      {readyZipUrl && !isDownloading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[var(--surface)] border border-[var(--accent)] p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3 backdrop-blur-md">
            <p className="text-[0.95rem] font-semibold text-[var(--text)]">
              {lang === 'ka' ? 'ბრაუზერმა არ გადმოწერა ავტომატურად?' : 'Browser blocked auto-download?'}
            </p>
            <div className="flex gap-3">
              <a 
                href={readyZipUrl} 
                download={readyZipName}
                onClick={() => {
                  showToast(lang === 'ka' ? 'ჩამოტვირთვა დაიწყო!' : 'Download started!');
                  setTimeout(() => setReadyZipUrl(null), 3000);
                }}
                className="px-6 py-2 bg-[var(--accent)] text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
              >
                {lang === 'ka' ? 'ხელით გადმოწერა (Click to Save)' : 'Click to Save ZIP'}
              </a>
              <button 
                onClick={() => setReadyZipUrl(null)}
                className="px-4 py-2 bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-semibold rounded-lg hover:bg-black/20 transition-colors"
              >
                {lang === 'ka' ? 'დამალვა' : 'Hide'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
}
