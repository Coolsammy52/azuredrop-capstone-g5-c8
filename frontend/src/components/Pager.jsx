/** Pager: previous / next, "Page 2 of 5" and total count, from the API pagination object. */
import Icon from './Icon.jsx';

export default function Pager({ pagination, onPage, disabled }) {
  if (!pagination || pagination.total_pages <= 0) return null;
  const { page, total_pages: totalPages, total } = pagination;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 flex-wrap mt-4">
      <p className="caption" aria-live="polite">{total} {total === 1 ? 'file' : 'files'} · Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>
          <Icon name="chevleft" size={14} /> Previous
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <Icon name="chevright" size={14} />
        </button>
      </div>
    </nav>
  );
}
