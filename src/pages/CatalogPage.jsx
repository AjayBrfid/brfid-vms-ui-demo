import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Auth, Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { fmt } from '../utils/helpers';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Icon, { svgIcon } from '../components/Icon';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

const PRODUCT_TYPES = ["Men's Wear", "Women's Wear", 'Kids & Infants', 'School Uniforms', 'Sportswear', 'Ethnic Wear', 'Workwear', 'Denim', 'Innerwear', 'Winterwear'];
const GENDERS = ['Men', 'Women', 'Unisex', 'Boys', 'Girls'];
const FABRICS = ['Cotton', 'Poly-Cotton', 'Polyester', 'Denim', 'Fleece', 'Linen', 'Viscose', 'Wool', 'Nylon Blend', 'Lycra Blend', 'Rayon', 'Other'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function statusOf(item) { return item.sku ? 'SKU Assigned' : 'Submitted'; }

// Small stateful piece for the "Upload Product Documents" modal body — needs its own local state
// (selected file names) that updates without re-triggering the parent's modal.show() call.
function UploadForm({ filesRef }) {
  const inputRef = useRef(null);
  const [names, setNames] = useState('');
  return (
    <>
      <div className="file-upload" onClick={() => inputRef.current?.click()}>
        <div className="file-upload-icon">📄</div>
        <div className="file-upload-text">Click to upload product documents</div>
        <div className="file-upload-hint">PDF, DOC, XLS, images up to 10MB each</div>
        <div className="file-upload-name">{names}</div>
      </div>
      <input
        type="file"
        ref={inputRef}
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          filesRef.current = files;
          setNames(files.map(f => f.name).join(', '));
        }}
      />
    </>
  );
}

// Exported so GoodsPage (or any other caller) could in principle open the submission modal
// directly. GoodsPage instead prefers the simpler query-param handoff (see below), but this
// stays exported for reuse/documentation purposes.
export const CATALOG_SUBMIT_PARAM = 'goodsId';

