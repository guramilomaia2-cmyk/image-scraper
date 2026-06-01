import { useState, useRef, useEffect } from 'react';
import { Grid3x3, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function ControlsBar({ sortValue, onSortChange, minSize, onMinSizeChange, gridSize, onGridSizeChange }) {
  const { t } = useLanguage();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions = [
    { value: 'default', label: t('sortDefault') },
    { value: 'name-asc', label: t('sortNameAsc') },
    { value: 'name-desc', label: t('sortNameDesc') },
    { value: 'size-desc', label: t('sortSizeDesc') },
    { value: 'size-asc', label: t('sortSizeAsc') }
  ];

  const currentSortLabel = sortOptions.find(o => o.value === sortValue)?.label;

  return (
    <div className="relative z-50 mb-4 mx-2 sm:mx-6 transition-all duration-300">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow)',
          borderRadius: '28px',
          zIndex: -1
        }}
      />
      
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-6">
        <div className="flex flex-wrap items-center gap-4">
        
        {/* Custom Glass Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className={`flex items-center justify-between gap-3 h-[50px] min-w-[210px] bg-[var(--glass-bg)] border ${isSortOpen ? 'border-[var(--accent)] ring-2 ring-[var(--accent-glow)]' : 'border-[var(--glass-border)]'} rounded-[16px] text-[var(--text)] font-bold text-[1.05rem] px-5 cursor-pointer outline-none transition-all duration-300 hover:bg-[var(--glass-hover)] shadow-[var(--glass-shadow)]`}
          >
            <span className="truncate">{currentSortLabel}</span>
            <ChevronDown className={`w-[20px] h-[20px] transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
          </button>

          {isSortOpen && (
            <div 
              className="absolute top-[calc(100%+8px)] left-0 w-[240px] rounded-[20px] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.2)'
              }}
            >
              <div className="py-2 flex flex-col">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSortChange(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-[1rem] font-bold transition-colors duration-200 flex items-center justify-between ${
                      sortValue === opt.value 
                        ? 'bg-[var(--accent)] text-white' 
                        : 'text-[var(--text)] hover:bg-[var(--glass-hover)]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {sortValue === opt.value && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-[var(--border)] hidden sm:block opacity-50"></div>

        <div className="flex items-center gap-3 text-[1.05rem] text-[var(--text-muted)] font-bold">
          <label className="whitespace-nowrap">{t('minSize')}</label>
          <div className="relative">
            <input
              type="number"
              value={minSize}
              onChange={(e) => onMinSizeChange(e.target.value)}
              min="0"
              max="9999"
              className="w-[100px] h-[50px] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[16px] text-[var(--text)] font-bold text-[1.05rem] pl-5 pr-9 outline-none transition-all duration-300 hover:bg-[var(--glass-hover)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] shadow-[var(--glass-shadow)]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[0.95rem] pointer-events-none font-medium">px</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-[var(--glass-bg)] px-6 h-[50px] rounded-[16px] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] hover:bg-[var(--glass-hover)] transition-all duration-300" title="Grid size">
        <Grid3x3 className="w-6 h-6 text-[var(--text-faint)]" />
        <input
          type="range"
          min="140"
          max="400"
          value={gridSize}
          onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
          className="w-36 h-2 bg-[var(--border)] rounded-full outline-none cursor-pointer"
        />
      </div>
      </div>
    </div>
  );
}
