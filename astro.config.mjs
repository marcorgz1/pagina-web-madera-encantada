// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [
            tailwindcss()
        ]
    },
    output: 'static',
    site: 'https://madera-encantada.com',
    image: {
        // Sharp (a tool for images optimizations)
        service: {
            entrypoint: 'astro/assets/services/sharp'
        }
    },
    // Prefetch links on hover for faster navigation
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'hover'
    },
    // Compress HTML output
    compressHTML: true
});
