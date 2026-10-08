/**
 * File list for the dashboard: a table at 640 px and wider, cards below that.
 * Sorting applies to the loaded page only (the API only returns newest first).
 */
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Badge, Button, FileChip } from './ui.jsx';
import { formatBytes, formatDate } from '../utils/format.js';

const COLS = [
  { key: 'filename', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'file_size', label: 'Size' },
  { key: 'uploaded_at', label: 'Uploaded' },
];

/** Sort a copy of the loaded files. */
export function sortFiles(files, sort) {
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...files].sort((a, b) => {
    let x = a[sort.key]; let y = b[sort.key];
    if (sort.key === 'uploaded_at') { x = new Date(x).getTime(); y = new Date(y).getTime(); }
    else if (sort.key === 'file_size') { x = Number(x); y = Number(y); }
    else { x = String(x || '').toLowerCase(); y = String(y || '').toLowerCase(); }
    return x < y ? -dir : x > y ? dir : 0;
  });
}

function Actions({ file, onDownload, onShare, downloadingId }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <Button variant="ghost" size="sm" icon loading={downloadingId === file.id} onClick={() => onDownload(file)} aria-label={`Download ${file.filename}`} title="Download">
        {downloadingId !== file.id && <Icon name="download" size={16} />}
      </Button>
      <Button variant="ghost" size="sm" icon onClick={() => onShare(file)} aria-label={`Share ${file.filename}`} title="Share">
        <Icon name="share" size={16} />
      </Button>
      <Link to={`/files/${file.id}`} className="btn btn-secondary btn-sm" aria-label={`Details for ${file.filename}`}>Details</Link>
    </div>
  );
}

export default function FileList({ files, sort, onSort, onDownload, onShare, downloadingId }) {
  return (
    <>
      {/* Table: hidden under 640 px */}
      <div className="hidden sm:block border border-line rounded bg-surface overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: 620 }}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} scope="col" className="text-left px-3.5 py-2.5 border-b border-line" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}
                  aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer" style={{ font: 'inherit', color: 'inherit' }}>
                    {c.label}
                    {sort.key === c.key && <Icon name={sort.dir === 'asc' ? 'arrowup' : 'arrowdown'} size={12} />}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-3.5 py-2.5 border-b border-line text-right" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id} className="hover:bg-canvas">
                <td className="px-3.5 py-2.5 border-b border-line" style={{ maxWidth: 280 }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileChip fileType={f.file_type} filename={f.filename} />
                    <Link to={`/files/${f.id}`} className="truncate font-medium no-underline" style={{ color: 'var(--ink)' }} title={f.filename}>{f.filename}</Link>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 border-b border-line"><Badge>{f.category}</Badge></td>
                <td className="px-3.5 py-2.5 border-b border-line whitespace-nowrap">{formatBytes(f.file_size)}</td>
                <td className="px-3.5 py-2.5 border-b border-line whitespace-nowrap">{formatDate(f.uploaded_at)}</td>
                <td className="px-3.5 py-2.5 border-b border-line"><Actions file={f} onDownload={onDownload} onShare={onShare} downloadingId={downloadingId} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards: under 640 px */}
      <ul className="sm:hidden list-none m-0 p-0 flex flex-col gap-3">
        {files.map((f) => (
          <li key={f.id} className="card">
            <div className="flex items-start gap-2.5 min-w-0">
              <FileChip fileType={f.file_type} filename={f.filename} />
              <div className="min-w-0 flex-1">
                <Link to={`/files/${f.id}`} className="block truncate font-medium no-underline" style={{ color: 'var(--ink)' }} title={f.filename}>{f.filename}</Link>
                <p className="caption mt-0.5">{formatBytes(f.file_size)} · {formatDate(f.uploaded_at)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-3">
              <Badge>{f.category}</Badge>
              <Actions file={f} onDownload={onDownload} onShare={onShare} downloadingId={downloadingId} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function FileListSkeleton() {
  return (
    <div className="border border-line rounded bg-surface overflow-hidden" role="status" aria-live="polite" aria-label="Loading files">
      <span className="sr-only-live">Loading files</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3.5 py-3 border-b border-line last:border-b-0">
          <div className="skeleton" style={{ width: 28, height: 28 }} />
          <div className="skeleton flex-1" style={{ height: 14, maxWidth: 260 }} />
          <div className="skeleton hidden sm:block" style={{ height: 14, width: 70 }} />
          <div className="skeleton hidden sm:block" style={{ height: 14, width: 50 }} />
        </div>
      ))}
    </div>
  );
}