export default function CatalogPage() {
  const modal = useModal();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sess = Auth.session();

  const [items, setItems] = useState(() => (Store.get(SK.CATALOG) || []).filter(c => c.vendorId === sess?.id));
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  function refresh() { setItems((Store.get(SK.CATALOG) || []).filter(c => c.vendorId === sess?.id)); }
  function persist(list) { Store.set(SK.CATALOG, list); refresh(); }

  const decorated = useMemo(() => items.map(i => ({ ...i, status: statusOf(i) })), [items]);

  const filtered = useMemo(() => {
    let rows = decorated;
    if (type) rows = rows.filter(r => r.productType === type);
    if (status) rows = rows.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)));
    }
    return rows;
  }, [decorated, type, status, search]);

  function openForm(item, presetGoodsId) {
    const goodsList = Store.get(SK.GOODS) || [];
    const good = item ? goodsList.find(g => g.id === item.goodsId) : goodsList.find(g => g.id === presetGoodsId);
    let typeEl, genderEl, fabricEl, colourEl, sizeEl, gsmEl, descEl;

    function submit() {
      const productType = typeEl.value;
      const gender = genderEl.value;
      const fabric = fabricEl.value;
      const colour = colourEl.value.trim();
      const size = sizeEl.value;
      const gsm = parseFloat(gsmEl.value);
      const description = descEl.value.trim();
      const list = Store.get(SK.CATALOG) || [];
      let name;
      if (item) {
        const i = list.findIndex(c => c.id === item.id);
        if (i > -1) { list[i] = { ...list[i], productType, gender, fabric, colour, size, gsm, description }; name = list[i].name; }
      } else {
        name = good ? good.name : 'Untitled Product';
        const newId = 'CAT-' + String(list.length + 1).padStart(3, '0');
        const today = fmt(new Date());
        list.unshift({
          id: newId, vendorId: sess?.id, goodsId: presetGoodsId, name, productType, gender, fabric, colour, size, gsm, description,
          sku: null, createdDate: today, submittedDate: today,
          documents: [],
        });
      }
      persist(list);
      modal.close();
      toast(
        item ? 'Submission Updated' : 'Submitted for Approval',
        `${name} has been ${item ? 'updated' : 'submitted to the Super Admin team and is now awaiting approval'}.`,
        'success'
      );
    }

    modal.show({
      title: item ? `Edit Submission — ${item.name}` : `Submit to Catalog — ${good ? good.name : ''}`,
      size: 'modal-lg',
      icon: 'primary',
      iconSvg: svgIcon('layers'),
      body: (
        <form>
          <div className="form-row form-row-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Product (from My Goods)</label>
              <input className="form-control" defaultValue={item ? item.name : (good ? good.name : 'Unknown item')} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <select className="form-control" ref={el => (typeEl = el)} defaultValue={item ? item.productType : PRODUCT_TYPES[0]}>
                {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-control" ref={el => (genderEl = el)} defaultValue={item ? item.gender : GENDERS[0]}>
                {GENDERS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fabric</label>
              <select className="form-control" ref={el => (fabricEl = el)} defaultValue={item ? item.fabric : FABRICS[0]}>
                {FABRICS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Colour</label>
              <input className="form-control" ref={el => (colourEl = el)} defaultValue={item ? item.colour : ''} placeholder="e.g. Navy Blue" />
            </div>
            <div className="form-group">
              <label className="form-label">Size</label>
              <select className="form-control" ref={el => (sizeEl = el)} defaultValue={item ? item.size : SIZES[0]}>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                One size per entry — a different colour or size needs its own SKU, so submit it as a separate item.
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">GSM</label>
              <input className="form-control" type="number" min="0" ref={el => (gsmEl = el)} defaultValue={item ? item.gsm : ''} placeholder="e.g. 180" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} ref={el => (descEl = el)} defaultValue={item ? item.description : ''} placeholder="Fabric composition, construction, styling details…" />
            </div>
          </div>
        </form>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{item ? 'Save Changes' : 'Submit for Approval'}</button>
        </>
      ),
    });
  }

  function openView(item) {
    const isSku = !!item.sku;
    modal.show({
      title: 'Catalog ' + item.id,
      size: 'modal-lg',
      icon: 'primary',
      iconSvg: svgIcon('layers'),
      body: (
        <>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="detail-item"><div className="detail-label">Vendor ID</div><div className="detail-value td-mono">{item.vendorId}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><Badge>{isSku ? 'SKU Assigned' : 'Submitted'}</Badge></div></div>
            <div className="detail-item"><div className="detail-label">SKU</div><div className="detail-value td-mono">{item.sku || 'Waiting for Super Admin Approval'}</div></div>
            <div className="detail-item"><div className="detail-label">Product Name</div><div className="detail-value">{item.name}</div></div>
            <div className="detail-item"><div className="detail-label">Product Type</div><div className="detail-value">{item.productType}</div></div>
            <div className="detail-item"><div className="detail-label">Gender</div><div className="detail-value">{item.gender}</div></div>
            <div className="detail-item"><div className="detail-label">Fabric</div><div className="detail-value">{item.fabric}</div></div>
            <div className="detail-item"><div className="detail-label">Colour</div><div className="detail-value">{item.colour}</div></div>
            <div className="detail-item"><div className="detail-label">Size</div><div className="detail-value">{item.size}</div></div>
            <div className="detail-item"><div className="detail-label">GSM</div><div className="detail-value">{item.gsm}</div></div>
            <div className="detail-item"><div className="detail-label">Submitted On</div><div className="detail-value">{item.submittedDate || '—'}</div></div>
          </div>
          <div className="detail-item" style={{ marginBottom: 16 }}>
            <div className="detail-label">Description</div>
            <div className="detail-value">{item.description || '—'}</div>
          </div>
          <div className="sep"></div>
          <h4 style={{ margin: '16px 0', fontSize: 14, color: 'var(--text-dark)' }}>Product Documents</h4>
          {item.documents && item.documents.length ? (
            item.documents.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                <span>📄</span>
                <span className="detail-value">{d.name}</span>
                <span className="detail-label" style={{ margin: 0 }}>{d.uploadedDate}</span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No documents uploaded yet.</p>
          )}
        </>
      ),
      footer: <button className="btn btn-secondary" onClick={modal.close}>Close</button>,
    });
  }

  function openUpload(item) {
    const filesRef = { current: [] };

    function submit() {
      const files = filesRef.current;
      const list = Store.get(SK.CATALOG) || [];
      const i = list.findIndex(c => c.id === item.id);
      if (i > -1) {
        files.forEach(f => list[i].documents.push({ name: f.name, uploadedDate: fmt(new Date()) }));
        persist(list);
      }
      modal.close();
      toast('Documents Uploaded', `${files.length} file(s) added to ${item.id}.`, 'success');
    }

    modal.show({
      title: 'Upload Product Documents',
      size: 'modal-sm',
      icon: 'primary',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
      body: <UploadForm filesRef={filesRef} />,
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Upload</button>
        </>
      ),
    });
  }

  // Handoff from GoodsPage's "Submit to Catalog" action: it navigates here with ?goodsId=<id>,
  // we look the goods item up and auto-open the same submission modal, then strip the param so
  // a refresh doesn't reopen it.
  useEffect(() => {
    const goodsId = searchParams.get('goodsId');
    if (goodsId) {
      const goodsList = Store.get(SK.GOODS) || [];
      const good = goodsList.find(g => g.id === goodsId);
      if (good) openForm(null, goodsId);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('goodsId');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const columns = [
    { key: 'id', label: 'Catalog ID', cls: 'td-mono', render: r => <span className="td-link" onClick={(e) => { e.stopPropagation(); openView(r); }}>{r.id}</span> },
    {
      key: 'name', label: 'Product', render: r => (
        <>
          <div>{r.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{r.productType} · {r.gender}</div>
        </>
      )
    },
    {
      key: 'spec', label: 'Specification', render: r => (
        <>
          <div style={{ fontSize: 12.5 }}>{r.fabric} · {r.colour}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Size {r.size} · {r.gsm} GSM</div>
        </>
      )
    },
    { key: 'sku', label: 'SKU', cls: 'td-mono', render: r => r.sku || <span style={{ color: 'var(--warning)', fontWeight: 500 }}>Waiting for Super Admin Approval</span> },
    { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
    {
      key: '_actions', label: 'Actions', render: r => (
        <div className="table-actions">
          <button className="action-btn" data-tooltip="View Status" onClick={(e) => { e.stopPropagation(); openView(r); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          {!r.sku ? (
            <button className="action-btn" data-tooltip="Edit Catalog" onClick={(e) => { e.stopPropagation(); openForm(r); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg>
            </button>
          ) : null}
          <button className="action-btn" data-tooltip="Upload Product Documents" onClick={(e) => { e.stopPropagation(); openUpload(r); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          </button>
        </div>
      )
    },
  ];

  const summaryGroups = [
    { label: 'Submitted', color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'SKU Assigned', color: 'var(--success)', bg: 'var(--success-bg)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Product Catalog</span></div>
          <h1>Product Catalog</h1>
          <p>Items submitted from your <strong>My Goods</strong> inventory for Super Admin review. Once approved, a SKU is assigned and the product becomes visible to Warehouse.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/goods')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
          Submit from My Goods
        </button>
      </div>

      <div className="kpi-grid">
        {summaryGroups.map(g => (
          <div
            key={g.label}
            className="kpi-card"
            style={{ '--kpi-color': g.color, '--kpi-bg': g.bg, cursor: 'pointer' }}
            onClick={() => setStatus(g.label)}
          >
            <div className="kpi-icon"><Icon name="layers" /></div>
            <div className="kpi-body">
              <div className="kpi-value">{decorated.filter(i => i.status === g.label).length}</div>
              <div className="kpi-label">{g.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg className="table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search catalog…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All Product Types</option>
              {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Submitted</option>
              <option>SKU Assigned</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <DataTable columns={columns} data={filtered} rowsPerPage={10} />
        </div>
      </div>
    </div>
  );
}
