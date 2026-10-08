/** Consistent inline SVG icon set (24x24 viewBox, 2px stroke, currentColor). Decorative: aria-hidden. */
const PATHS = {
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 8 5-5 5 5" /><path d="M5 20h14" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7" /></>,
  alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5v.01" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></>,
  folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.4 6.5C3.8 8.3 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  logout: <><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M16 8l4 4-4 4M20 12H9" /></>,
  chevleft: <><path d="m15 5-7 7 7 7" /></>,
  chevright: <><path d="m9 5 7 7-7 7" /></>,
  arrowup: <><path d="M12 19V5M6 11l6-6 6 6" /></>,
  arrowdown: <><path d="M12 5v14M6 13l6 6 6-6" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
};

/** @param {{name:string, size?:number, className?:string}} props */
export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}
    >
      {PATHS[name] || null}
    </svg>
  );
}
