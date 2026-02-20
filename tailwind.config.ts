import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                aurora: {
                    blue: '#3b82f6',
                    purple: '#8b5cf6',
                    green: '#10b981',
                    pink: '#ec4899',
                },
                surface: {
                    DEFAULT: '#0f172a',
                    raised: '#1e293b',
                    overlay: '#334155',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Outfit', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'aurora-gradient': 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            },
            animation: {
                'shimmer': 'shimmer 2s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;
