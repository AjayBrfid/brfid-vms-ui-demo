import { useMemo, useState } from 'react';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { useToast } from '../context/ToastProvider';

const TYPE_ICON = {
  rfq: {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    bg: 'var(--primary-light)', color: 'var(--primary)',
  },
  quotation: {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    bg: 'var(--info-bg)', color: 'var(--info)',
  },
  po: {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    bg: 'var(--success-bg)', color: 'var(--success)',
  },
  delivery: {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    bg: 'var(--warning-bg)', color: 'var(--warning)',
  },
  invoice: {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    bg: 'var(--orange-bg)', color: 'var(--orange)',
  },
  payment: {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    bg: 'var(--success-bg)', color: 'var(--success)',
  },
};

function typeIcon(type) {
  return TYPE_ICON[type] || TYPE_ICON.rfq;
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'rfq', label: 'RFQs' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'po', label: 'Purchase Orders' },
  { key: 'delivery', label: 'Deliveries' },
  { key: 'payment', label: 'Payments' },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(() => Store.get(SK.NOTIFS) || []);
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const unreadCount = notifs.filter(n => n.unread).length;

  const filtered = useMemo(
    () => (filter === 'all' ? notifs : notifs.filter(n => n.type === filter)),
    [notifs, filter]
  );

  function markRead(id) {
    const all = Store.get(SK.NOTIFS) || [];
    const i = all.findIndex(x => x.id === id);
    if (i > -1 && all[i].unread) {
      all[i].unread = false;
      Store.set(SK.NOTIFS, all);
      setNotifs(all);
    }
  }

  function markAllRead() {
    const all = Store.get(SK.NOTIFS) || [];
    all.forEach(n => { n.unread = false; });
    Store.set(SK.NOTIFS, all);
    setNotifs(all);
    toast('Done', 'All notifications marked as read.', 'success');
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Notifications</span></div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'All read'}</p>
        </div>
        <button className="btn btn-secondary" onClick={markAllRead}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="20 6 9 17 4 12" /></svg>
          Mark All as Read
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn${filter === t.key ? ' active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="notif-list">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <h3>No notifications</h3>
              <p>No notifications in this category.</p>
            </div>
          ) : (
            filtered.map(n => {
              const t = typeIcon(n.type);
              return (
                <div
                  key={n.id}
                  className={`notif-item${n.unread ? ' unread' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="notif-icon" style={{ background: t.bg }}>
                    <span style={{ color: t.color }} dangerouslySetInnerHTML={{ __html: t.icon }} />
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-text">{n.text}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                  {n.unread ? <div className="notif-unread-dot" /> : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
