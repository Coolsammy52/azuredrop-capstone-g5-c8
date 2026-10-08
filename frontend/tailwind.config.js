// Tailwind config: every colour maps to a CSS variable so light/dark mode switches automatically.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        primary: 'var(--primary)',
        'primary-h': 'var(--primary-h)',
        'on-primary': 'var(--on-primary)',
        tint: 'var(--tint)',
        ok: 'var(--ok)',
        okbg: 'var(--okbg)',
        warn: 'var(--warn)',
        warnbg: 'var(--warnbg)',
        err: 'var(--err)',
        errbg: 'var(--errbg)',
      },
      borderRadius: { DEFAULT: 'var(--r)' },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
