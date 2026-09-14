import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared/src/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        euro: {
          yellow: {
            DEFAULT: '#FACC15', // Vibrant Euro Yellow
            hover: '#EAB308',
            light: '#FEF08A',
            soft: '#FEF9C3',
          },
          dark: {
            DEFAULT: '#0F172A', // Slate 900 primary dark
            surface: '#1E293B', // Slate 800
            border: '#334155',
            muted: '#64748B',
          },
          light: {
            DEFAULT: '#FFFFFF',
            surface: '#F8FAFC',
            border: '#E2E8F0',
            muted: '#94A3B8',
          },
          critical: {
            DEFAULT: '#EF4444', // Red reserved strictly for Expired/Delete/Errors
            hover: '#DC2626',
            light: '#FEE2E2',
            text: '#B91C1C',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
