import { useNavigate } from 'react-router-dom';
import { Store } from '../services/store';
import { SK } from '../services/storageKeys';
import GoodsManager from '../components/GoodsManager';

export default function GoodsPage() {
  const navigate = useNavigate();

  // Mirrors the original GoodsPage._actions(r, compact) non-compact branch: if this goods item
  // already has a catalog submission, show its status instead of the "Submit to Catalog" button.
  function renderExtraActions(item) {
    const catalog = Store.get(SK.CATALOG) || [];
    const existing = catalog.find(c => c.goodsId === item.id);

    if (existing) {
      const hasSku = !!existing.sku;
      return (
        <span
          className={`badge badge-${hasSku ? 'success' : 'warning'}`}
          style={{ fontSize: 11 }}
          title={hasSku ? `SKU: ${existing.sku}` : 'Waiting for Super Admin Approval'}
        >
          {hasSku ? 'SKU Assigned' : 'Awaiting Approval'}
        </span>
      );
    }

    // Simplest handoff to the Catalog page: navigate with a goodsId query param, which
    // CatalogPage reads on mount to auto-open its submission modal for this item.
    return (
      <button
        className="action-btn"
        data-tooltip="Submit to Catalog"
        onClick={(e) => { e.stopPropagation(); navigate(`/catalog?goodsId=${item.id}`); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>My Goods</span></div>
          <h1>My Goods</h1>
          <p>Add and manage the goods you supply, along with available quantity and pricing.</p>
        </div>
      </div>

      <GoodsManager renderExtraActions={renderExtraActions} />
    </div>
  );
}
