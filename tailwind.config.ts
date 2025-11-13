import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        secondary: '#22d3ee'
      },
      keyframes: {
        walk: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(8px)' },
          '100%': { transform: 'translateX(0)' }
        },
        floaty: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0.6)' },
          '50%': { boxShadow: '0 0 0 12px rgba(124, 58, 237, 0)' }
        }
      },
      animation: {
        walk: 'walk 1.2s ease-in-out infinite',
        floaty: 'floaty 3s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
export default config
