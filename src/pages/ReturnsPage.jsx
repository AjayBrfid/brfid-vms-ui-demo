import { useMemo, useState } from 'react';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { fmt, rupees } from '../utils/helpers';
import { TransportPayments } from '../services/transportPayments';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import FreightCard from '../components/FreightCard';
import { svgIcon } from '../components/Icon';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

const STATUS_OPTIONS = ['Initiated', 'Approved', 'In Transit', 'Received', 'Refunded', 'Rejected'];

// Note: there is deliberately no "Refunded" stat tile here, mirroring returns.html — Refunded is
// still a valid status (and still selectable in the filter dropdown), it's just not one of the tiles.
const STAT_GROUPS = [
  { label: 'Initiated', color: 'var(--gray)', bg: 'var(--gray-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>` },
  { label: 'Approved', color: 'var(--primary)', bg: 'var(--primary-light)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>` },
  { label: 'In Transit', color: 'var(--warning)', bg: 'var(--warning-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>` },
  { label: 'Received', color: 'var(--info)', bg: 'var(--info-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>` },
  { label: 'Rejected', color: 'var(--danger)', bg: 'var(--danger-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
];

const SHIP_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

export default function ReturnsPage() {
  const modal = useModal();
  const toast = useToast();
  const [rets, setRets] = useState(() => Store.get(SK.RETURNS) || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  function refresh() { setRets(Store.get(SK.RETURNS) || []); }

  const filtered = useMemo(() => {
    let rows = rets;
    if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [rets, search, statusFilter]);

  function view(id) {
    const list = Store.get(SK.RETURNS) || [];
    const r = list.find(x => x.id === id);
    if (!r) return;
    const payment = TransportPayments.getFor('return', r.id);
    modal.show({
      title: 'Return ' + r.id,
      size: 'modal-lg',
      icon: 'primary',
      body: (
        <>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-item"><div className="detail-label">PO Number</div><div className="detail-value td-mono">{r.poId}</div></div>
            <div className="detail-item"><div className="detail-label">Invoice Number</div><div className="detail-value td-mono">{r.invoiceId}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{r.status}</Badge></div></div>
            <div className="detail-item"><div className="detail-label">Return Date</div><div className="detail-value">{r.returnDate}</div></div>
            <div className="detail-item"><div className="detail-label">Item</div><div className="detail-value">{r.itemDesc}</div></div>
            <div className="detail-item"><div className="detail-label">Quantity</div><div className="detail-value">{r.quantity} {r.unit}</div></div>
            <div className="detail-item"><div className="detail-label">Warehouse Location</div><div className="detail-value">{r.warehouseLocation}</div></div>
            <div className="detail-item"><div className="detail-label">Refund Amount</div><div className="detail-value" style={{ fontWeight: 600 }}>{rupees(r.refundAmount)}</div></div>
          </div>
          <div className="sep" />
          <div className="detail-item" style={{ marginBottom: 14 }}><div className="detail-label">Reason for Return</div><div className="detail-value">{r.reason}</div></div>
          <div className="detail-item"><div className="detail-label">Remarks</div><div className="detail-value">{r.remarks}</div></div>
          {r.pickupDate ? (
            <>
              <div className="sep" />
              <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ship-timeline-heading-icon" dangerouslySetInnerHTML={{ __html: svgIcon('truck') }} /> Return Shipment
              </h4>
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Pickup Date</div><div className="detail-value">{r.pickupDate}</div></div>
                <div className="detail-item"><div className="detail-label">Transporter</div><div className="detail-value">{r.transporter}</div></div>
                <div className="detail-item"><div className="detail-label">Driver Name</div><div className="detail-value">{r.driverName || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Driver Contact</div><div className="detail-value">{r.driverContact || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Vehicle No.</div><div className="detail-value">{r.vehicleNo || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Tracking No.</div><div className="detail-value td-mono">{r.trackingNo || 'N/A'}</div></div>
              </div>
            </>
          ) : null}
          <FreightCard payment={payment} />
        </>
      ),
      footer: <button className="btn btn-secondary" onClick={modal.close}>Close</button>,
    });
  }

  // Warehouse raises the return request; the vendor reviews it here and either approves it
  // (they'll then arrange the return transport themselves) or rejects it outright. No fault
  // category / liability selection step — the vendor is always liable for return transport.
  function reviewModal(id) {
    const list = Store.get(SK.RETURNS) || [];
    const r = list.find(x => x.id === id);
    if (!r) return;
    let remarksEl;

    function approveReturn() {
      const remarks = remarksEl?.value || '';
      const l = Store.get(SK.RETURNS) || [];
      const i = l.findIndex(x => x.id === id);
      if (i === -1) return;
      l[i].status = 'Approved';
      if (remarks) l[i].reviewRemarks = remarks;
      Store.set(SK.RETURNS, l);
      TransportPayments.approve('return', id, l[i]);
      modal.close();
      toast('Return Approved', `Return ${id} approved. Create the return shipment when ready.`, 'success');
      refresh();
    }

    function rejectReturn() {
      const remarks = remarksEl?.value || '';
      const l = Store.get(SK.RETURNS) || [];
      const i = l.findIndex(x => x.id === id);
      if (i === -1) return;
      l[i].status = 'Rejected';
      if (remarks) l[i].reviewRemarks = remarks;
      Store.set(SK.RETURNS, l);
      modal.close();
      toast('Return Rejected', `Return ${id} has been rejected.`, 'success');
      refresh();
    }

    modal.show({
      title: 'Review Return Request ' + id,
      size: 'modal-sm',
      icon: 'primary',
      body: (
        <>
          <div className="detail-item" style={{ marginBottom: 14 }}><div className="detail-label">Reason for Return</div><div className="detail-value">{r.reason}</div></div>
          <div className="detail-item" style={{ marginBottom: 14 }}><div className="detail-label">Item</div><div className="detail-value">{r.itemDesc} — {r.quantity} {r.unit}</div></div>
          <p style={{ color: 'var(--text-body)', fontSize: 13.5, lineHeight: 1.6 }}>
            Approving this request means you'll arrange and pay for the return transport. You'll be able to
            create the return shipment once approved.
          </p>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-control" ref={el => (remarksEl = el)} rows={2} placeholder="Optional notes for this decision" />
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={rejectReturn}>Reject</button>
          <button className="btn btn-primary" onClick={approveReturn}>Approve</button>
        </>
      ),
    });
  }

  function createShipmentModal(id) {
    const list = Store.get(SK.RETURNS) || [];
    const r = list.find(x => x.id === id);
    if (!r) return;
    let dateEl, transEl, driverEl, driverContactEl, vehEl, trackEl, remarksEl;

    function submit() {
      const dateVal = dateEl?.value;
      const transporter = transEl?.value;
      const l = Store.get(SK.RETURNS) || [];
      const i = l.findIndex(x => x.id === id);
      if (i === -1) return;
      l[i].status = 'In Transit';
      l[i].pickupDate = dateVal ? fmt(new Date(dateVal)) : fmt(new Date());
      l[i].transporter = transporter || '';
      l[i].driverName = driverEl?.value || '';
      l[i].driverContact = driverContactEl?.value || '';
      l[i].vehicleNo = vehEl?.value || '';
      l[i].trackingNo = trackEl?.value || '';
      l[i].shipmentRemarks = remarksEl?.value || '';
      Store.set(SK.RETURNS, l);

      TransportPayments.recordTransporter('return', id, transporter);
      modal.close();
      toast('Shipment Created', `Return shipment for ${id} created successfully.`, 'success');
      refresh();
    }

    modal.show({
      title: 'Create Return Shipment for ' + id,
      size: 'modal-lg',
      icon: 'primary',
      iconSvg: SHIP_ICON_SVG,
      body: (
        <>
          <div className="form-row form-row-2">
            <div className="form-group"><label className="form-label">Pickup Date</label><input className="form-control" type="date" ref={el => (dateEl = el)} /></div>
            <div className="form-group"><label className="form-label">Transporter</label><input className="form-control" ref={el => (transEl = el)} placeholder="Logistics company name" /></div>
            <div className="form-group"><label className="form-label">Driver Name</label><input className="form-control" ref={el => (driverEl = el)} placeholder="Driver's full name" /></div>
            <div className="form-group"><label className="form-label">Driver Contact Number</label><input className="form-control" type="tel" ref={el => (driverContactEl = el)} placeholder="10 digit mobile number" /></div>
            <div className="form-group"><label className="form-label">Vehicle Number</label><input className="form-control" ref={el => (vehEl = el)} placeholder="e.g. MH01AB1234" /></div>
            <div className="form-group"><label className="form-label">Tracking Number</label><input className="form-control" ref={el => (trackEl = el)} placeholder="Consignment / AWB number" /></div>
          </div>
          <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-control" rows={2} ref={el => (remarksEl = el)} placeholder="Pickup point, packaging notes, etc." /></div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create Shipment</button>
        </>
      ),
    });
  }

  const columns = [
    { key: 'id', label: 'Return ID', cls: 'td-mono', render: r => <span className="td-link" onClick={(e) => { e.stopPropagation(); view(r.id); }}>{r.id}</span> },
    { key: 'poId', label: 'PO Number', cls: 'td-mono' },
    { key: 'invoiceId', label: 'Invoice Number', cls: 'td-mono' },
    { key: 'itemDesc', label: 'Item' },
    { key: 'reason', label: 'Reason' },
    { key: 'returnDate', label: 'Return Date' },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions', render: r => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="View Details" onClick={(e) => { e.stopPropagation(); view(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          {r.status === 'Initiated' ? (
            <button className="action-btn" data-tooltip="Review Request" onClick={(e) => { e.stopPropagation(); reviewModal(r.id); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          ) : null}
          {r.status === 'Approved' ? (
            <button className="action-btn" data-tooltip="Create Shipment" onClick={(e) => { e.stopPropagation(); createShipmentModal(r.id); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Returns</span></div>
          <h1>Returns from Warehouse</h1>
          <p>Track items returned by the Warehouse against your Purchase Orders and Invoices.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
        {STAT_GROUPS.map(g => {
          const cnt = rets.filter(r => r.status === g.label).length;
          return (
            <div
              key={g.label}
              className="card"
              style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onClick={() => setStatusFilter(g.label)}
            >
              <div className="kpi-icon" style={{ '--kpi-color': g.color, '--kpi-bg': g.bg }} dangerouslySetInnerHTML={{ __html: g.icon }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{cnt}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{g.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search returns…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
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
