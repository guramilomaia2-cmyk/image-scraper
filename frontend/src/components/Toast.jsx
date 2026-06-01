import { useState, useCallback, useEffect, useRef } from 'react';

const TOAST_DURATION = 3000;

let addToastGlobal = null;

export function showToast(msg, duration = TOAST_DURATION) {
  if (addToastGlobal) addToastGlobal(msg, duration);
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef(null);

  const addToast = useCallback((msg, duration = TOAST_DURATION) => {
    setToasts([{ msg, id: Date.now() }]);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToasts([]);
    }, duration);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[var(--surface-solid)] border border-[var(--border)] rounded-lg px-6 py-3 text-sm font-medium text-[var(--text)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-toast-in"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
