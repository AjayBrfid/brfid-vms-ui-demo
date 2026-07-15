import { SK } from './storageKeys';
import { Store } from './store';
import { fmt } from '../utils/helpers';

/* ============================================================
   TRANSPORT PAYMENTS (Vendor⇄Warehouse freight liability & settlement)
   ============================================================ */
export const TransportPayments = {
  STATUS: { PENDING: 'Pending', APPROVED: 'Approved', PAID: 'Paid', OVERDUE: 'Overdue' },
  GST_RATE_RCM: 0.05,        // reverse-charge GTA rate: liable party remits, not the transporter
  GST_RATE_FORWARD: 0.12,    // transporter opted for forward charge, liable party can claim ITC
  TDS_RATE_INDIVIDUAL: 0.01, // Sec 194C
  TDS_RATE_OTHER: 0.02,
  TDS_THRESHOLD_SINGLE: 30000,
  TDS_THRESHOLD_CUMULATIVE: 100000,
  SETTLEMENT_NET_WINDOW_DAYS: 30,
  OVERDUE_AFTER_DAYS: 15,

  // This ledger only ever holds records the VENDOR is liable for — see resolve*Liability below.
  // Warehouse-arranged deliveries never get a row: there's nothing for the vendor to pay or
  // reconcile, so nothing is created for them in the first place. Returns always get a row, since
  // the vendor is always responsible for arranging (and paying for) return transport.

  /* ---- B. Liability — fixed on the PO, inherited from the quotation the vendor submitted ---- */
  resolveDeliveryLiability(po) {
    if (!po || !po.transportArrangement) return { payer: null, needsReview: true };
    return po.transportArrangement === 'vendor'
      ? { payer: 'vendor' }
      : { payer: 'warehouse' };
  },
  // The vendor is always responsible for arranging (and paying for) return transport.
  resolveReturnLiability(ret) {
    if (!ret) return { payer: null, needsReview: true };
    return { payer: 'vendor' };
  },

  /* ---- C. Amount computation ---- */
  computeAmounts({ baseFreight, gtaForwardCharge = false, transporterType = 'company', cumulativeFYPayments = 0, payerIsRemitter = true }) {
    const gstRate = gtaForwardCharge ? this.GST_RATE_FORWARD : this.GST_RATE_RCM;
    const gstOnFreight = Math.round(baseFreight * gstRate);
    const overThreshold = baseFreight > this.TDS_THRESHOLD_SINGLE
      || (cumulativeFYPayments + baseFreight) > this.TDS_THRESHOLD_CUMULATIVE;
    const tdsAmount = (payerIsRemitter && overThreshold)
      ? Math.round(baseFreight * (transporterType === 'individual' ? this.TDS_RATE_INDIVIDUAL : this.TDS_RATE_OTHER))
      : 0;
    return {
      baseFreight,
      gstOnFreight,
      gtaForwardCharge,
      tdsAmount,
      netPayableToTransporter: baseFreight - tdsAmount,
      // Under RCM the GST isn't paid to the transporter — it's a statutory cost the liable party
      // remits directly — but it still adds to what the liable party owes overall.
      finalLiabilityAmount: baseFreight + gstOnFreight - tdsAmount,
    };
  },

  /* ---- D. Settlement / netting ---- */
  determineSettlement(payment, { hasOpenInvoice = false, hasOpenRefund = false, daysSinceApproved = 0 } = {}) {
    if (payment.payer !== 'vendor') return { mode: 'NONE' };
    if ((hasOpenInvoice || hasOpenRefund) && daysSinceApproved <= this.SETTLEMENT_NET_WINDOW_DAYS) {
      return { mode: 'NET', against: hasOpenInvoice ? 'invoice' : 'refund' };
    }
    return { mode: 'STANDALONE' };
  },

  /* ---- E. Status state machine ---- */
  ALLOWED_TRANSITIONS: {
    Pending: ['Approved'],
    Approved: ['Paid', 'Overdue'],
    Overdue: ['Paid'],
    Paid: [],
  },
  canTransition(from, to) { return (this.ALLOWED_TRANSITIONS[from] || []).includes(to); },

  // Derives Overdue from Approved + elapsed time — never stored as a separate manual state.
  computeStatus(payment) {
    if (payment.status !== this.STATUS.APPROVED) return payment.status;
    if (!payment.approvedOn) return payment.status;
    const daysSince = (new Date() - new Date(payment.approvedOn)) / 86400000;
    return daysSince > this.OVERDUE_AFTER_DAYS ? this.STATUS.OVERDUE : payment.status;
  },

  all() {
    return (Store.get(SK.TRANSPORT) || []).map(p => ({ ...p, status: this.computeStatus(p) }));
  },
  getFor(linkedType, linkedId) {
    return this.all().find(p => p.linkedType === linkedType && p.linkedId === linkedId) || null;
  },
  // Fills in the real transporter once known (e.g. when the return shipment is actually booked) —
  // a no-op if no ledger row exists (warehouse-liable case, nothing to update).
  recordTransporter(linkedType, linkedId, transporterName) {
    const all = Store.get(SK.TRANSPORT) || [];
    const i = all.findIndex(p => p.linkedType === linkedType && p.linkedId === linkedId);
    if (i === -1) return;
    all[i] = { ...all[i], transporter: transporterName };
    Store.set(SK.TRANSPORT, all);
  },
  payerLabel(payer) {
    return payer === 'vendor' ? 'You (Vendor)' : payer === 'warehouse' ? 'Central Warehouse' : 'Pending Review';
  },

  // Builds one ledger row. `source` is the PO (for deliveries) or the return record (for returns).
  _buildRecord(linkedType, linkedId, source, liability, opts = {}) {
    const isDelivery = linkedType === 'delivery';
    const baseFreight = isDelivery
      ? (source.freightDetails?.estimatedFreightAmount || (parseInt(source.weight, 10) || 500) * 8)
      : (source.quantity || 50) * 4;
    const amounts = this.computeAmounts({
      baseFreight,
      gtaForwardCharge: opts.gtaForwardCharge || false,
      transporterType: opts.transporterType || 'company',
    });
    return {
      id: null, // caller assigns a sequential TRN id before storing
      direction: isDelivery ? 'VENDOR_TO_WAREHOUSE' : 'WAREHOUSE_TO_VENDOR',
      linkedType, linkedId,
      transporter: isDelivery ? (source.transporter || source.freightDetails?.transporterName || null) : null,
      ...liability, ...amounts,
      status: this.STATUS.PENDING, approvedOn: null, paidOn: null,
    };
  },

  // Called once the linked delivery/return's liability becomes authoritative (PO accepted / return
  // approved by the vendor). Deliveries' liability is already fixed on the PO by the time a shipment
  // exists, so in practice only the return path needs this to create the ledger row on demand.
  approve(linkedType, linkedId, sourceRecord) {
    const all = Store.get(SK.TRANSPORT) || [];
    const i = all.findIndex(p => p.linkedType === linkedType && p.linkedId === linkedId);
    const liability = linkedType === 'delivery'
      ? this.resolveDeliveryLiability(sourceRecord)
      : this.resolveReturnLiability(sourceRecord);

    if (liability.payer !== 'vendor') {
      if (i > -1) { all.splice(i, 1); Store.set(SK.TRANSPORT, all); }
      return;
    }
    if (i === -1) {
      const rec = this._buildRecord(linkedType, linkedId, sourceRecord, liability);
      rec.id = `TRN-2026-${String(all.length + 1).padStart(3, '0')}`;
      rec.status = this.STATUS.APPROVED;
      rec.approvedOn = fmt(new Date());
      all.push(rec);
      Store.set(SK.TRANSPORT, all);
      return;
    }
    if (!this.canTransition(all[i].status, this.STATUS.APPROVED)) return;
    all[i] = { ...all[i], ...liability, status: this.STATUS.APPROVED, approvedOn: fmt(new Date()) };
    Store.set(SK.TRANSPORT, all);
  },
  markPaid(id) {
    const all = Store.get(SK.TRANSPORT) || [];
    const i = all.findIndex(p => p.id === id);
    if (i === -1 || !this.canTransition(this.computeStatus(all[i]), this.STATUS.PAID)) return;
    all[i] = { ...all[i], status: this.STATUS.PAID, paidOn: fmt(new Date()) };
    Store.set(SK.TRANSPORT, all);
  },

  // Creates the linked freight record for a shipment raised through the UI (not seed data).
  // No-op when the warehouse arranges transport — nothing for the vendor to track or pay.
  createForDelivery(delivery, po) {
    const liability = this.resolveDeliveryLiability(po || {});
    if (liability.payer !== 'vendor') return;
    const all = Store.get(SK.TRANSPORT) || [];
    const source = { ...po, transporter: delivery.transporter, weight: delivery.weight };
    const rec = this._buildRecord('delivery', delivery.id, source, liability);
    rec.id = `TRN-2026-${String(all.length + 1).padStart(3, '0')}`;
    all.unshift(rec);
    Store.set(SK.TRANSPORT, all);
  },

  /* ---- Seed generation (one record per existing delivery / return) ---- */
  buildSeed(deliveries, returns, purchaseOrders) {
    const records = [];
    let seq = 1;
    const seedStatuses = ['Pending', 'Approved', 'Paid', 'Approved', 'Overdue'];

    deliveries.forEach((d, idx) => {
      const po = purchaseOrders.find(p => p.id === d.poId) || {};
      const liability = this.resolveDeliveryLiability(po);
      if (liability.payer !== 'vendor') return; // warehouse-arranged: nothing for the vendor to track

      const source = { ...po, transporter: d.transporter, weight: d.weight };
      const rec = this._buildRecord('delivery', d.id, source, liability, {
        gtaForwardCharge: idx % 2 === 0,
        transporterType: idx % 3 === 0 ? 'individual' : 'company',
      });
      const st = seedStatuses[idx % seedStatuses.length];
      records.push({
        ...rec,
        id: `TRN-2026-${String(seq++).padStart(3, '0')}`,
        status: st,
        approvedOn: st === 'Pending' ? null : fmt(new Date(2026, 0, idx + 20)),
        paidOn: st === 'Paid' ? fmt(new Date(2026, 0, idx + 25)) : null,
      });
    });

    returns.forEach((r, idx) => {
      const liability = this.resolveReturnLiability(r);

      const rec = this._buildRecord('return', r.id, r, liability, {
        gtaForwardCharge: idx % 2 === 1,
        transporterType: idx % 2 === 0 ? 'individual' : 'company',
      });
      const st = r.status === 'Initiated' ? 'Pending' : seedStatuses[(idx + 2) % seedStatuses.length];
      records.push({
        ...rec,
        id: `TRN-2026-${String(seq++).padStart(3, '0')}`,
        status: st,
        approvedOn: st === 'Pending' ? null : fmt(new Date(2026, 1, idx + 8)),
        paidOn: st === 'Paid' ? fmt(new Date(2026, 1, idx + 12)) : null,
      });
    });

    return records;
  },
};
