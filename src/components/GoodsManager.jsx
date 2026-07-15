import { useMemo, useState } from 'react';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { rupees } from '../utils/helpers';
import Badge from './Badge';
import DataTable from './DataTable';
import { svgIcon } from './Icon';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

export const CATEGORIES = ['Fabric', 'Yarn', 'Trims', 'Packaging', 'Dyes & Chemicals', 'Labels', 'Other'];
export const UNITS = ['Pcs', 'Mtrs', 'Kgs', 'Sets', 'Cones', 'Rolls'];
const LOW_STOCK_THRESHOLD = 100;

function stockStatus(qty) {
  if (qty <= 0) return 'No Stock';
  if (qty < LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
}

// Registration's Goods step reuses this exact same manager but in `compact` mode: no search/category
// filter, no Stock Status column, no Submit to Catalog action (that only makes sense once a vendor
// is approved) — and it reads/writes a separate draft key so a new registration always starts from
// an empty list instead of whatever goods already exist in the shared store. register.html's
// submit flow merges the draft into the real goods store once registration succeeds.
export default function GoodsManager({ compact = false, renderExtraActions }) {
  const modal = useModal();
  const toast = useToast();
  const storeKey = compact ? SK.REG_GOODS_DRAFT : SK.GOODS;
  const [goods, setGoods] = useState(() => Store.get(storeKey) || []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  function refresh() { setGoods(Store.get(storeKey) || []); }
  function persist(list) { Store.set(storeKey, list); setGoods(list); }

  const filtered = useMemo(() => {
    let rows = goods;
    if (category) rows = rows.filter(r => r.category === category);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [goods, search, category]);

  function openForm(item) {
    let nameEl, categoryEl, unitEl, qtyEl, priceEl;
    function submit() {
      const name = nameEl.value.trim();
      const cat = categoryEl.value;
      const unit = unitEl.value;
      const quantity = parseFloat(qtyEl.value);
      const price = parseFloat(priceEl.value);
      const list = Store.get(storeKey) || [];
      if (item) {
        const i = list.findIndex(g => g.id === item.id);
        if (i > -1) list[i] = { ...list[i], name, category: cat, unit, quantity, price };
      } else {
        const newId = 'GD-' + String(list.length + 1).padStart(3, '0');
        list.unshift({ id: newId, name, category: cat, unit, quantity, price });
      }
      persist(list);
      modal.close();
      toast(item ? 'Goods Updated' : 'Goods Added', `${name} has been ${item ? 'updated' : 'added'} successfully.`, 'success');
    }

    modal.show({
      title: item ? `Edit ${item.name}` : 'Add Goods',
      size: 'modal-lg',
      icon: 'primary',
      iconSvg: svgIcon('box'),
      body: (
        <form>
          <div className="form-row form-row-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Item Name</label>
              <input className="form-control" ref={el => (nameEl = el)} defaultValue={item ? item.name : ''} placeholder="e.g. Cotton Woven Fabric 60s x 60s" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" ref={el => (categoryEl = el)} defaultValue={item ? item.category : CATEGORIES[0]}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" ref={el => (unitEl = el)} defaultValue={item ? item.unit : UNITS[0]}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Available</label>
              <input className="form-control" type="number" min="0" ref={el => (qtyEl = el)} defaultValue={item ? item.quantity : ''} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Price per Unit (₹)</label>
              <input className="form-control" type="number" min="0" ref={el => (priceEl = el)} defaultValue={item ? item.price : ''} placeholder="0.00" />
            </div>
          </div>
        </form>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{item ? 'Save Changes' : 'Add Goods'}</button>
        </>
      ),
    });
  }

  function openDelete(item) {
    modal.show({
      title: 'Delete Goods',
      size: 'modal-sm',
      icon: 'danger',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
      body: <p style={{ color: 'var(--text-body)', fontSize: 14, lineHeight: 1.6 }}>Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.</p>,
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              const list = Store.get(storeKey) || [];
              persist(list.filter(g => g.id !== item.id));
              modal.close();
              toast('Goods Deleted', `${item.name} has been removed.`, 'success');
            }}
          >
            Delete
          </button>
        </>
      ),
    });
  }

  const columns = [
    { key: 'id', label: 'Item Code', cls: 'td-mono' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category', render: r => <Badge>{r.category}</Badge> },
    { key: 'unit', label: 'Unit' },
    { key: 'quantity', label: 'Quantity', render: r => Number(r.quantity).toLocaleString('en-IN') },
    ...(compact ? [] : [{ key: 'stock', label: 'Stock Status', render: r => <Badge>{stockStatus(r.quantity)}</Badge> }]),
    { key: 'price', label: 'Price/Unit', render: r => rupees(r.price) },
    {
      key: '_actions', label: 'Actions', render: r => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="Edit" onClick={(e) => { e.stopPropagation(); openForm(r); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg>
          </button>
          <button className="action-btn danger" data-tooltip="Delete" onClick={(e) => { e.stopPropagation(); openDelete(r); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
          </button>
          {renderExtraActions ? renderExtraActions(r) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      {compact ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Goods
          </button>
        </div>
      ) : (
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search goods…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => openForm(null)} style={{ marginLeft: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Goods
          </button>
        </div>
      )}
      <div className="card">
        <div className="table-wrapper">
          <DataTable columns={columns} data={filtered} rowsPerPage={10} />
        </div>
      </div>
    </div>
  );
}
