import { TransportPayments } from '../services/transportPayments';
import { rupees } from '../utils/helpers';
import { svgIcon } from './Icon';
import Badge from './Badge';
import { useModal } from '../context/ModalProvider';

// JSX port of the original TransportPayments.renderCard(payment) HTML-string helper — same
// fields/labels, same "Mark Paid" action (only shown for Approved/Overdue payments). Used by both
// the Deliveries and Returns view-details modals via `TransportPayments.getFor(type, id)`.
export default function FreightCard({ payment }) {
  const modal = useModal();
  if (!payment) return null;

  const directionLabel = payment.direction === 'VENDOR_TO_WAREHOUSE' ? 'Vendor → Warehouse' : 'Warehouse → Vendor';
  const settlement = TransportPayments.determineSettlement(payment, {
    hasOpenInvoice: payment.direction === 'VENDOR_TO_WAREHOUSE',
    hasOpenRefund: payment.direction === 'WAREHOUSE_TO_VENDOR',
    daysSinceApproved: payment.approvedOn ? Math.floor((new Date() - new Date(payment.approvedOn)) / 86400000) : 0,
  });
  const canMarkPaid = ['Approved', 'Overdue'].includes(payment.status);

  return (
    <>
      <div className="sep" />
      <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="ship-timeline-heading-icon" dangerouslySetInnerHTML={{ __html: svgIcon('credit-card') }} /> Freight &amp; Transport
      </h4>
      <div className="detail-grid" style={{ marginBottom: 12 }}>
        <div className="detail-item"><div className="detail-label">Direction</div><div className="detail-value">{directionLabel}</div></div>
        <div className="detail-item"><div className="detail-label">Liable Party</div><div className="detail-value">{TransportPayments.payerLabel(payment.payer)}</div></div>
        <div className="detail-item"><div className="detail-label">Base Freight</div><div className="detail-value">{rupees(payment.baseFreight)}</div></div>
        <div className="detail-item"><div className="detail-label">GST ({payment.gtaForwardCharge ? '12% forward' : '5% RCM'})</div><div className="detail-value">{rupees(payment.gstOnFreight)}</div></div>
        <div className="detail-item"><div className="detail-label">TDS Deducted</div><div className="detail-value">{rupees(payment.tdsAmount)}</div></div>
        <div className="detail-item"><div className="detail-label">Final Liability</div><div className="detail-value"><strong>{rupees(payment.finalLiabilityAmount)}</strong></div></div>
        <div className="detail-item"><div className="detail-label">Settlement</div><div className="detail-value">{settlement.mode === 'NET' ? `Net against next ${settlement.against}` : settlement.mode === 'STANDALONE' ? 'Standalone payment' : '—'}</div></div>
        <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{payment.status}</Badge></div></div>
      </div>
      {canMarkPaid ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-primary" onClick={() => { TransportPayments.markPaid(payment.id); modal.close(); }}>Mark Paid</button>
        </div>
      ) : null}
    </>
  );
}
