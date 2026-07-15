import { useEffect, useMemo, useState } from 'react';

// Controlled data table: parent owns search/filter state and passes the already-filtered `data`
// array; this component owns only sort + "load more" pagination, mirroring the original Table
// helper's behavior (rows-per-page select + Load More button that appear once total >= 10).
export default function DataTable({ columns, data, rowsPerPage = 10, onRowClick, emptyText = 'Try adjusting your search or filters.' }) {
  const [sort, setSort] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [perPage, setPerPage] = useState(rowsPerPage);
  const [loaded, setLoaded] = useState(rowsPerPage);

  useEffect(() => { setLoaded(perPage); }, [data, perPage]);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sort] ?? '', bv = b[sort] ?? '';
      return typeof av === 'number' ? (av - bv) * sortDir : String(av).localeCompare(String(bv)) * sortDir;
    });
    return copy;
  }, [data, sort, sortDir]);

  const total = sorted.length;
  const shown = Math.min(loaded, total);
  const rows = sorted.slice(0, shown);
  const showPagination = total >= 10;

  function handleSort(key) {
    setSortDir(d => (sort === key ? -d : 1));
    setSort(key);
  }

  return (
    <>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th
                key={c.key}
                className={sort === c.key ? (sortDir === 1 ? 'sorted-asc' : 'sorted-desc') : ''}
                style={c.width ? { width: c.width } : undefined}
                onClick={() => handleSort(c.key)}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, i) => (
            <tr key={row.id ?? i} style={{ cursor: onRowClick ? 'pointer' : 'default' }} onClick={() => onRowClick && onRowClick(row, i)}>
              {columns.map(c => (
                <td key={c.key} className={c.cls || ''}>{c.render ? c.render(row) : (row[c.key] ?? '')}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  </div>
                  <h3>No records found</h3>
                  <p>{emptyText}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="table-pagination">
        <div className="pagination-top-row">
          <div className="pagination-info">Showing {total === 0 ? 0 : shown} of {total}</div>
          {showPagination ? (
            <div className="rows-per-page">
              <label htmlFor="table-rpp">Rows per page</label>
              <select id="table-rpp" className="filter-select" value={perPage} onChange={e => setPerPage(parseInt(e.target.value, 10))}>
                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ) : null}
        </div>
        {showPagination ? (
          <div className="load-more-wrap">
            <button className="load-more-btn" disabled={shown >= total} onClick={() => setLoaded(l => l + perPage)}>
              <span>Load More</span>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
