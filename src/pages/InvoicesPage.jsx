import { useMemo, useState } from 'react';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { fmt, rupees } from '../utils/helpers';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

const SUMMARY_GROUPS = [
  {
    label: 'Approved', color: 'var(--primary)', bg: 'var(--primary-light)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  {
    label: 'Payment Pending', color: 'var(--orange)', bg: 'var(--orange-bg)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  },
  {
    label: 'Rejected', color: 'var(--danger)', bg: 'var(--danger-bg)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  },
];

export default function InvoicesPage() {
  const modal = useModal();
  const toast = useToast();

  const [invoices, setInvoices] = useState(() => Store.get(SK.INVOICES) || []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    let rows = invoices;
    if (status) rows = rows.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [invoices, search, status]);

  function view(id) {
    const inv = invoices.find(x => x.id === id);
    if (!inv) return;
    modal.show({
      title: 'Invoice ' + inv.id,
      icon: 'primary',
      body: (
        <div className="detail-grid">
          <div className="detail-item"><div className="detail-label">PO Reference</div><div className="detail-value">{inv.poId}</div></div>
          <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{inv.status}</Badge></div></div>
          <div className="detail-item"><div className="detail-label">Invoice Date</div><div className="detail-value">{inv.invoiceDate}</div></div>
          <div className="detail-item"><div className="detail-label">Due Date</div><div className="detail-value">{inv.dueDate}</div></div>
          <div className="detail-item"><div className="detail-label">Base Amount</div><div className="detail-value">{rupees(inv.amount)}</div></div>
          <div className="detail-item"><div className="detail-label">GST (18%)</div><div className="detail-value">{rupees(inv.gst)}</div></div>
          <div className="detail-item"><div className="detail-label">Total Amount</div><div className="detail-value"><strong style={{ fontSize: 16, color: 'var(--primary)' }}>{rupees(inv.totalAmount)}</strong></div></div>
        </div>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Close</button>
          <button className="btn btn-primary" onClick={() => toast('Download', 'Invoice PDF downloaded.', 'success')}>Download PDF</button>
        </>
      ),
    });
  }

  function uploadModal() {
    const pos = Store.get(SK.POS) || [];
    let poEl, dateEl, numEl, amountEl, gstEl, fileEl, fileNameEl;

    function submit() {
      const po = poEl?.value;
      const amount = parseFloat(amountEl?.value || 0);
      const gst = parseFloat(gstEl?.value || 0);
      const list = Store.get(SK.INVOICES) || [];
      const dateVal = dateEl?.value;
      list.unshift({
        id: `INV-2026-${String(list.length + 1).padStart(3, '0')}`,
        poId: po,
        invoiceDate: dateVal ? fmt(new Date(dateVal)) : fmt(new Date()),
        dueDate: fmt(new Date(Date.now() + 30 * 86400000)),
        amount, gst, totalAmount: amount + gst,
        status: 'Payment Pending', hasFile: true,
      });
      Store.set(SK.INVOICES, list);
      setInvoices(list);
      modal.close();
      toast('Invoice Uploaded', 'Invoice submitted for approval.', 'success');
    }

    modal.show({
      title: 'Upload Invoice',
      icon: 'primary',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
      body: (
        <>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">PO Number</label>
              <select className="form-control" ref={el => (poEl = el)}>
                {pos.map(p => <option key={p.id}>{p.id}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input className="form-control" type="date" ref={el => (dateEl = el)} />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input className="form-control" ref={el => (numEl = el)} placeholder="Your invoice reference no." />
            </div>
            <div className="form-group">
              <label className="form-label">Base Amount (₹)</label>
              <input className="form-control" type="number" ref={el => (amountEl = el)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">GST Amount (₹)</label>
              <input className="form-control" type="number" ref={el => (gstEl = el)} placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Document</label>
            <div className="file-upload" onClick={() => fileEl?.click()}>
              <div className="file-upload-icon">📄</div>
              <div className="file-upload-text">Click to upload invoice</div>
              <div className="file-upload-hint">PDF up to 10MB</div>
              <div className="file-upload-name" ref={el => (fileNameEl = el)}></div>
            </div>
            <input
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              ref={el => (fileEl = el)}
              onChange={e => { if (fileNameEl) fileNameEl.textContent = e.target.files[0]?.name || ''; }}
            />
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Upload Invoice</button>
        </>
      ),
    });
  }

  const summary = useMemo(() => SUMMARY_GROUPS.map(g => {
    const rows = invoices.filter(i => i.status === g.label);
    return { ...g, count: rows.length, amount: rows.reduce((s, i) => s + i.totalAmount, 0) };
  }), [invoices]);

  const columns = [
    { key: 'id', label: 'Invoice No.', cls: 'td-mono', render: r => <span className="td-link" onClick={(e) => { e.stopPropagation(); view(r.id); }}>{r.id}</span> },
    { key: 'poId', label: 'PO Number', cls: 'td-mono' },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'totalAmount', label: 'Invoice Amount', render: r => <strong>{rupees(r.totalAmount)}</strong> },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions', render: r => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="View" onClick={(e) => { e.stopPropagation(); view(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          <button className="action-btn" data-tooltip="Download" onClick={(e) => { e.stopPropagation(); toast('Download', 'Invoice PDF downloaded.', 'success'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Invoices</span></div>
          <h1>Invoices</h1>
          <p>Upload and manage invoices for completed deliveries. Track payment status.</p>
        </div>
        <button className="btn btn-primary" onClick={uploadModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Upload Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        {summary.map(g => (
          <div
            key={g.label}
            className="kpi-card"
            style={{ '--kpi-color': g.color, '--kpi-bg': g.bg, cursor: 'pointer' }}
            onClick={() => setStatus(g.label)}
          >
            <div className="kpi-icon" dangerouslySetInnerHTML={{ __html: g.icon }} />
            <div className="kpi-body">
              <div className="kpi-value">{g.count}</div>
              <div className="kpi-label">{g.label}</div>
              <span className="kpi-trend up" style={{ background: g.bg, color: g.color }}>₹{(g.amount / 100000).toFixed(1)}L</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Approved</option>
              <option>Payment Pending</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <DataTable columns={columns} data={filtered} rowsPerPage={10} />
        </div>
      </div>
    </div>
  );
}
