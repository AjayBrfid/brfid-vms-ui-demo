import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { svgIcon } from '../components/Icon';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { fmt, rupees } from '../utils/helpers';

const CATEGORIES = [
  "Men's Wear", "Women's Wear", 'Kids & Infants', 'School Uniforms', 'Sportswear',
  'Ethnic Wear', 'Workwear', 'Denim', 'Innerwear', 'Winterwear',
];
const STATUSES = ['Open', 'Closing Soon', 'Closed', 'Awarded', 'Cancelled'];

export default function RfqsPage() {
  const modal = useModal();
  const toast = useToast();
  const [rfqs, setRfqs] = useState(() => Store.get(SK.RFQS) || []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    let rows = rfqs;
    if (category) rows = rows.filter(r => r.category === category);
    if (status) rows = rows.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [rfqs, search, category, status]);

  function canSubmitQuote(r) {
    return (r.status === 'Open' || r.status === 'Closing Soon') && !r.quotationSubmitted;
  }

  function viewRfq(id) {
    const list = Store.get(SK.RFQS) || [];
    const r = list.find(x => x.id === id);
    if (!r) return;
    const canQuote = canSubmitQuote(r);
    modal.show({
      title: `${r.id}: ${r.title}`,
      size: 'modal-lg',
      icon: 'primary',
      iconSvg: svgIcon('file-text'),
      body: (
        <>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-item"><div className="detail-label">Category</div><div className="detail-value">{r.category}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{r.status}</Badge></div></div>
            <div className="detail-item"><div className="detail-label">Issue Date</div><div className="detail-value">{r.issueDate}</div></div>
            <div className="detail-item"><div className="detail-label">Closing Date</div><div className="detail-value">{r.closingDate}</div></div>
            <div className="detail-item"><div className="detail-label">Quantity Required</div><div className="detail-value">{r.quantity} {r.unit}</div></div>
            <div className="detail-item"><div className="detail-label">Delivery Location</div><div className="detail-value">{r.deliveryLocation}</div></div>
            <div className="detail-item"><div className="detail-label">Required Delivery Date</div><div className="detail-value">{r.requiredDeliveryDate}</div></div>
            <div className="detail-item"><div className="detail-label">Estimated Budget</div><div className="detail-value">{rupees(r.estimatedBudget)}</div></div>
          </div>
          <div className="sep"></div>
          <div className="form-group">
            <div className="form-label">Specifications</div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.7 }}>{r.specifications}</p>
          </div>
          <div className="form-group">
            <div className="form-label">Terms &amp; Conditions</div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.7 }}>{r.terms}</p>
          </div>
          {r.quotationSubmitted ? (
            <div className="info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="info-box-text">You have already submitted a quotation for this RFQ.</span>
            </div>
          ) : null}
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={() => modal.close()}>Close</button>
          {canQuote ? (
            <button className="btn btn-primary" onClick={() => { modal.close(); openSubmitQuoteModal(id); }}>Submit Quotation</button>
          ) : null}
        </>
      ),
    });
  }

  function openSubmitQuoteModal(rfqId) {
    const list = Store.get(SK.RFQS) || [];
    const r = list.find(x => x.id === rfqId);
    if (!r) return;

    // Plain (non-hook) refs — this JSX is built inside an event handler, not a component body,
    // so React's callback-ref mechanism is used purely to read field values on submit (mirrors
    // the original's getElementById reads), without needing controlled state for every field.
    const f = {
      amount: { current: null }, gst: { current: null }, days: { current: null },
      warranty: { current: null }, payment: { current: null }, validity: { current: null },
      remarks: { current: null }, vendorRadio: { current: null }, warehouseRadio: { current: null },
      fileName: { current: null },
    };

    function handleSubmit() {
      const amount = f.amount.current?.value;
      const gst = f.gst.current?.value;
      const days = f.days.current?.value;
      const transportArrangement = f.vendorRadio.current?.checked
        ? 'vendor'
        : f.warehouseRadio.current?.checked
          ? 'warehouse'
          : undefined;

      const rfqsNow = Store.get(SK.RFQS) || [];
      const ri = rfqsNow.findIndex(x => x.id === rfqId);
      if (ri > -1) { rfqsNow[ri].quotationSubmitted = true; Store.set(SK.RFQS, rfqsNow); }

      const quotes = Store.get(SK.QUOTES) || [];
      const base = parseFloat(amount);
      const g = parseFloat(gst);
      quotes.unshift({
        id: `QT-2026-${String(quotes.length + 1).padStart(3, '0')}`,
        rfqId, rfqTitle: rfqsNow[ri]?.title || rfqId,
        submittedDate: fmt(new Date()), rfqClosingDate: rfqsNow[ri]?.closingDate || '',
        amount: base, gst: g, totalAmount: base + g,
        deliveryDays: parseInt(days),
        warranty: f.warranty.current?.value,
        paymentTerms: f.payment.current?.value,
        remarks: f.remarks.current?.value || '',
        transportArrangement, freightDetails: null,
        status: 'Submitted', hasPdf: true,
      });
      Store.set(SK.QUOTES, quotes);
      modal.close();
      toast('Quotation Submitted', `Your quotation for ${rfqId} has been submitted successfully.`, 'success');
      setRfqs(rfqsNow);
    }

    modal.show({
      title: `Submit Quotation for ${rfqId}`,
      size: 'modal-lg',
      icon: 'primary',
      iconSvg: svgIcon('send'),
      body: (
        <form>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Quotation Amount (₹)</label>
              <input className="form-control" type="number" placeholder="0.00" ref={el => (f.amount.current = el)} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Amount (₹)</label>
              <input className="form-control" type="number" placeholder="0.00" ref={el => (f.gst.current = el)} />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Days</label>
              <input className="form-control" type="number" placeholder="e.g. 21" ref={el => (f.days.current = el)} />
            </div>
            <div className="form-group">
              <label className="form-label">Warranty Period</label>
              <select className="form-control" ref={el => (f.warranty.current = el)}>
                <option>No Warranty</option>
                <option>6 Months</option>
                <option>1 Year</option>
                <option>2 Years</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-control" ref={el => (f.payment.current = el)}>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>50% Advance + 50% on Delivery</option>
                <option>LC 60 Days</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Validity (Days)</label>
              <input className="form-control" type="number" defaultValue={30} ref={el => (f.validity.current = el)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-control" rows={3} placeholder="Technical compliance notes, delivery conditions…" ref={el => (f.remarks.current = el)}></textarea>
          </div>

          <div className="sep"></div>
          <div className="form-group">
            <label className="form-label">Transport Arrangement</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13.5px', fontWeight: 500, cursor: 'pointer' }}>
                <input type="radio" name="q-transport" value="vendor" ref={el => (f.vendorRadio.current = el)} /> Vendor arranges &amp; pays freight
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13.5px', fontWeight: 500, cursor: 'pointer' }}>
                <input type="radio" name="q-transport" value="warehouse" ref={el => (f.warehouseRadio.current = el)} /> Warehouse arranges &amp; pays freight
              </label>
            </div>
            <p className="form-hint">Freight/transporter details are entered later, when you raise the invoice for the resulting Purchase Order.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Quotation PDF</label>
            <div className="file-upload" onClick={() => document.getElementById('q-file')?.click()}>
              <div className="file-upload-icon">📄</div>
              <div className="file-upload-text">Click to upload quotation document</div>
              <div className="file-upload-hint">PDF, DOC up to 10MB</div>
              <div className="file-upload-name" ref={el => (f.fileName.current = el)}></div>
            </div>
            <input
              type="file"
              id="q-file"
              accept=".pdf,.doc,.docx"
              onChange={e => { if (f.fileName.current) f.fileName.current.textContent = e.target.files[0]?.name || ''; }}
            />
          </div>
        </form>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={() => modal.close()}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Submit Quotation</button>
        </>
      ),
    });
  }

  const columns = [
    {
      key: 'id', label: 'RFQ Number', cls: 'td-mono', width: '140px',
      render: r => <span className="td-link" onClick={e => { e.stopPropagation(); viewRfq(r.id); }}>{r.id}</span>,
    },
    { key: 'title', label: 'Product Name', render: r => r.title },
    { key: 'category', label: 'Category', render: r => r.category },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'closingDate', label: 'Closing Date' },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions',
      render: r => {
        const canQuote = canSubmitQuote(r);
        return (
          <div className="table-actions">
            <button className="action-btn" data-tooltip="View RFQ" onClick={e => { e.stopPropagation(); viewRfq(r.id); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
            {r.attachments ? (
              <button className="action-btn" data-tooltip="Download" onClick={e => { e.stopPropagation(); toast('Download', 'Attachment downloaded.', 'success'); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </button>
            ) : null}
            {canQuote ? (
              <button className="action-btn success" data-tooltip="Submit Quote" onClick={e => { e.stopPropagation(); openSubmitQuoteModal(r.id); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            ) : null}
            {r.quotationSubmitted ? <span className="badge badge-success" style={{ fontSize: 11 }}>Quoted</span> : null}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>RFQs</span></div>
          <h1>Request for Quotations</h1>
          <p>RFQs published by Warehouse Procurement team. Review and submit your quotations.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search RFQs…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <DataTable columns={columns} data={filtered} rowsPerPage={10} onRowClick={row => viewRfq(row.id)} />
        </div>
      </div>
    </>
  );
}
