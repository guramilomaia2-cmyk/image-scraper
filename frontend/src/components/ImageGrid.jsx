import ImageCard from './ImageCard';

export default function ImageGrid({
  images,
  selectedUrls,
  onToggleSelect,
  onOpenLightbox,
  gridSize,
  fileSizeCache,
}) {
  return (
    <div
      className="grid gap-3.5"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`,
      }}
    >
      {images.map((url, i) => (
        <ImageCard
          key={url}
          url={url}
          index={i}
          isSelected={selectedUrls.has(url)}
          onToggleSelect={onToggleSelect}
          onOpenLightbox={onOpenLightbox}
          sizeStr={fileSizeCache[url] || ''}
        />
      ))}
    </div>
  );
}
