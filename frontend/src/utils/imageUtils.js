export function getFilename(url) {
  try {
    if (url.startsWith('data:')) return 'image.png';
    const p = new URL(url).pathname;
    const base = p.split('/').pop();
    return base && base.length > 1 ? decodeURIComponent(base) : 'image';
  } catch {
    return 'image';
  }
}

export function getExtension(url) {
  if (!url) return '';
  if (url.startsWith('data:image/')) {
    const m = url.match(/data:image\/([a-z0-9+]+)/i);
    return m ? m[1].toLowerCase() : '';
  }
  const clean = url.toLowerCase().split('?')[0].split('#')[0];
  const m = clean.match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function parseSizeStr(str) {
  if (!str) return 0;
  const m = str.match(/([\d.]+)\s*(B|KB|MB)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  if (u === 'MB') return n * 1024 * 1024;
  if (u === 'KB') return n * 1024;
  return n;
}

export async function fetchImageBlob(url) {
  if (url.startsWith('data:')) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Data URI fetch failed');
    return await resp.blob();
  }

  // Try our backend proxy
  try {
    const resp = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) return await resp.blob();
  } catch (e) {
    console.warn('Backend proxy failed', e);
  }

  // Fallback: CORS proxy
  try {
    const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) return await resp.blob();
  } catch (e) {
    console.warn('allorigins failed', e);
  }

  try {
    const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) return await resp.blob();
  } catch (e) {
    console.warn('corsproxy failed', e);
  }

  throw new Error('All proxy attempts failed for ' + url);
}

export async function fetchFileSize(url) {
  try {
    let resp = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    if (!resp.ok && resp.status === 405) {
      const controller = new AbortController();
      resp = await fetch(url, { method: 'GET', signal: controller.signal });
      controller.abort();
    }
    if (resp.body) await resp.body.cancel();
    const cl = resp.headers.get('content-length');
    return cl ? formatBytes(parseInt(cl)) : '';
  } catch {
    return '';
  }
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

export async function convertBlobToPng(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) resolve(pngBlob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed for conversion'));
    };
    img.src = url;
  });
}
