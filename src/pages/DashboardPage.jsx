import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Store, Auth } from '../services/store';
import { SK } from '../services/storageKeys';
import { inPeriod, rupees } from '../utils/helpers';
import Badge from '../components/Badge';

/* ---- revenue chart (Recharts) ---- */

function buildRevenueSeries(invs) {
  let running = 0;
  return invs.map(inv => {
    running += inv.totalAmount;
    return { label: inv.invoiceDate.replace(/ \d{4}$/, ''), value: running };
  });
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="revenue-tooltip">
      <div className="revenue-tooltip-label">{label}</div>
      <div className="revenue-tooltip-value">{rupees(payload[0].value)}</div>
    </div>
  );
}

function RevenueChart({ series }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C3CE9" stopOpacity={0.38} />
            <stop offset="100%" stopColor="#6C3CE9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revGradStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1565C0" />
            <stop offset="100%" stopColor="#6C3CE9" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="var(--border)" opacity={0.7} />
        <XAxis
          dataKey="label" tickLine={false} axisLine={false}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          interval="preserveStartEnd" minTickGap={24}
        />
        <YAxis
          tickLine={false} axisLine={false}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`}
          width={56}
        />
        <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="url(#revGradStroke)"
          strokeWidth={3}
          fill="url(#revGradArea)"
          dot={{ r: 3, stroke: 'url(#revGradStroke)', strokeWidth: 2, fill: 'var(--bg-card)' }}
          activeDot={{ r: 6, stroke: 'url(#revGradStroke)', strokeWidth: 2, fill: 'url(#revGradStroke)' }}
          isAnimationActive
          animationDuration={1100}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---- page ---- */

export default function DashboardPage() {
  const navigate = useNavigate();
  const sess = Auth.session();
  const firstName = sess ? sess.contact.split(' ')[0] : 'Vendor';

  const [period, setPeriod] = useState('week');

  const [rfqs] = useState(() => Store.get(SK.RFQS) || []);
  const [quotes] = useState(() => Store.get(SK.QUOTES) || []);
  const [pos] = useState(() => Store.get(SK.POS) || []);
  const [ships] = useState(() => Store.get(SK.DELIVERIES) || []);
  const [invs] = useState(() => Store.get(SK.INVOICES) || []);
  const [pays] = useState(() => Store.get(SK.PAYMENTS) || []);

  const kpis = useMemo(() => {
    const openRfq = rfqs.filter(r => (r.status === 'Open' || r.status === 'Closing Soon') && inPeriod(r.issueDate, period)).length;
    const newRfq = rfqs.filter(r => inPeriod(r.issueDate, period)).length;
    const submitted = quotes.filter(q => inPeriod(q.submittedDate, period)).length;
    const appPO = pos.filter(p => p.status === 'Accepted' && inPeriod(p.date, period)).length;
    const newPO = pos.filter(p => inPeriod(p.date, period)).length;
    const pendShip = ships.filter(s => s.status !== 'Delivered' && inPeriod(s.dispatchDate, period)).length;
    const delayedShip = ships.filter(s => s.status === 'Delayed' && inPeriod(s.dispatchDate, period)).length;
    const pendPay = pays.filter(p => (p.status === 'Pending' || p.status === 'Overdue') && inPeriod(p.dueDate, period)).length;
    const pendInv = invs.filter(i => i.status === 'Payment Pending' && inPeriod(i.invoiceDate, period)).length;
    const periodLabel = period === 'week' ? 'this week' : period === 'year' ? 'this year' : 'this month';
    return { openRfq, newRfq, submitted, appPO, newPO, pendShip, delayedShip, pendPay, pendInv, periodLabel };
  }, [rfqs, quotes, pos, ships, invs, pays, period]);

  const revenue = useMemo(() => {
    if (!invs.length) return null;
    const series = buildRevenueSeries(invs);
    const total = series[series.length - 1].value;
    const mid = series[Math.floor(series.length / 2) - 1]?.value || series[0].value;
    const growth = mid > 0 ? Math.round(((total - mid) / mid) * 100) : 0;
    const avgOrder = total / invs.length;
    return { series, total, growth, avgOrder };
  }, [invs]);

  const recentRfqs = rfqs.slice(0, 3);
  const recentPos = pos.slice(0, 4);

  return (
    <>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Dashboard</span></div>
          <h1>Welcome back, <span style={{ color: 'var(--primary)' }}>{firstName}</span> 👋</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/rfqs')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            View RFQs
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/quotations')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            My Quotations
          </button>
        </div>
      </div>

      {/* KPI period filter */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <select
          className="filter-select"
          title="Filter KPI cards by period"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">

        <div className="kpi-card" style={{ '--kpi-color': 'var(--primary)', '--kpi-bg': 'var(--primary-light)', cursor: 'pointer' }} onClick={() => navigate('/rfqs')}>
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/>
            </svg>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.openRfq}</div>
            <div className="kpi-label">Available RFQs</div>
            <span className="kpi-trend up">↑ {kpis.newRfq} new</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--info)', '--kpi-bg': 'var(--info-bg)', cursor: 'pointer' }} onClick={() => navigate('/quotations')}>
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              <line x1="9" y1="10" x2="15" y2="10"/>
            </svg>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.submitted}</div>
            <div className="kpi-label">Submitted Quotes</div>
            <span className="kpi-trend up">↑ {kpis.submitted} {kpis.periodLabel}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--success)', '--kpi-bg': 'var(--success-bg)', cursor: 'pointer' }} onClick={() => navigate('/purchase-orders')}>
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.appPO}</div>
            <div className="kpi-label">Purchase Orders</div>
            <span className="kpi-trend up">↑ {kpis.newPO} new</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--warning)', '--kpi-bg': 'var(--warning-bg)', cursor: 'pointer' }} onClick={() => navigate('/deliveries')}>
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.pendShip}</div>
            <div className="kpi-label">Pending Deliveries</div>
            <span className="kpi-trend down">⚠ {kpis.delayedShip} delayed</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--danger)', '--kpi-bg': 'var(--danger-bg)', cursor: 'pointer' }} onClick={() => navigate('/payments')}>
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
              <line x1="6" y1="15" x2="10" y2="15"/>
              <line x1="14" y1="15" x2="17" y2="15"/>
            </svg>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.pendPay}</div>
            <div className="kpi-label">Pending Payments</div>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--orange)', '--kpi-bg': 'var(--orange-bg)', cursor: 'pointer' }} onClick={() => navigate('/invoices')}>
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{kpis.pendInv}</div>
            <div className="kpi-label">Invoices Due</div>
          </div>
        </div>

      </div>

      {/* Revenue Overview */}
      <div className="card revenue-card">
        <div className="card-header revenue-card-header">
          <div>
            <div className="card-title">Revenue Overview</div>
            <div className="card-subtitle">Cumulative revenue growth across your invoices</div>
          </div>
          <div className="revenue-stats">
            {revenue && (
              <>
                <div className="revenue-stat-pill">
                  <div className="revenue-stat-value">{rupees(revenue.total)}</div>
                  <div className="revenue-stat-label">Total Revenue</div>
                </div>
                <div className="revenue-stat-pill">
                  <div className="revenue-stat-value" style={{ color: revenue.growth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {revenue.growth >= 0 ? '+' : ''}{revenue.growth}%
                  </div>
                  <div className="revenue-stat-label">Growth</div>
                </div>
                <div className="revenue-stat-pill">
                  <div className="revenue-stat-value">{rupees(Math.round(revenue.avgOrder))}</div>
                  <div className="revenue-stat-label">Avg. Invoice Value</div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="revenue-chart-wrap">
            {revenue ? (
              <RevenueChart series={revenue.series} />
            ) : (
              <div className="empty-state">
                <h3>No revenue data yet</h3>
                <p>Revenue will appear here once invoices are raised.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">

        {/* Recent RFQs */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Latest RFQs</div>
            <a href="#" className="btn btn-sm btn-outline-primary" onClick={e => { e.preventDefault(); navigate('/rfqs'); }}>View All</a>
          </div>
          <div className="card-body p-0">
            <div style={{ padding: '4px 20px' }}>
              {recentRfqs.map(r => (
                <div className="activity-item" key={r.id}>
                  <div className="activity-dot" style={{ background: 'var(--primary-light)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="activity-content">
                    <div className="activity-text"><strong>{r.id}</strong>: {r.title}</div>
                    <div className="activity-time">Closes: {r.closingDate} &nbsp;|&nbsp; <Badge>{r.status}</Badge></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent POs */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Latest Purchase Orders</div>
            <a href="#" className="btn btn-sm btn-outline-primary" onClick={e => { e.preventDefault(); navigate('/purchase-orders'); }}>View All</a>
          </div>
          <div className="card-body p-0">
            <div style={{ padding: '4px 20px' }}>
              {recentPos.map(p => (
                <div className="activity-item" key={p.id}>
                  <div className="activity-dot" style={{ background: 'var(--success-bg)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </div>
                  <div className="activity-content">
                    <div className="activity-text"><strong>{p.id}</strong>: {rupees(p.grandTotal)}</div>
                    <div className="activity-time">Due: {p.deliveryDate} &nbsp;|&nbsp; <Badge>{p.status}</Badge></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Action Required</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="warning-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="warning-box-text"><strong>RFQ-2026-006</strong> closes in 2 days. Submit your quotation now.</span>
            </div>
            <div className="info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span className="info-box-text"><strong>PO-2026-003</strong> is accepted and ready. Raise your invoice once fulfilled.</span>
            </div>
            <div className="warning-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="warning-box-text"><strong>INV-2026-005</strong> payment is overdue. Please contact accounts.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
