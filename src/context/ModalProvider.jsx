import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ModalContext = createContext(null);

const DEFAULT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

export function ModalProvider({ children }) {
  const [config, setConfig] = useState(null);

  const close = useCallback(() => setConfig(null), []);
  const show = useCallback((cfg) => setConfig(cfg), []);

  useEffect(() => {
    document.body.style.overflow = config ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [config]);

  return (
    <ModalContext.Provider value={{ show, close }}>
      {children}
      {config ? (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className={`modal ${config.size || ''}`} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className={`modal-header-icon ${config.icon || 'primary'}`}
                dangerouslySetInnerHTML={{ __html: config.iconSvg || DEFAULT_ICON }} />
              <div className="modal-title">{config.title}</div>
              <button className="modal-close" onClick={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal-body">{config.body}</div>
            {config.footer ? <div className="modal-footer">{config.footer}</div> : null}
          </div>
        </div>
      ) : null}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
}
