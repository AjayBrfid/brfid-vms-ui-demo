import { SK, SEED_VERSION } from './storageKeys';
import { SEED } from './seedData';
import { TransportPayments } from './transportPayments';
import { fmt } from '../utils/helpers';

/* ============================================================
   LOCAL STORAGE UTILS
   ============================================================ */
export const Store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  seed() {
    if (localStorage.getItem('vms_seed_ver') !== SEED_VERSION) {
      Object.values(SK).filter(k => k !== SK.SESSION).forEach(k => localStorage.removeItem(k));
      localStorage.setItem('vms_seed_ver', SEED_VERSION);
    }
    if (!this.get(SK.VENDORS)) this.set(SK.VENDORS, SEED.vendors);
    if (!this.get(SK.RFQS)) this.set(SK.RFQS, SEED.rfqs);
    if (!this.get(SK.QUOTES)) this.set(SK.QUOTES, SEED.quotations);
    if (!this.get(SK.POS)) this.set(SK.POS, SEED.purchaseOrders);
    if (!this.get(SK.DELIVERIES)) this.set(SK.DELIVERIES, SEED.deliveries);
    if (!this.get(SK.RETURNS)) this.set(SK.RETURNS, SEED.returns);
    if (!this.get(SK.INVOICES)) this.set(SK.INVOICES, SEED.invoices);
    if (!this.get(SK.PAYMENTS)) this.set(SK.PAYMENTS, SEED.payments);
    if (!this.get(SK.NOTIFS)) this.set(SK.NOTIFS, SEED.notifications);
    if (!this.get(SK.GOODS)) this.set(SK.GOODS, SEED.goods);
    if (!this.get(SK.CATALOG)) this.set(SK.CATALOG, SEED.catalog);
    if (!this.get(SK.TRANSPORT)) {
      this.set(SK.TRANSPORT, TransportPayments.buildSeed(SEED.deliveries, SEED.returns, SEED.purchaseOrders));
    }
  },
};

/* ============================================================
   AUTH
   ============================================================ */
export const Auth = {
  // This portal is a UI-flow demo, not a real auth backend — credentials aren't checked.
  // Whatever email is entered signs in as that vendor if one exists, otherwise the demo vendor.
  login(email, password) {
    const vendors = Store.get(SK.VENDORS) || [];
    const v = vendors.find(x => x.email === email) || vendors[0];
    if (!v) return { ok: false, msg: 'No vendor account found.' };
    Store.set(SK.SESSION, { id: v.id, email: v.email, name: v.company.name, contact: v.contact.person });
    return { ok: true };
  },
  logout() {
    localStorage.removeItem(SK.SESSION);
  },
  session() { return Store.get(SK.SESSION); },
  register(data) {
    const vendors = Store.get(SK.VENDORS) || [];
    if (vendors.find(v => v.email === data.email)) return { ok: false, msg: 'Email already registered.' };
    const id = 'V' + String(vendors.length + 2).padStart(3, '0');
    vendors.push({ id, ...data, approved: false, registeredOn: fmt(new Date()), status: 'Pending' });
    Store.set(SK.VENDORS, vendors);
    return { ok: true };
  },
};
