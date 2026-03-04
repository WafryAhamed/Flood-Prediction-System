export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'xxl': '32px',
        'section': '40px',
        'card': '24px',
        'inner': '20px',
      },
      colors: {
        // Backgrounds
        'bg-primary': '#F5F7FA',
        'bg-card': '#FFFFFF',
        'bg-sidebar': '#0F172A',
        'bg-dark': '#1F2937',
        
        // Text
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-light': '#9CA3AF',
        'border-light': '#E5E7EB',
        
        // Status Colors (Semantic)
        'critical': '#DC2626',
        'high': '#F97316',
        'warning': '#F59E0B',
        'caution': '#FBBF24',
        'safe': '#16A34A',
        'info': '#2563EB',

        // Semantic Risk Tokens
        'risk-critical': '#DC2626',
        'risk-high': '#F97316',
        'risk-warning': '#F59E0B',
        'risk-info': '#2563EB',
        'risk-safe': '#16A34A',
        
        // Extended Palette
        'red': { 600: '#DC2626', 700: '#B91C1C' },
        'orange': { 500: '#F97316', 600: '#EA580C' },
        'amber': { 500: '#F59E0B', 600: '#D97706' },
        'yellow': { 400: '#FACC15' },
        'green': { 500: '#22C55E', 600: '#16A34A' },
        'blue': { 600: '#2563EB', 700: '#1D4ED8' },
      },
      borderRadius: {
        'card': '12px',
        'xl': '12px',
      },
      boxShadow: {
        'none': 'none',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'light': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-sm': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
      },
    },
  },
}