export function fmt(d) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function rupees(n) {
  return '₹ ' + Number(n).toLocaleString('en-IN');
}

export function inPeriod(dateStr, period) {
  const d = new Date(dateStr);
  if (isNaN(d) || !period) return true;
  const now = new Date();
  if (period === 'day') return d.toDateString() === now.toDateString();
  if (period === 'week') {
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(now.getDate() - now.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  }
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  return true;
}

const STATUS_MAP = {
  Open: 'primary', 'Closing Soon': 'warning', Closed: 'gray', Awarded: 'success', Cancelled: 'danger',
  Submitted: 'primary', 'Under Evaluation': 'info', Rejected: 'danger',
  Pending: 'warning', Accepted: 'primary',
  Packed: 'info', Dispatched: 'primary', 'In Transit': 'warning', Delivered: 'success', Delayed: 'danger',
  'Pending Approval': 'warning', Approved: 'primary', 'Payment Pending': 'orange', Paid: 'success', Overdue: 'danger',
  Processing: 'info', Active: 'success',
  Initiated: 'gray', Received: 'info', Refunded: 'success',
  'In Stock': 'success', 'Low Stock': 'warning', 'No Stock': 'danger',
  'SKU Assigned': 'success',
};

export function getStatus(s) {
  return STATUS_MAP[s] || 'gray';
}
