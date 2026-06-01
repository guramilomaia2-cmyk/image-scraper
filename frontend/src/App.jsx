import { useState } from 'react';
import { Search, Image as ImageIcon, Download, Loader2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import JSZip from 'jszip';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [pageTitle, setPageTitle] = useState('');
  const [downloadingUrl, setDownloadingUrl] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Use relative path for production API, absolute for local dev
  const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setImages([]);
    setPageTitle('');

    try {
      const response = await fetch(`${apiUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape the page');
      }

      if (data.images && data.images.length > 0) {
        setImages(data.images);
        setPageTitle(data.title || 'Extracted Images');
      } else {
        setError("No images found on this page.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImageBlob = async (imgUrl) => {
    try {
      const response = await fetch(`${apiUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imgUrl })
      });
      
      if (!response.ok) throw new Error('Failed to fetch image via API');
      
      const blob = await response.blob();
      return blob;
    } catch (err) {
      console.warn("API proxy failed, trying direct CORS proxy");
      const corsProxy = `https://corsproxy.io/?${encodeURIComponent(imgUrl)}`;
      const res = await fetch(corsProxy);
      if (!res.ok) throw new Error('CORS proxy failed');
      return await res.blob();
    }
  };

  const handleDownloadSingle = async (imgUrl, index) => {
    setDownloadingUrl(imgUrl);
    try {
      const blob = await downloadImageBlob(imgUrl);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      const ext = imgUrl.split('.').pop().split(/#|\?/)[0] || 'jpg';
      a.download = `image_${index + 1}.${ext.length <= 4 ? ext : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      alert('Failed to download image: ' + err.message);
    } finally {
      setDownloadingUrl(null);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      
      const downloadPromises = images.map(async (imgUrl, index) => {
        try {
          const blob = await downloadImageBlob(imgUrl);
          const ext = imgUrl.split('.').pop().split(/#|\?/)[0] || 'jpg';
          const filename = `image_${index + 1}.${ext.length <= 4 ? ext : 'jpg'}`;
          zip.file(filename, blob);
        } catch (e) {
          console.error(`Skipping ${imgUrl}`, e);
        }
      });

      await Promise.all(downloadPromises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const objUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'images'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      
    } catch (err) {
      alert('Failed to create ZIP: ' + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header section */}
        <div className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 text-blue-400 rounded-full mb-2">
            <ImageIcon size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Image Extractor Pro
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Extract high-resolution product images from any website bypassing protections.
          </p>
        </div>

        {/* Search Panel */}
        <div className="glass-panel rounded-2xl p-6 md:p-8">
          <form onSubmit={handleScrape} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL here (e.g. Amazon, TP-Link, Ray-Ban...)" 
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder:text-slate-500 text-lg"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !url}
              className="btn-primary py-4 px-8 rounded-xl text-lg min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Extracting...</span>
                </>
              ) : (
                <span>Extract Images</span>
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <div className="text-sm break-words whitespace-pre-wrap">{error}</div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 glass-panel rounded-xl p-4 px-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-200 truncate max-w-md">{pageTitle}</h2>
                <p className="text-sm text-slate-400">Found {images.length} images</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setImages([])} 
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  <Trash2 size={18} />
                  Clear
                </button>
                <button 
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {downloadingZip ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  Download ZIP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="group relative glass-panel rounded-xl overflow-hidden aspect-square flex items-center justify-center p-2 bg-slate-900/50">
                  {/* Checkerboard background for transparent PNGs */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #808080 25%, transparent 25%, transparent 75%, #808080 75%, #808080), repeating-linear-gradient(45deg, #808080 25%, #000 25%, #000 75%, #808080 75%, #808080)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
                  
                  <img 
                    src={imgUrl} 
                    alt={`Product ${idx}`} 
                    className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 flex items-center justify-center">
                    <button 
                      onClick={() => handleDownloadSingle(imgUrl, idx)}
                      disabled={downloadingUrl === imgUrl}
                      className="bg-blue-500 hover:bg-blue-400 text-white rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-200"
                    >
                      {downloadingUrl === imgUrl ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Download size={20} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
