import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { svgIcon } from '../components/Icon';

const ToastContext = createContext(null);

const ICONS = {
  success: svgIcon('check-circle'),
  danger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  warning: svgIcon('alert-triangle'),
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const remove = useCallback((id) => {
    setToasts(list => list.map(t => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 300);
  }, []);

  const show = useCallback((title, message, type = 'info', duration = 4000) => {
    const id = ++seq.current;
    setToasts(list => [...list, { id, title, message, type, removing: false }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}${t.removing ? ' removing' : ''}`}>
            <div className="toast-icon" dangerouslySetInnerHTML={{ __html: ICONS[t.type] || ICONS.info }} />
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.message ? <div className="toast-message">{t.message}</div> : null}
            </div>
            <button className="toast-close" onClick={() => remove(t.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used within a ToastProvider');
  return show;
}
