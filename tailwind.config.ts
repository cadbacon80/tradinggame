import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        sector: {
          consumer: '#f59e0b',
          pets: '#ec4899',
          space: '#6366f1',
          biotech: '#14b8a6',
          energy: '#84cc16',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
