import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
    const anonKey = env.VITE_SUPABASE_ANON_KEY;
    return {
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@modules': path.resolve(__dirname, 'src/modules'),
            '@shared': path.resolve(__dirname, 'src/modules/shared'),
        },
    },
    server: {
        port: 5173,
        proxy: supabaseUrl && anonKey
            ? {
                '/api/newsletter/subscribe': {
                    target: supabaseUrl,
                    changeOrigin: true,
                    secure: true,
                    rewrite: () => '/functions/v1/newsletter-subscribe',
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq) => {
                            proxyReq.setHeader('Authorization', `Bearer ${anonKey}`);
                            proxyReq.setHeader('apikey', anonKey);
                        });
                    },
                },
            }
            : undefined,
    },
    build: {
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        if (id.includes('/modules/admin/'))
                            return 'admin';
                        if (id.includes('/modules/marketing/'))
                            return 'marketing';
                        if (id.includes('/modules/projects/'))
                            return 'projects';
                        return;
                    }
                    if (id.includes('chart.js') || id.includes('react-chartjs-2'))
                        return 'charts';
                    if (id.includes('@supabase'))
                        return 'supabase';
                    if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
                        return 'react-vendor';
                    }
                },
            },
        },
    },
    };
});
