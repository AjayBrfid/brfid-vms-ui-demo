import { useMemo, useState } from 'react';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { fmt } from '../utils/helpers';
import { TransportPayments } from '../services/transportPayments';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import FreightCard from '../components/FreightCard';
import { svgIcon } from '../components/Icon';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

const STATUS_OPTIONS = ['Packed', 'Dispatched', 'In Transit', 'Delivered', 'Delayed'];

const STAT_GROUPS = [
  { label: 'Packed', color: 'var(--info)', bg: 'var(--info-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` },
  { label: 'Dispatched', color: 'var(--primary)', bg: 'var(--primary-light)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>` },
  { label: 'In Transit', color: 'var(--warning)', bg: 'var(--warning-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>` },
  { label: 'Delivered', color: 'var(--success)', bg: 'var(--success-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>` },
  { label: 'Delayed', color: 'var(--danger)', bg: 'var(--danger-bg)', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
];

const TIMELINE_STEPS = [
  { label: 'Packed', icon: 'box' },
  { label: 'Dispatched', icon: 'send' },
  { label: 'In Transit', icon: 'truck' },
  { label: 'Delivered', icon: 'check-circle' },
];

function buildTimeline(d) {
  const isDelayed = d.status === 'Delayed';
  const curIdx = TIMELINE_STEPS.findIndex(s => s.label === (isDelayed ? 'In Transit' : d.status));
  return TIMELINE_STEPS.map((s, i) => {
    const delayedHere = isDelayed && i === curIdx;
    const state = i < curIdx ? 'done' : i === curIdx ? (delayedHere ? 'delayed' : 'active') : 'upcoming';
    let date = 'Pending';
    if (i === 0 && i <= curIdx) date = d.dispatchDate;
    else if (i === TIMELINE_STEPS.length - 1 && i <= curIdx) date = d.expectedDelivery;
    else if (i <= curIdx) date = delayedHere ? 'Delayed' : (state === 'active' ? 'In Progress' : '');
    return { ...s, state, date, delayedHere };
  });
}

export default function DeliveriesPage() {
  const modal = useModal();
  const toast = useToast();
  const [dels, setDels] = useState(() => Store.get(SK.DELIVERIES) || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  function refresh() { setDels(Store.get(SK.DELIVERIES) || []); }

  const filtered = useMemo(() => {
    let rows = dels;
    if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [dels, search, statusFilter]);

  function view(id) {
    const list = Store.get(SK.DELIVERIES) || [];
    const d = list.find(x => x.id === id);
    if (!d) return;
    const timeline = buildTimeline(d);
    const payment = TransportPayments.getFor('delivery', d.id);
    modal.show({
      title: 'Shipment ' + d.id,
      size: 'modal-lg',
      icon: 'primary',
      body: (
        <>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-item"><div className="detail-label">PO Reference</div><div className="detail-value">{d.poId}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{d.status}</Badge></div></div>
            <div className="detail-item"><div className="detail-label">Dispatch Date</div><div className="detail-value">{d.dispatchDate}</div></div>
            <div className="detail-item"><div className="detail-label">Expected Delivery</div><div className="detail-value">{d.expectedDelivery}</div></div>
            <div className="detail-item"><div className="detail-label">Transporter</div><div className="detail-value">{d.transporter}</div></div>
            <div className="detail-item"><div className="detail-label">Driver Name</div><div className="detail-value">{d.driverName || 'N/A'}</div></div>
            <div className="detail-item"><div className="detail-label">Driver Contact</div><div className="detail-value">{d.driverContact || 'N/A'}</div></div>
            <div className="detail-item"><div className="detail-label">Vehicle No.</div><div className="detail-value">{d.vehicleNo}</div></div>
            <div className="detail-item"><div className="detail-label">Tracking Number</div><div className="detail-value td-mono" style={{ fontWeight: 600 }}>{d.trackingNo}</div></div>
            <div className="detail-item"><div className="detail-label">Total Packages</div><div className="detail-value">{d.packages} cartons ({d.weight})</div></div>
            <div className="detail-item"><div className="detail-label">From</div><div className="detail-value">{d.from}</div></div>
            <div className="detail-item"><div className="detail-label">To</div><div className="detail-value">{d.to}</div></div>
          </div>
          <div className="sep" />
          <h4 style={{ marginBottom: 4, fontSize: 14, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ship-timeline-heading-icon" dangerouslySetInnerHTML={{ __html: svgIcon('truck') }} /> Shipment Timeline
          </h4>
          <div className="ship-timeline">
            {timeline.map((s, i) => (
              <div key={i} className={`ship-step ${s.state}`}>
                <div className="ship-step-icon" dangerouslySetInnerHTML={{ __html: svgIcon(s.state === 'done' ? 'check-circle' : (s.delayedHere ? 'alert-triangle' : s.icon)) }} />
                <div className="ship-step-title">{s.label}</div>
                <div className="ship-step-date">{s.date}</div>
              </div>
            ))}
          </div>
          <FreightCard payment={payment} />
        </>
      ),
      footer: <button className="btn btn-secondary" onClick={modal.close}>Close</button>,
    });
  }

  function updateStatusModal(id) {
    let statusEl, remarksEl;
    function submit() {
      const status = statusEl?.value;
      const list = Store.get(SK.DELIVERIES) || [];
      const i = list.findIndex(x => x.id === id);
      if (i > -1) { list[i].status = status; Store.set(SK.DELIVERIES, list); }
      if (status === 'Delivered') {
        const po = (Store.get(SK.POS) || []).find(p => p.id === list[i]?.poId);
        TransportPayments.approve('delivery', id, po);
      }
      modal.close();
      toast('Status Updated', `Shipment ${id} status updated to ${status}.`, 'success');
      refresh();
    }
    modal.show({
      title: 'Update Shipment Status',
      size: 'modal-sm',
      icon: 'primary',
      body: (
        <>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-control" ref={el => (statusEl = el)} defaultValue="Packed">
              <option>Packed</option><option>Dispatched</option><option>In Transit</option><option>Delivered</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-control" ref={el => (remarksEl = el)} rows={3} placeholder="Additional details…" />
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Update</button>
        </>
      ),
    });
  }

  function createShipmentModal() {
    let poEl, dateEl, transEl, driverEl, driverContactEl, vehEl, trackEl, pkgEl, remarksEl;
    const acceptedPos = (Store.get(SK.POS) || []).filter(p => p.status === 'Accepted');

    function submit() {
      const po = poEl?.value;
      const trans = transEl?.value;
      const list = Store.get(SK.DELIVERIES) || [];
      const id = `SHP-2026-${String(list.length + 1).padStart(3, '0')}`;
      const dateVal = dateEl?.value;
      const dispDate = dateVal ? fmt(new Date(dateVal)) : fmt(new Date());
      const delivery = {
        id, poId: po, dispatchDate: dispDate,
        expectedDelivery: fmt(new Date(Date.now() + 7 * 86400000)),
        transporter: trans, driverName: driverEl?.value || '',
        driverContact: driverContactEl?.value || '',
        vehicleNo: vehEl?.value,
        trackingNo: trackEl?.value || `TRK${Date.now()}`,
        status: 'Packed', packages: pkgEl?.value || 1,
        weight: 'N/A', from: 'Your Warehouse', to: 'CW',
        notes: '',
      };
      list.unshift(delivery);
      Store.set(SK.DELIVERIES, list);
      const linkedPo = (Store.get(SK.POS) || []).find(p => p.id === po);
      TransportPayments.createForDelivery(delivery, linkedPo);
      modal.close();
      toast('Shipment Created', `Shipment ${id} created successfully.`, 'success');
      refresh();
    }

    modal.show({
      title: 'Create Shipment',
      size: 'modal-lg',
      icon: 'primary',
      body: (
        <>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">PO Number</label>
              <select className="form-control" ref={el => (poEl = el)}>
                {acceptedPos.map(p => <option key={p.id}>{p.id}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Dispatch Date</label><input className="form-control" type="date" ref={el => (dateEl = el)} /></div>
            <div className="form-group"><label className="form-label">Transporter</label><input className="form-control" ref={el => (transEl = el)} placeholder="Logistics company name" /></div>
            <div className="form-group"><label className="form-label">Driver Name</label><input className="form-control" ref={el => (driverEl = el)} placeholder="Driver's full name" /></div>
            <div className="form-group"><label className="form-label">Driver Contact Number</label><input className="form-control" type="tel" ref={el => (driverContactEl = el)} placeholder="10 digit mobile number" /></div>
            <div className="form-group"><label className="form-label">Vehicle Number</label><input className="form-control" ref={el => (vehEl = el)} placeholder="e.g. MH01AB1234" /></div>
            <div className="form-group"><label className="form-label">Tracking Number</label><input className="form-control" ref={el => (trackEl = el)} placeholder="Consignment / AWB number" /></div>
            <div className="form-group"><label className="form-label">No. of Packages</label><input className="form-control" type="number" defaultValue={1} ref={el => (pkgEl = el)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-control" rows={2} ref={el => (remarksEl = el)} /></div>
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
    { key: 'id', label: 'Shipment ID', cls: 'td-mono', render: r => <span className="td-link" onClick={(e) => { e.stopPropagation(); view(r.id); }}>{r.id}</span> },
    { key: 'poId', label: 'PO Number', cls: 'td-mono' },
    { key: 'dispatchDate', label: 'Dispatch Date' },
    { key: 'expectedDelivery', label: 'Expected' },
    { key: 'transporter', label: 'Transporter' },
    { key: 'trackingNo', label: 'Tracking No.', cls: 'td-mono' },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions', render: r => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="View Timeline" onClick={(e) => { e.stopPropagation(); view(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          <button className="action-btn" data-tooltip="Update Status" onClick={(e) => { e.stopPropagation(); updateStatusModal(r.id); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 7 12 12 15.5 14" /></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Deliveries</span></div>
          <h1>Deliveries &amp; Shipments</h1>
          <p>Manage and track all shipments for your accepted Purchase Orders.</p>
        </div>
        <button className="btn btn-primary" onClick={createShipmentModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create Shipment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
        {STAT_GROUPS.map(g => {
          const cnt = dels.filter(d => d.status === g.label).length;
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
            <input type="text" placeholder="Search shipments…" value={search} onChange={e => setSearch(e.target.value)} />
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
