import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SK } from '../services/storageKeys';
import { Store, Auth } from '../services/store';
import { fmt } from '../utils/helpers';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastProvider';

function nextAsnNumber() {
  const all = Store.get(SK.ASN) || [];
  return `ASN-2026-${String(all.length + 1).padStart(3, '0')}`;
}

function buildItemRows(po) {
  return (po.items || []).map((it, i) => ({
    sku: it.sku || `SKU-${po.id}-${i + 1}`,
    name: it.desc,
    unit: it.unit,
    orderedQty: it.qty,
    shippedQty: it.qty,
  }));
}

export default function CreateAsnPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const poId = searchParams.get('po');

  const po = useMemo(() => {
    const pos = Store.get(SK.POS) || [];
    return pos.find(x => x.id === poId) || null;
  }, [poId]);

  const sess = Auth.session();

  // Resume an existing draft for this PO if one exists, otherwise start a fresh one.
  const existingDraft = useMemo(() => {
    if (!po) return null;
    const all = Store.get(SK.ASN) || [];
    return all.find(a => a.poId === po.id && a.status === 'Draft') || null;
  }, [po]);

  const [asnNumber] = useState(() => existingDraft?.id || (po ? nextAsnNumber() : ''));
  const [shipmentDate, setShipmentDate] = useState(existingDraft?.shipmentDate || '');
  const [eta, setEta] = useState(existingDraft?.eta || '');
  const [transporterName, setTransporterName] = useState(existingDraft?.transporterName || '');
  const [vehicleNo, setVehicleNo] = useState(existingDraft?.vehicleNo || '');
  const [trackingNo, setTrackingNo] = useState(existingDraft?.trackingNo || '');
  const [packageCount, setPackageCount] = useState(existingDraft?.packageCount || '');
  const [items, setItems] = useState(() => existingDraft?.items || (po ? buildItemRows(po) : []));
  const [invoiceRef, setInvoiceRef] = useState(existingDraft?.invoiceRef || '');

  const attachmentSeq = useRef(0);
  function newAttachment() {
    attachmentSeq.current += 1;
    return { id: attachmentSeq.current, fileName: '', remark: '' };
  }
  const [attachments, setAttachments] = useState(() => {
    if (existingDraft?.attachments?.length) {
      attachmentSeq.current = existingDraft.attachments.length;
      return existingDraft.attachments;
    }
    return [newAttachment()];
  });

  function addAttachment() {
    setAttachments(prev => [...prev, newAttachment()]);
  }
  function removeAttachment(id) {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }
  function updateAttachment(id, field, value) {
    setAttachments(prev => prev.map(a => (a.id === id ? { ...a, [field]: value } : a)));
  }

  const totalQty = items.reduce((sum, it) => sum + (Number(it.shippedQty) || 0), 0);

  function updateShippedQty(idx, value) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const clamped = Math.min(Math.max(0, Number(value) || 0), it.orderedQty);
      return { ...it, shippedQty: clamped };
    }));
  }

  function buildRecord(status) {
    return {
      id: asnNumber,
      poId: po.id,
      vendorName: sess ? sess.name : '',
      warehouseName: po.buyer,
      shipmentDate: shipmentDate ? fmt(new Date(shipmentDate)) : '',
      eta: eta ? fmt(new Date(eta)) : '',
      transporterName, vehicleNo, trackingNo,
      packageCount,
      items,
      totalQty,
      invoiceRef,
      attachments,
      status,
      createdDate: existingDraft?.createdDate || fmt(new Date()),
    };
  }

  function persist(record) {
    const all = Store.get(SK.ASN) || [];
    const i = all.findIndex(a => a.id === record.id);
    if (i > -1) all[i] = record; else all.unshift(record);
    Store.set(SK.ASN, all);
  }

  function saveDraft() {
    persist(buildRecord('Draft'));
    toast('ASN Draft Saved', `${asnNumber} has been saved as a draft.`, 'success');
  }

  function submitAsn() {
    const record = buildRecord('Submitted');
    persist(record);

    const pos = Store.get(SK.POS) || [];
    const pi = pos.findIndex(p => p.id === po.id);
    if (pi > -1) { pos[pi].status = 'ASN Submitted'; pos[pi].asnId = record.id; Store.set(SK.POS, pos); }

    toast('ASN Submitted', `${asnNumber} has been submitted for ${po.id}.`, 'success');
    setTimeout(() => navigate('/purchase-orders'), 900);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Purchase Orders</span><span className="breadcrumb-sep">›</span><span>Create ASN</span></div>
          <h1>Create Advance Shipment Notice</h1>
          <p>Notify the warehouse of an upcoming shipment against a purchase order.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to Purchase Orders
        </button>
      </div>

      {!po ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="empty-state">
              <h3>No Purchase Order Selected</h3>
              <p>Go back to Purchase Orders and choose one to create an ASN for.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">PO Number</div><div className="detail-value td-mono">{po.id}</div></div>
                <div className="detail-item"><div className="detail-label">Buyer / Warehouse</div><div className="detail-value">{po.buyer}</div></div>
                <div className="detail-item"><div className="detail-label">PO Date</div><div className="detail-value">{po.date}</div></div>
                <div className="detail-item"><div className="detail-label">Delivery Date</div><div className="detail-value">{po.deliveryDate}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{po.status}</Badge></div></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Shipment Information</div>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => e.preventDefault()} noValidate>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">ASN Number</label>
                    <input className="form-control" value={asnNumber} disabled readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Order Number</label>
                    <input className="form-control" value={po.id} disabled readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendor Name</label>
                    <input className="form-control" value={sess ? sess.name : ''} disabled readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Warehouse Name</label>
                    <input className="form-control" value={po.buyer} disabled readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shipment Date</label>
                    <input className="form-control" type="date" value={shipmentDate} onChange={(e) => setShipmentDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Arrival Date (ETA)</label>
                    <input className="form-control" type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Transport Details</div>
            </div>
            <div className="card-body">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Transporter Name</label>
                  <input className="form-control" placeholder="Logistics company name" value={transporterName} onChange={(e) => setTransporterName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Number</label>
                  <input className="form-control" placeholder="e.g. MH01AB1234" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tracking Number</label>
                  <input className="form-control" placeholder="Consignment / AWB number (optional)" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Package Information</div>
            </div>
            <div className="card-body">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Package / Carton Count</label>
                  <input className="form-control" type="number" min="0" placeholder="0" value={packageCount} onChange={(e) => setPackageCount(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Product Details</div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Ordered Quantity</th>
                    <th>Shipped Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.sku}>
                      <td className="td-mono">{it.sku}</td>
                      <td>{it.name}</td>
                      <td>{it.orderedQty} {it.unit}</td>
                      <td>
                        <input
                          className="form-control" type="number" min="0" max={it.orderedQty}
                          style={{ maxWidth: 120 }}
                          value={it.shippedQty}
                          onChange={(e) => updateShippedQty(i, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
              <div className="detail-item" style={{ textAlign: 'right' }}>
                <div className="detail-label">Total Quantity</div>
                <div className="detail-value" style={{ fontSize: 16, fontWeight: 700 }}>{totalQty}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Additional Information</div>
            </div>
            <div className="card-body">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Invoice Reference</label>
                  <input className="form-control" placeholder="Optional invoice number" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Attachments</label>
                {attachments.map((att) => (
                  <div key={att.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <div
                      className="file-upload"
                      style={{ flex: '0 0 220px', padding: '8px 12px', minHeight: 'auto' }}
                      onClick={() => document.getElementById(`asn-att-file-${att.id}`)?.click()}
                    >
                      <div className="file-upload-text" style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {att.fileName || 'Click to upload file'}
                      </div>
                    </div>
                    <input
                      type="file" id={`asn-att-file-${att.id}`} style={{ display: 'none' }}
                      onChange={(e) => updateAttachment(att.id, 'fileName', e.target.files?.[0]?.name || '')}
                    />
                    <input
                      className="form-control" placeholder="Remark for this attachment"
                      value={att.remark} onChange={(e) => updateAttachment(att.id, 'remark', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button" className="action-btn danger" data-tooltip="Remove"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={addAttachment}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Attachment
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>Cancel</button>
              <button className="btn btn-outline-primary" onClick={saveDraft}>Save Draft</button>
              <button className="btn btn-primary" onClick={submitAsn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                Submit ASN
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
