import { useMemo, useState } from 'react';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { rupees, inPeriod } from '../utils/helpers';
import { TransportPayments } from '../services/transportPayments';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import { useToast } from '../context/ToastProvider';

export default function PaymentsPage() {
  const toast = useToast();
  const [view, setView] = useState('goods'); // 'goods' | 'freight'

  /* ---- Goods payments ---- */
  const [payments] = useState(() => Store.get(SK.PAYMENTS) || []);
  const [paySearch, setPaySearch] = useState('');
  const [payStatus, setPayStatus] = useState('');
  const [payPeriod, setPayPeriod] = useState('');

  const filteredPayments = useMemo(() => {
    let rows = payments;
    if (payStatus) rows = rows.filter(r => r.status === payStatus);
    if (paySearch) {
      const q = paySearch.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    if (payPeriod) rows = rows.filter(r => inPeriod(r.invoiceDate, payPeriod));
    return rows;
  }, [payments, paySearch, payStatus, payPeriod]);

  const paySummary = useMemo(() => {
    const rows = payments.filter(p => inPeriod(p.invoiceDate, payPeriod));
    const total = rows.reduce((s, p) => s + p.amount, 0);
    const paid = rows.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
    const pend = rows.filter(p => p.status === 'Pending' || p.status === 'Processing').reduce((s, p) => s + p.amount, 0);
    const ovrd = rows.filter(p => p.status === 'Overdue').reduce((s, p) => s + p.amount, 0);
    return { total, paid, pend, ovrd };
  }, [payments, payPeriod]);

  const paymentColumns = [
    { key: 'invoiceId', label: 'Invoice No.', cls: 'td-mono' },
    { key: 'poId', label: 'PO Number', cls: 'td-mono' },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'amount', label: 'Amount', render: r => <strong>{rupees(r.amount)}</strong> },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    { key: 'paidDate', label: 'Paid Date', render: r => r.paidDate || <span style={{ color: 'var(--text-muted)' }}>Not Paid Yet</span> },
    {
      key: '_actions', label: 'Actions', render: () => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="Remittance" onClick={(e) => { e.stopPropagation(); toast('Download', 'Remittance advice downloaded.', 'success'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </button>
        </div>
      ),
    },
  ];

  /* ---- Freight & transport payments ---- */
  const [freightRows, setFreightRows] = useState(() => TransportPayments.all());
  const [freightSearch, setFreightSearch] = useState('');
  const [freightStatus, setFreightStatus] = useState('');

  const filteredFreight = useMemo(() => {
    let rows = freightRows;
    if (freightStatus) rows = rows.filter(r => r.status === freightStatus);
    if (freightSearch) {
      const q = freightSearch.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [freightRows, freightSearch, freightStatus]);

  const freightSummary = useMemo(() => {
    // Every row in this ledger is vendor-liable by construction (see TransportPayments) — there's
    // no reimbursement leg to track separately.
    const payable = freightRows.filter(r => r.status !== 'Paid').reduce((s, r) => s + r.finalLiabilityAmount, 0);
    const paid = freightRows.filter(r => r.status === 'Paid').reduce((s, r) => s + r.finalLiabilityAmount, 0);
    return { payable, paid };
  }, [freightRows]);

  function markPaid(id) {
    TransportPayments.markPaid(id);
    setFreightRows(TransportPayments.all());
    toast('Freight Payment Settled', `${id} marked as paid.`, 'success');
  }

  const freightColumns = [
    { key: 'id', label: 'Freight ID', cls: 'td-mono' },
    { key: 'linkedId', label: 'Linked To', cls: 'td-mono' },
    { key: 'direction', label: 'Direction', render: r => r.direction === 'VENDOR_TO_WAREHOUSE' ? 'Vendor → Warehouse' : 'Warehouse → Vendor' },
    { key: 'payer', label: 'Liable Party', render: r => TransportPayments.payerLabel(r.payer) },
    { key: 'finalLiabilityAmount', label: 'Amount', render: r => <strong>{rupees(r.finalLiabilityAmount)}</strong> },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions', render: r => (
        ['Approved', 'Overdue'].includes(r.status) ? (
          <div className="table-actions">
            <button className="action-btn" data-tooltip="Mark Paid" onClick={(e) => { e.stopPropagation(); markPaid(r.id); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Payments</span></div>
          <h1>Payments</h1>
          <p>Track payment history, pending dues and download remittance advice.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => toast('Export', 'Payment statement exported.', 'success')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Download Statement
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div
          className="card"
          style={{ flex: 1, padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, border: `2px solid ${view === 'goods' ? 'var(--primary)' : 'transparent'}` }}
          onClick={() => setView('goods')}
        >
          <div className="kpi-icon" style={{ '--kpi-color': 'var(--primary)', '--kpi-bg': 'var(--primary-light)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)' }}>Goods Payments</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Invoice payments for goods supplied</div>
          </div>
        </div>
        <div
          className="card"
          style={{ flex: 1, padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, border: `2px solid ${view === 'freight' ? 'var(--primary)' : 'transparent'}` }}
          onClick={() => setView('freight')}
        >
          <div className="kpi-icon" style={{ '--kpi-color': 'var(--warning)', '--kpi-bg': 'var(--warning-bg)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)' }}>Freight &amp; Transport Payments</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Freight liability for shipments you arrange and returns</div>
          </div>
        </div>
      </div>

      {view === 'goods' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <select className="filter-select" title="Filter payments by period" value={payPeriod} onChange={e => setPayPeriod(e.target.value)}>
              <option value="">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="payment-summary">
            <div className="payment-card">
              <div className="payment-card-icon" style={{ background: 'var(--primary-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              </div>
              <div className="payment-card-amount">{rupees(paySummary.total)}</div>
              <div className="payment-card-label">Total Invoiced</div>
            </div>
            <div className="payment-card">
              <div className="payment-card-icon" style={{ background: 'var(--success-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="payment-card-amount" style={{ color: 'var(--success)' }}>{rupees(paySummary.paid)}</div>
              <div className="payment-card-label">Total Paid</div>
            </div>
            <div className="payment-card">
              <div className="payment-card-icon" style={{ background: 'var(--warning-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div className="payment-card-amount" style={{ color: 'var(--warning)' }}>{rupees(paySummary.pend)}</div>
              <div className="payment-card-label">Pending</div>
            </div>
            <div className="payment-card">
              <div className="payment-card-icon" style={{ background: 'var(--danger-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div className="payment-card-amount" style={{ color: 'var(--danger)' }}>{rupees(paySummary.ovrd)}</div>
              <div className="payment-card-label">Overdue</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Payment History</div>
                <div className="card-subtitle">All invoice payments linked to your account</div>
              </div>
            </div>
            <div className="table-toolbar">
              <div className="table-search">
                <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" placeholder="Search payments…" value={paySearch} onChange={e => setPaySearch(e.target.value)} />
              </div>
              <div className="table-filters">
                <select className="filter-select" value={payStatus} onChange={e => setPayStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Overdue</option>
                  <option>Processing</option>
                </select>
              </div>
            </div>
            <div className="table-wrapper">
              <DataTable columns={paymentColumns} data={filteredPayments} rowsPerPage={10} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="payment-summary" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div className="payment-card">
              <div className="payment-card-icon" style={{ background: 'var(--danger-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              </div>
              <div className="payment-card-amount" style={{ color: 'var(--danger)' }}>{rupees(freightSummary.payable)}</div>
              <div className="payment-card-label">You Owe (Freight)</div>
            </div>
            <div className="payment-card">
              <div className="payment-card-icon" style={{ background: 'var(--primary-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="payment-card-amount">{rupees(freightSummary.paid)}</div>
              <div className="payment-card-label">Freight Settled</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Freight &amp; Transport Payments</div>
                <div className="card-subtitle">Freight liability for shipments to the warehouse and returns back to you, kept separate from goods invoice payments</div>
              </div>
            </div>
            <div className="table-toolbar">
              <div className="table-search">
                <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" placeholder="Search freight payments…" value={freightSearch} onChange={e => setFreightSearch(e.target.value)} />
              </div>
              <div className="table-filters">
                <select className="filter-select" value={freightStatus} onChange={e => setFreightStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Paid</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>
            <div className="table-wrapper">
              <DataTable columns={freightColumns} data={filteredFreight} rowsPerPage={10} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
