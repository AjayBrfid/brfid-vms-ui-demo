import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { rupees } from '../utils/helpers';

const STATUSES = ['Submitted', 'Under Evaluation', 'Approved', 'Rejected'];

const KPI_GROUPS = [
  { label: 'Submitted', color: 'var(--primary)', bg: 'var(--primary-light)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> },
  { label: 'Under Evaluation', color: 'var(--info)', bg: 'var(--info-bg)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
  { label: 'Approved', color: 'var(--success)', bg: 'var(--success-bg)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
  { label: 'Rejected', color: 'var(--danger)', bg: 'var(--danger-bg)',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
];

export default function QuotationsPage() {
  const modal = useModal();
  const toast = useToast();
  const [quotes] = useState(() => Store.get(SK.QUOTES) || []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    let rows = quotes;
    if (status) rows = rows.filter(q => q.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [quotes, search, status]);

  function viewQuote(id) {
    const list = Store.get(SK.QUOTES) || [];
    const q = list.find(x => x.id === id);
    if (!q) return;
    modal.show({
      title: `Quotation ${q.id}`,
      size: 'modal-lg',
      icon: 'primary',
      body: (
        <>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-item"><div className="detail-label">RFQ Reference</div><div className="detail-value">{q.rfqId}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{q.status}</Badge></div></div>
            <div className="detail-item"><div className="detail-label">Submitted Date</div><div className="detail-value">{q.submittedDate}</div></div>
            <div className="detail-item"><div className="detail-label">RFQ Closing Date</div><div className="detail-value">{q.rfqClosingDate}</div></div>
            <div className="detail-item"><div className="detail-label">Base Amount</div><div className="detail-value">{rupees(q.amount)}</div></div>
            <div className="detail-item"><div className="detail-label">GST Amount</div><div className="detail-value">{rupees(q.gst)}</div></div>
            <div className="detail-item"><div className="detail-label">Total Amount</div><div className="detail-value"><strong style={{ fontSize: 16, color: 'var(--text-dark)' }}>{rupees(q.totalAmount)}</strong></div></div>
            <div className="detail-item"><div className="detail-label">Delivery Days</div><div className="detail-value">{q.deliveryDays} days</div></div>
            <div className="detail-item"><div className="detail-label">Warranty</div><div className="detail-value">{q.warranty}</div></div>
            <div className="detail-item"><div className="detail-label">Payment Terms</div><div className="detail-value">{q.paymentTerms}</div></div>
            <div className="detail-item"><div className="detail-label">Transport Arrangement</div><div className="detail-value">{q.transportArrangement === 'vendor' ? 'Vendor arranges & pays freight' : 'Warehouse arranges & pays freight'}</div></div>
          </div>
          <div className="sep"></div>
          <div className="form-group"><div className="form-label">Remarks</div><p style={{ fontSize: '13.5px', color: 'var(--text-body)' }}>{q.remarks || 'N/A'}</p></div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={() => modal.close()}>Close</button>
          <button className="btn btn-primary" onClick={() => toast('Download', 'Quotation PDF downloaded.', 'success')}>Download PDF</button>
        </>
      ),
    });
  }

  const columns = [
    {
      key: 'id', label: 'Quotation No.', cls: 'td-mono',
      render: r => <span className="td-link" onClick={e => { e.stopPropagation(); viewQuote(r.id); }}>{r.id}</span>,
    },
    {
      key: 'rfqId', label: 'RFQ No.', cls: 'td-mono',
      render: r => <Link to="/rfqs" style={{ color: 'var(--primary)', fontWeight: 500 }} onClick={e => e.stopPropagation()}>{r.rfqId}</Link>,
    },
    {
      key: 'rfqTitle', label: 'Product Name',
      render: r => (
        <span style={{ maxWidth: 220, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.rfqTitle}>
          {r.rfqTitle}
        </span>
      ),
    },
    { key: 'submittedDate', label: 'Submitted Date' },
    { key: 'totalAmount', label: 'Total Amount', render: r => <strong>{rupees(r.totalAmount)}</strong> },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions',
      render: r => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="View" onClick={e => { e.stopPropagation(); viewQuote(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Quotations</span></div>
          <h1>My Quotations</h1>
          <p>Track all quotations you have submitted against RFQs.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {KPI_GROUPS.map(g => {
          const count = quotes.filter(q => q.status === g.label).length;
          return (
            <div
              key={g.label}
              className="kpi-card"
              style={{ '--kpi-color': g.color, '--kpi-bg': g.bg, cursor: 'pointer' }}
              onClick={() => setStatus(g.label)}
            >
              <div className="kpi-icon">{g.icon}</div>
              <div className="kpi-body">
                <div className="kpi-value">{count}</div>
                <div className="kpi-label">{g.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search quotations…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <DataTable columns={columns} data={filtered} rowsPerPage={10} onRowClick={row => viewQuote(row.id)} />
        </div>
      </div>
    </>
  );
}
