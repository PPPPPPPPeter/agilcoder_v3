/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg':      '#f5f7fa',
        'panel-surface': '#ffffff',
        'panel-border':  '#e8ecf0',
        'panel-muted':   '#8c8c8c',
        'accent':        '#1677ff',
        'accent-hover':  '#0958d9',
        'preview-bg':    '#f0f2f5',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
    },
  },
  plugins: [],
}
