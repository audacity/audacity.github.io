// Audacity Theme Configuration
module.exports = {
  colors: {
    // Brand colors
    accent: '#FF3254',      // Accent colour
    nav: '#FFFFFF',         // Nav background
    text: {
      primary: '#0F004D',   // Primary text colour
      contrast: '#FFFFFF',  // Text color contrast
    },
    background: {
      light: '#F1F0F5',     // Light background colour
      medium: '#E6E4EE',    // Medium background colour
      dark: '#261F43',      // Dark background colour
    },
    // Legacy primary brand colors (consider deprecating)
    primary: {
      DEFAULT: '#1D4ED8', // blue-700
      light: '#3B82F6',   // blue-500
      dark: '#1E40AF',    // blue-800
    },
    // Grayscale
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  // Typography
  typography: {
    fontFamily: {
      sans: ['Muse Sans', 'system-ui', 'sans-serif'],
      display: ['MuseDisplay-Harmony', 'system-ui', 'sans-serif'],
      symphony: ['Muse Display Symphony', 'system-ui', 'sans-serif'],
      harmony: ['Muse Display Harmony', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      10: ['0.625rem', { lineHeight: '1.25' }],      // 10px
      12: ['0.75rem', { lineHeight: '1.25' }],      // 12px
      16: ['1rem', { lineHeight: '1.5' }],          // 16px
      18: ['1.125rem', { lineHeight: '1.5' }],      // 18px
      20: ['1.25rem', { lineHeight: '1.5' }],       // 20px
      24: ['1.5rem', { lineHeight: '1.5' }],        // 24px
      32: ['2rem', { lineHeight: '1.25' }],          // 32px
      56: ['3.5rem', { lineHeight: '1' }],          // 56px
      64: ['4rem', { lineHeight: '1' }],          // 64px
    },
  },
  // Spacing (can customize if needed)
  spacing: {
    // Inherits from Tailwind defaults, add custom values here
  },
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    none: 'none',
  },
};
