import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SK } from '../services/storageKeys';
import { Store } from '../services/store';
import { fmt, rupees } from '../utils/helpers';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

const WARNING_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const DANGER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
const PO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const EXPORT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

const STATS_CONFIG = [
  {
    label: 'Pending', color: 'var(--warning)', bg: 'var(--warning-bg)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    ),
  },
  {
    label: 'Accepted', color: 'var(--primary)', bg: 'var(--primary-light)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    ),
  },
  {
    label: 'Rejected', color: 'var(--danger)', bg: 'var(--danger-bg)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
    ),
  },
];

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const thStyleRight = { ...thStyle, textAlign: 'right' };
const tdStyle = { padding: '10px 12px' };
const tdStyleRight = { ...tdStyle, textAlign: 'right' };

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const modal = useModal();
  const toast = useToast();

  const [pos, setPos] = useState(() => Store.get(SK.POS) || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [exportPeriod, setExportPeriod] = useState('week');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pos.filter(p => {
      const matchesSearch = !q || Object.values(p).some(v => String(v).toLowerCase().includes(q));
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pos, search, statusFilter]);

  const stats = useMemo(
    () => STATS_CONFIG.map(g => ({ ...g, count: pos.filter(p => p.status === g.label).length })),
    [pos]
  );

  function setPoStatus(id, status) {
    setPos(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, status } : p));
      Store.set(SK.POS, next);
      return next;
    });
  }

  function accept(id) {
    modal.show({
      title: 'Accept Purchase Order',
      size: 'modal-sm',
      icon: 'warning',
      iconSvg: WARNING_ICON,
      body: (
        <p style={{ color: 'var(--text-body)', fontSize: 14, lineHeight: 1.6 }}>
          Accept PO <strong>{id}</strong>? You commit to fulfil the order as per the specified terms.
        </p>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button
            className="btn btn-warning"
            onClick={() => {
              modal.close();
              setPoStatus(id, 'Accepted');
              toast('PO Accepted', `Purchase Order ${id} accepted successfully.`, 'success');
            }}
          >
            Confirm
          </button>
        </>
      ),
    });
  }

  function reject(id) {
    modal.show({
      title: 'Reject Purchase Order',
      size: 'modal-sm',
      icon: 'danger',
      iconSvg: DANGER_ICON,
      body: (
        <p style={{ color: 'var(--text-body)', fontSize: 14, lineHeight: 1.6 }}>
          Are you sure you want to reject PO <strong>{id}</strong>? This cannot be undone.
        </p>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              modal.close();
              setPoStatus(id, 'Rejected');
              toast('PO Rejected', `Purchase Order ${id} has been rejected.`, 'warning');
            }}
          >
            Confirm
          </button>
        </>
      ),
    });
  }

  function view(id) {
    const p = pos.find(x => x.id === id);
    if (!p) return;
    modal.show({
      title: 'Purchase Order ' + p.id,
      size: 'modal-xl',
      icon: 'success',
      iconSvg: PO_ICON,
      body: (
        <>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-item"><div className="detail-label">PO Date</div><div className="detail-value">{p.date}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{p.status}</Badge></div></div>
            <div className="detail-item"><div className="detail-label">Buyer</div><div className="detail-value">{p.buyer}</div></div>
            <div className="detail-item"><div className="detail-label">Delivery Date</div><div className="detail-value">{p.deliveryDate}</div></div>
            <div className="detail-item"><div className="detail-label">Payment Terms</div><div className="detail-value">{p.paymentTerms}</div></div>
            <div className="detail-item"><div className="detail-label">Quotation Ref.</div><div className="detail-value">{p.quotationId}</div></div>
            <div className="detail-item">
              <div className="detail-label">Transport Arrangement</div>
              <div className="detail-value">{p.transportArrangement === 'vendor' ? 'Vendor arranges & pays freight' : 'Warehouse arranges & pays freight'}</div>
            </div>
            {p.transportArrangement === 'vendor' && p.freightDetails ? (
              <>
                <div className="detail-item">
                  <div className="detail-label">Transporter</div>
                  <div className="detail-value">
                    {p.freightDetails.transporterName}
                    {p.freightDetails.driverName ? ' · ' + p.freightDetails.driverName : ''}
                    {' '}(est. {rupees(p.freightDetails.estimatedFreightAmount)})
                  </div>
                </div>
                <div className="detail-item"><div className="detail-label">Driver Contact</div><div className="detail-value">{p.freightDetails.driverContact || 'N/A'}</div></div>
              </>
            ) : null}
          </div>
          <div className="detail-item" style={{ marginBottom: 16 }}>
            <div className="detail-label">Delivery Address</div>
            <div className="detail-value">{p.deliveryAddress}</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#FAFBFC', borderBottom: '2px solid var(--border)' }}>
                <th style={thStyle}>Item Description</th>
                <th style={thStyleRight}>Qty</th>
                <th style={thStyleRight}>Unit Rate</th>
                <th style={thStyleRight}>Amount</th>
              </tr>
            </thead>
            <tbody style={{ border: '1px solid var(--border)' }}>
              {p.items.map((it, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{it.desc}</td>
                  <td style={tdStyleRight}>{it.qty} {it.unit}</td>
                  <td style={tdStyleRight}>{rupees(it.rate)}</td>
                  <td style={tdStyleRight}>{rupees(it.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal</td>
                <td style={tdStyleRight}>{rupees(p.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>GST (18%)</td>
                <td style={tdStyleRight}>{rupees(p.gst)}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>Discount</td>
                <td style={{ ...tdStyleRight, color: 'var(--success)' }}>({rupees(p.discount)})</td>
              </tr>
              <tr style={{ background: '#F0F4F8', fontWeight: 700 }}>
                <td colSpan={3} style={{ textAlign: 'right', padding: '10px 12px', fontSize: 14 }}>Grand Total</td>
                <td style={{ textAlign: 'right', padding: '10px 12px', fontSize: 16, color: 'var(--primary)' }}>{rupees(p.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="form-group">
            <div className="form-label">Notes</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-body)' }}>{p.notes}</p>
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Close</button>
          <button className="btn btn-primary" onClick={() => toast('Download', 'PO PDF downloaded.', 'success')}>Download PDF</button>
          {p.status === 'Accepted' ? (
            <button className="btn btn-primary" onClick={() => { modal.close(); navigate(`/raise-invoice?po=${p.id}`); }}>Raise Invoice</button>
          ) : null}
          {p.status === 'Pending' ? (
            <>
              <button className="btn btn-success" onClick={() => { modal.close(); accept(p.id); }}>Accept PO</button>
              <button className="btn btn-outline-danger" onClick={() => { modal.close(); reject(p.id); }}>Reject</button>
            </>
          ) : null}
        </>
      ),
    });
  }

  function computeExportRange(period) {
    const now = new Date();
    let start, end;
    if (period === 'week') {
      start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(now.getDate() - now.getDay());
      end = new Date(start); end.setDate(start.getDate() + 6);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }
    return { start, end };
  }

  function doExport(period) {
    const label = period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year';
    modal.close();
    toast('Export', `Exporting Purchase Orders for ${label} to Excel…`, 'info');
  }

  function openExportModal(period) {
    const p = period || exportPeriod;
    const { start, end } = computeExportRange(p);
    modal.show({
      title: 'Export Purchase Orders',
      size: 'modal-sm',
      icon: 'primary',
      iconSvg: EXPORT_ICON,
      body: (
        <>
          <div className="form-group">
            <label className="form-label">Export Range</label>
            <select
              className="form-control"
              value={p}
              onChange={(e) => { setExportPeriod(e.target.value); openExportModal(e.target.value); }}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span className="info-box-text">From <strong>{fmt(start)}</strong> to <strong>{fmt(end)}</strong></span>
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={() => doExport(p)}>Export</button>
        </>
      ),
    });
  }

  function invoiceCol(r) {
    const enabled = r.status === 'Accepted';
    return (
      <button
        className="btn btn-sm btn-primary"
        disabled={!enabled}
        title={enabled ? '' : 'Available once the PO is approved'}
        onClick={(e) => { e.stopPropagation(); if (enabled) navigate(`/raise-invoice?po=${r.id}`); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
        Raise Invoice
      </button>
    );
  }

  function actionsCol(r) {
    const isPending = r.status === 'Pending';
    return (
      <div className="table-actions">
        <button className="action-btn" data-tooltip="View PO" onClick={(e) => { e.stopPropagation(); view(r.id); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
        <button className="action-btn" data-tooltip="Download PDF" onClick={(e) => { e.stopPropagation(); toast('Download', 'PO PDF downloaded.', 'success'); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        </button>
        {isPending ? (
          <button className="action-btn success" data-tooltip="Accept" onClick={(e) => { e.stopPropagation(); accept(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          </button>
        ) : null}
        {isPending ? (
          <button className="action-btn danger" data-tooltip="Reject" onClick={(e) => { e.stopPropagation(); reject(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        ) : null}
      </div>
    );
  }

  const columns = [
    { key: 'id', label: 'PO Number', cls: 'td-mono', render: r => <span className="td-link" onClick={(e) => { e.stopPropagation(); view(r.id); }}>{r.id}</span> },
    { key: 'date', label: 'PO Date' },
    { key: 'buyer', label: 'Buyer', render: r => <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.buyer}</span> },
    { key: 'grandTotal', label: 'Grand Total', render: r => <strong>{rupees(r.grandTotal)}</strong> },
    { key: 'deliveryDate', label: 'Delivery Date' },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    { key: '_invoice', label: 'Invoice', render: invoiceCol },
    { key: '_actions', label: 'Actions', render: actionsCol },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Purchase Orders</span></div>
          <h1>Purchase Orders</h1>
          <p>Purchase Orders issued by Warehouse. Accept or reject POs and track fulfilment.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map(g => (
          <div
            key={g.label}
            className="card"
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            onClick={() => setStatusFilter(g.label)}
          >
            <div className="kpi-icon" style={{ '--kpi-color': g.color, '--kpi-bg': g.bg }}>{g.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{g.count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{g.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search purchase orders…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Accepted</option>
              <option>Rejected</option>
            </select>
          </div>
          <div className="table-spacer"></div>
          <button className="btn btn-sm btn-secondary" onClick={() => openExportModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
        </div>
        <div className="table-wrapper">
          <DataTable columns={columns} data={filtered} rowsPerPage={10} onRowClick={(row) => view(row.id)} />
        </div>
      </div>
    </>
  );
}
