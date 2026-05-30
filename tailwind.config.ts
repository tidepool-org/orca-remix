import { type Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { heroui } from '@heroui/react';
import defaultTheme from 'tailwindcss/defaultTheme';

const brandColors = {
  primary: {
    // Reference: handoff/visual-reference/skins.css --primary #5a63d8
    DEFAULT: '#5a63d8',
    '50': '#f0f1fc',
    '100': '#e7e9fb', // matches --primary-soft
    '200': '#c8ccf3',
    '300': '#a3a9ea',
    '400': '#7d85e0',
    '500': '#5a63d8',
    '600': '#474fc2', // matches --primary-strong
    '700': '#3d45b0', // matches --primary-soft-fg
    '800': '#2c3380',
    '900': '#1c2150',
    foreground: '#FFFFFF',
  },
  secondary: {
    // ref: https://tailcolor.com/palettes/9b68f7
    // DEFAULT uses 600 shade for WCAG AA contrast on flat chip backgrounds
    DEFAULT: '#7c53c6',
    '50': '#f5f0fe',
    '100': '#ebe1fd',
    '200': '#d7c3fc',
    '300': '#c3a4fa',
    '400': '#af86f9',
    '500': '#9b68f7',
    '600': '#7c53c6',
    '700': '#5d3e94',
    '800': '#3e2a63',
    '900': '#1f1531',
    foreground: '#FFFFFF',
  },
  success: {
    // ref: --ok #1f9d6b
    DEFAULT: '#1f9d6b',
    '50': '#e8f7f0',
    '100': '#d1efe1',
    '200': '#a3dfc3',
    '300': '#75cfa5',
    '400': '#47bf87',
    '500': '#1f9d6b',
    '600': '#198056',
    '700': '#136041',
    '800': '#0c402b',
    '900': '#062016',
    foreground: '#FFFFFF',
  },
  warning: {
    // ref: --warn #b7791f / --warn-bg #fdf3e3 / --warn-border #f3dcb4
    DEFAULT: '#b7791f',
    '50': '#fdf3e3', // matches --warn-bg
    '100': '#f9e6c4',
    '200': '#f3dcb4', // matches --warn-border
    '300': '#ecc887',
    '400': '#dca555',
    '500': '#b7791f',
    '600': '#92611a',
    '700': '#6d4914',
    '800': '#48300d',
    '900': '#241807',
    foreground: '#FFFFFF',
  },
  danger: {
    // ref: --danger #c2362c / --danger-soft #fbeae8 / --danger-border #f0cfca
    DEFAULT: '#c2362c',
    '50': '#fbeae8', // matches --danger-soft
    '100': '#f7d4d1',
    '200': '#f0cfca', // matches --danger-border
    '300': '#e29991',
    '400': '#d36b60',
    '500': '#c2362c',
    '600': '#b3362c', // matches --danger-soft-fg
    '700': '#852720',
    '800': '#581a15',
    '900': '#2c0d0a',
    foreground: '#FFFFFF',
  },
  focus: '#5a63d8',
};

const text = {
  light: {
    link: brandColors.primary.DEFAULT,
    primary: '#1f2733', // matches --text
    primaryGrey: '#5c6675', // matches --text-muted
    primaryDisabled: '#646c7a', // matches --text-faint
    primarySubdued: '#5c6675',
  },
  dark: {
    link: brandColors.primary[400],
    primary: '#e4e7ec', // matches --text dark
  },
};

export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Used by DetailGrid which builds responsive grid classes dynamically.
    // Tailwind's JIT scanner can't detect interpolated class names like
    // `grid-cols-${n}` or `${bp}:grid-cols-${n}`, so we safelist them here.
    { pattern: /^grid-cols-[1-6]$/ },
    { pattern: /^grid-cols-[1-6]$/, variants: ['sm', 'md', 'lg'] },
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
        sans: [
          '"IBM Plex Sans"',
          'system-ui',
          '-apple-system',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      fontSize: {
        // Reference uses 13px base; keep tw class names but redefine scale.
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '17px' }],
        base: ['13px', { lineHeight: '18px' }],
        md: ['13px', { lineHeight: '18px' }],
        lg: ['15px', { lineHeight: '20px' }],
        xl: ['17px', { lineHeight: '22px' }],
        '2xl': ['20px', { lineHeight: '26px' }],
        '3xl': ['24px', { lineHeight: '30px' }],
      },
      // Moderately rounded corners for custom components using Tailwind classes
      borderRadius: {
        sm: '6px', // matches --radius-sm
        DEFAULT: '8px', // matches --radius
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
      },
      boxShadow: {
        token: 'var(--shadow)',
        topbar: 'var(--topbar-shadow)',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('sidebar-expanded', '.sidebar-expanded &');
      addVariant('darkTheme', '.dark &');
      addVariant('lightTheme', '.light &');
    }),
    heroui({
      // Moderately rounded corners for HeroUI components (Button, Input, Card, Chip, etc.)
      layout: {
        radius: {
          small: '6px',
          medium: '6px',
          large: '8px',
        },
      },
      themes: {
        light: {
          colors: {
            ...brandColors,
            background: '#eef0f4', // matches --bg
            foreground: text.light.primary,
            // Reference surface scale: --surface, --surface-2, --surface-3.
            // HeroUI default scale also re-mapped onto the surface ramp + neutral text tints.
            default: {
              50: '#f5f6f8', // matches --surface-2
              100: '#e9ecf1', // matches --surface-3
              200: '#dde1e8', // matches --border
              300: '#cdd2dc', // matches --border-strong
              400: '#9aa1b0',
              500: '#646c7a', // matches --text-faint
              600: '#5c6675', // matches --text-muted
              700: '#2c3854', // matches --text-heading
              800: '#1f2733', // matches --text
              900: '#0f1320',
              foreground: '#1f2733',
              DEFAULT: '#dde1e8',
            },
            content1: '#ffffff', // matches --surface
            content2: '#f5f6f8', // matches --surface-2
            content3: '#e9ecf1', // matches --surface-3
            content4: { DEFAULT: '#2b2148', foreground: '#ffffff' }, // matches --nav-bg / --primary-fg
          },
        },
        dark: {
          colors: {
            ...brandColors,
            background: '#0b0c10', // matches --bg dark
            foreground: text.dark.primary,
            default: {
              50: '#14161c', // matches --surface dark
              100: '#1b1e26', // matches --surface-2 dark
              200: '#232733', // matches --surface-3 dark
              300: '#333845', // matches --border-strong dark
              400: '#858da0', // matches --text-faint dark
              500: '#8b93a1', // matches --text-muted dark
              600: '#c5cbe0', // matches --text-heading dark
              700: '#e4e7ec',
              800: '#f1f3f7',
              900: '#ffffff',
              foreground: '#e4e7ec',
              DEFAULT: '#232733',
            },
            content1: '#14161c', // matches --surface dark
            content2: '#1b1e26', // matches --surface-2 dark
            content3: '#232733', // matches --surface-3 dark
            content4: { DEFAULT: '#181433', foreground: '#ffffff' }, // matches --nav-bg dark
          },
        },
      },
    }),
  ],
} satisfies Config;
