/**
 * Upload screen. Multiple files are uploaded one after another (the backend takes one file per request),
 * each with its own row, progress, cancel and retry. Files are validated in the browser first (10 MB, allowed
 * types) so invalid files never hit the API. XMLHttpRequest gives upload progress.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Banner, Button, FileChip, TextField } from '../components/ui.jsx';
import { updateCategory, uploadFile } from '../api/files.js';
import { useCategories } from '../context/CategoriesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatBytes } from '../utils/format.js';
import { ACCEPT_ATTR, validateUpload } from '../utils/files.js';

let seq = 0;

export default function UploadPage() {
  const { categories, refresh } = useCategories();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef({}); // item key -> abort function for the running upload
  const runningRef = useRef(false);
  const dragDepth = useRef(0);

  const patch = useCallback((key, changes) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...changes } : i))), []);

  function addFiles(fileList) {
    const added = Array.from(fileList || []).map((file) => {
      const invalid = validateUpload(file); // same rules as the server, no API call when invalid
      return { key: `u${++seq}`, file, status: invalid ? 'error' : 'queued', percent: 0, loaded: 0, total: file.size, error: invalid || '', warning: '', fileId: null, invalid: Boolean(invalid), category: category.trim() };
    });
    if (added.length) setItems((list) => [...list, ...added]);
  }

  // Queue runner: start the next queued item when nothing is uploading.
  useEffect(() => {
    if (runningRef.current) return;
    const next = items.find((i) => i.status === 'queued');
    if (!next) return;
    runningRef.current = true;
    patch(next.key, { status: 'uploading', percent: 0, loaded: 0, error: '' });
    const { promise, abort } = uploadFile(next.file, (percent, loaded, total) => patch(next.key, { percent, loaded, total }));
    abortRef.current[next.key] = abort;
    promise
      .then(async (file) => {
        let warning = '';
        const cat = next.category;
        if (cat && cat.toLowerCase() !== 'other' && file && file.id != null) {
          try { await updateCategory(file.id, cat); } catch (e) { if (e.status !== 401) warning = 'Uploaded, but the category was not saved. You can set it on the file page.'; }
        }
        patch(next.key, { status: 'success', percent: 100, fileId: file ? file.id : null, warning });
        refresh();
      })
      .catch((e) => {
        if (e.name === 'AbortError') patch(next.key, { status: 'error', error: 'Upload cancelled.', percent: 0 });
        else if (e.status === 401) patch(next.key, { status: 'error', error: 'Your session expired. Log in again.', percent: 0 });
        else patch(next.key, { status: 'error', error: e.message, percent: 0 });
      })
      .finally(() => { delete abortRef.current[next.key]; runningRef.current = false; setItems((l) => [...l]); });
  }, [items, patch, refresh]);

  // Abort anything in flight when leaving the page.
  useEffect(() => () => { Object.values(abortRef.current).forEach((fn) => fn()); }, []);

  function cancel(item) {
    if (item.status === 'uploading') abortRef.current[item.key]?.();
    else setItems((l) => l.filter((i) => i.key !== item.key)); // queued: just remove
  }
  const retry = (item) => patch(item.key, { status: 'queued', error: '', percent: 0 });
  const remove = (item) => setItems((l) => l.filter((i) => i.key !== item.key));

  function onDrop(e) {
    e.preventDefault(); dragDepth.current = 0; setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const uploading = items.find((i) => i.status === 'uploading');
  const queuedCount = items.filter((i) => i.status === 'queued').length;
  const allDone = items.length > 0 && items.every((i) => i.status === 'success');
  const anyError = items.some((i) => i.status === 'error');
  const state = dragging ? 'drag' : uploading || queuedCount ? 'uploading' : allDone ? 'success' : anyError ? 'error' : 'idle';
  const zone = {
    idle: { border: 'var(--line)', bg: 'var(--surface)' },
    drag: { border: 'var(--primary)', bg: 'var(--tint)' },
    uploading: { border: 'var(--primary)', bg: 'var(--surface)' },
    success: { border: 'var(--ok)', bg: 'var(--okbg)' },
    error: { border: 'var(--err)', bg: 'var(--errbg)' },
  }[state];

  const title = {
    idle: 'Drag files here to upload',
    drag: 'Drop to upload',
    uploading: `Uploading${uploading ? ` ${uploading.file.name}` : ''}`,
    success: 'Upload complete',
    error: 'Some files could not be uploaded',
  }[state];

  function openPicker() { inputRef.current?.click(); }

  return (
    <div className="flex flex-col gap-5">
      <h1>Upload</h1>

      <div className="max-w-md">
        <TextField
          label="Category (optional)" value={category} maxLength={50} list="category-suggestions" autoComplete="off"
          onChange={(e) => setCategory(e.target.value)} help="Applied to files you add next. Leave empty to use “other”."
        />
        <datalist id="category-suggestions">
          {categories.map((c) => <option key={c.category} value={c.category} />)}
        </datalist>
      </div>

      <div
        role="button" tabIndex={0} aria-label="Upload files. Drop files here or press Enter to browse."
        className="text-center cursor-pointer"
        style={{ border: `2px dashed ${zone.border}`, background: zone.bg, borderRadius: 12, padding: '30px 20px', transition: 'border-color .15s, background-color .15s' }}
        onClick={(e) => { if (e.target === e.currentTarget || !e.target.closest('button')) openPicker(); }}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPicker(); } }}
        onDragEnter={(e) => { e.preventDefault(); dragDepth.current += 1; setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => { dragDepth.current -= 1; if (dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); } }}
        onDrop={onDrop}
      >
        <div className="flex justify-center mb-2" style={{ color: state === 'success' ? 'var(--ok)' : state === 'error' ? 'var(--err)' : 'var(--primary)' }}>
          <Icon name={state === 'success' ? 'check' : state === 'error' ? 'alert' : 'upload'} size={28} />
        </div>
        <p className="mx-auto" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 17, fontWeight: 600 }} aria-live="polite">{title}</p>
        {state === 'uploading' && uploading && (
          <div className="mt-3 mx-auto" style={{ maxWidth: 360 }}>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploading.percent} aria-label={`Uploading ${uploading.file.name}`} style={{ height: 6, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${uploading.percent}%`, height: '100%', background: 'var(--primary)', borderRadius: 999, transition: 'width .15s' }} />
            </div>
            <p className="caption mt-1.5">{uploading.percent}% · {formatBytes(uploading.loaded)} of {formatBytes(uploading.total)}{queuedCount ? ` · ${queuedCount} waiting` : ''}</p>
          </div>
        )}
        <p className="caption mt-2 mx-auto">PDF, Word, TXT, JPG or PNG. Up to 10 MB each.</p>
        <div className="mt-3 flex justify-center gap-2">
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openPicker(); }}>Browse files</Button>
          {uploading && <Button variant="secondary" onClick={(e) => { e.stopPropagation(); cancel(uploading); }}>Cancel</Button>}
        </div>
        <input ref={inputRef} type="file" multiple accept={ACCEPT_ATTR} className="hidden" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {items.length > 0 && (
        <ul className="list-none m-0 p-0 flex flex-col gap-3" aria-label="Upload queue">
          {items.map((i) => (
            <li key={i.key} className="card">
              <div className="flex items-center gap-3 min-w-0">
                <FileChip fileType={i.file.type} filename={i.file.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={i.file.name}>{i.file.name}</p>
                  <p className="caption">{formatBytes(i.file.size)}{i.category ? ` · ${i.category}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {i.status === 'uploading' && <Button size="sm" variant="secondary" onClick={() => cancel(i)}>Cancel</Button>}
                  {i.status === 'queued' && <><span className="caption mr-1">Waiting</span><Button size="sm" variant="secondary" onClick={() => cancel(i)} aria-label={`Remove ${i.file.name} from queue`}>Remove</Button></>}
                  {i.status === 'error' && <>{!i.invalid && <Button size="sm" variant="secondary" onClick={() => retry(i)}>Retry</Button>}<Button size="sm" variant="ghost" icon onClick={() => remove(i)} aria-label={`Dismiss ${i.file.name}`}><Icon name="close" size={14} /></Button></>}
                  {i.status === 'success' && i.fileId != null && <Link to={`/files/${i.fileId}`} className="btn btn-secondary btn-sm">View file</Link>}
                </div>
              </div>
              {i.status === 'uploading' && (
                <div className="mt-3">
                  <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={i.percent} aria-label={`Progress for ${i.file.name}`} style={{ height: 6, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ width: `${i.percent}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
                  </div>
                  <p className="caption mt-1">{i.percent}% of {formatBytes(i.total)}</p>
                </div>
              )}
              {i.status === 'error' && <div className="mt-3"><Banner type="err">{i.error}</Banner></div>}
              {i.status === 'success' && <div className="mt-3"><Banner type="ok">Uploaded successfully.</Banner></div>}
              {i.warning && <div className="mt-2"><Banner type="warn">{i.warning}</Banner></div>}
            </li>
          ))}
        </ul>
      )}

      {allDone && (
        <div className="flex gap-2 flex-wrap">
          <Link to="/" className="btn btn-primary">Go to my files</Link>
          <Button variant="secondary" onClick={() => { setItems([]); toast.success('Ready for more files.'); }}>Upload another</Button>
        </div>
      )}
    </div>
  );
}
