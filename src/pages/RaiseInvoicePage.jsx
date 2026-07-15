import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SK } from '../services/storageKeys';
import { Store } from '../services/store';
import { fmt, rupees } from '../utils/helpers';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastProvider';

export default function RaiseInvoicePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const poId = searchParams.get('po');

  const po = useMemo(() => {
    const pos = Store.get(SK.POS) || [];
    return pos.find(x => x.id === poId) || null;
  }, [poId]);

  const [invoiceNum, setInvoiceNum] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState(() => (po ? po.grandTotal : ''));
  const [gst, setGst] = useState(() => (po ? po.gst || 0 : ''));
  const [remarks, setRemarks] = useState('');

  const [freightTransporter, setFreightTransporter] = useState(() => po?.freightDetails?.transporterName || '');
  const [freightDriver, setFreightDriver] = useState(() => po?.freightDetails?.driverName || '');
  const [freightDriverContact, setFreightDriverContact] = useState(() => po?.freightDetails?.driverContact || '');
  const [freightAmount, setFreightAmount] = useState(() => po?.freightDetails?.estimatedFreightAmount ?? '');
  const [freightVehicle, setFreightVehicle] = useState(() => po?.freightDetails?.vehicleType || 'Mini Truck');
  const [freightRemarks, setFreightRemarks] = useState(() => po?.freightDetails?.remarks || '');

  const [fileName, setFileName] = useState('');

  function handleSubmit() {
    if (!po) { toast('Error', 'No purchase order selected.', 'danger'); return; }

    const amt = parseFloat(amount || 0);
    const gstAmt = parseFloat(gst || 0);

    let freightDetails = po.freightDetails || null;
    if (po.transportArrangement === 'vendor') {
      freightDetails = {
        transporterName: freightTransporter,
        estimatedFreightAmount: parseFloat(freightAmount),
        driverName: freightDriver,
        driverContact: freightDriverContact,
        vehicleType: freightVehicle,
        remarks: freightRemarks,
      };
      const pos = Store.get(SK.POS) || [];
      const pi = pos.findIndex(p => p.id === po.id);
      if (pi > -1) { pos[pi].freightDetails = freightDetails; Store.set(SK.POS, pos); }
    }

    const invs = Store.get(SK.INVOICES) || [];
    invs.unshift({
      id: `INV-2026-${String(invs.length + 1).padStart(3, '0')}`,
      poId: po.id,
      invoiceDate: fmt(new Date(invoiceDate)),
      dueDate: dueDate ? fmt(new Date(dueDate)) : fmt(new Date(Date.now() + 30 * 86400000)),
      amount: amt, gst: gstAmt, totalAmount: amt + gstAmt,
      status: 'Payment Pending', hasFile: true,
    });
    Store.set(SK.INVOICES, invs);
    toast('Invoice Raised', `Invoice for ${po.id} has been submitted successfully.`, 'success');
    setTimeout(() => navigate('/invoices'), 900);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Purchase Orders</span><span className="breadcrumb-sep">›</span><span>Raise Invoice</span></div>
          <h1>Raise Invoice</h1>
          <p>Submit invoice details for the selected purchase order.</p>
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
              <p>Go back to Purchase Orders and choose one to raise an invoice for.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">PO Number</div><div className="detail-value td-mono">{po.id}</div></div>
                <div className="detail-item"><div className="detail-label">Buyer</div><div className="detail-value">{po.buyer}</div></div>
                <div className="detail-item"><div className="detail-label">PO Date</div><div className="detail-value">{po.date}</div></div>
                <div className="detail-item"><div className="detail-label">Grand Total</div><div className="detail-value"><strong>{rupees(po.grandTotal)}</strong></div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{po.status}</Badge></div></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Invoice Details</div>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => e.preventDefault()} noValidate>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">PO Number</label>
                    <input className="form-control" value={po.id} disabled readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice Number</label>
                    <input className="form-control" placeholder="Your invoice reference no." value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice Date</label>
                    <input className="form-control" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input className="form-control" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Amount (₹)</label>
                    <input className="form-control" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Amount (₹)</label>
                    <input className="form-control" type="number" placeholder="0.00" value={gst} onChange={(e) => setGst(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea className="form-control" rows={3} placeholder="Additional notes for the accounts team…" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>

                {po.transportArrangement === 'vendor' ? (
                  <div>
                    <div className="sep"></div>
                    <h4 style={{ marginBottom: 4, fontSize: 14, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>Freight &amp; Transport Details</h4>
                    <p className="form-hint" style={{ marginBottom: 12 }}>You arranged transport for this PO. Enter the freight details so they can be tracked and settled under Payments.</p>
                    <div className="form-row form-row-2">
                      <div className="form-group">
                        <label className="form-label">Transporter Name</label>
                        <input className="form-control" placeholder="Logistics company name" value={freightTransporter} onChange={(e) => setFreightTransporter(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Driver Name</label>
                        <input className="form-control" placeholder="Driver's full name" value={freightDriver} onChange={(e) => setFreightDriver(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Driver Contact Number</label>
                        <input className="form-control" type="tel" placeholder="10 digit mobile number" value={freightDriverContact} onChange={(e) => setFreightDriverContact(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Estimated Freight Amount (₹)</label>
                        <input className="form-control" type="number" placeholder="0.00" value={freightAmount} onChange={(e) => setFreightAmount(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Vehicle Type</label>
                        <select className="form-control" value={freightVehicle} onChange={(e) => setFreightVehicle(e.target.value)}>
                          <option>Mini Truck</option>
                          <option>10 Ft Truck</option>
                          <option>Container Truck</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Freight Remarks</label>
                      <textarea className="form-control" rows={2} placeholder="Pickup point, packaging notes, insurance, etc." value={freightRemarks} onChange={(e) => setFreightRemarks(e.target.value)} />
                    </div>
                  </div>
                ) : null}

                <div className="form-group">
                  <label className="form-label">Invoice Document</label>
                  <div className="file-upload" onClick={() => document.getElementById('ri-file')?.click()}>
                    <div className="file-upload-icon">📄</div>
                    <div className="file-upload-text">Click to upload invoice</div>
                    <div className="file-upload-hint">PDF up to 10MB</div>
                    <div className="file-upload-name">{fileName}</div>
                  </div>
                  <input type="file" id="ri-file" accept=".pdf" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
                </div>
              </form>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                Submit Invoice
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
