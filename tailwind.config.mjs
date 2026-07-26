/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="raidguild-dark"]'],
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '2rem',
      },
      screens: {
        '2xl': '86rem',
        lg: '64rem',
        md: '48rem',
        sm: '40rem',
        xl: '80rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        background: 'hsl(var(--background))',
        border: 'hsla(var(--border))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        foreground: 'hsl(var(--foreground))',
        input: 'hsl(var(--input))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        ring: 'hsl(var(--ring))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: 'hsl(var(--success))',
        error: 'hsl(var(--error))',
        warning: 'hsl(var(--warning))',
        moloch: {
          500: 'hsl(var(--moloch-500))',
          600: 'hsl(var(--moloch-600))',
          700: 'hsl(var(--moloch-700))',
          800: 'hsl(var(--moloch-800))',
          900: 'hsl(var(--moloch-900))',
        },
        scroll: {
          100: 'hsl(var(--scroll-100))',
          200: 'hsl(var(--scroll-200))',
          300: 'hsl(var(--scroll-300))',
        },
        guild: {
          olive: 'hsl(var(--guild-olive))',
          muted: 'hsl(var(--guild-muted))',
        },
        neutral: {
          black: 'hsl(var(--neutral-black))',
        },
      },
      fontFamily: {
        display: ['var(--font-display-theme)'],
        mono: ['var(--font-mono-theme)'],
        sans: ['var(--font-body-theme)'],
        serif: ['var(--font-body-theme)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--text)',
            '--tw-prose-headings': 'var(--text)',
            '--tw-prose-links': theme('colors.blue.700'),
            '--tw-prose-links-hover': theme('colors.blue.800'),
            '--tw-prose-invert-links': theme('colors.blue.300'),
            '--tw-prose-invert-links-hover': theme('colors.blue.200'),
            '&.prose-invert': {
              '--tw-prose-links-hover': 'var(--tw-prose-invert-links-hover)',
            },
            a: {
              textDecorationColor: 'var(--tw-prose-links)',
              transitionDuration: '150ms',
              transitionProperty: 'color, text-decoration-color',
              '&:hover': {
                color: 'var(--tw-prose-links-hover)',
                textDecorationColor: 'var(--tw-prose-links-hover)',
              },
            },
            h1: {
              fontSize: '3.5rem',
              fontWeight: 'normal',
              marginBottom: '0.25em',
            },
          },
        },
      }),
    },
  },
}
