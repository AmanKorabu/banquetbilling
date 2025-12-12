import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: '/xpressbanquet/',
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    https: true,
    host: true,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    proxy: {
      '/banquetapi': {
        target: 'https://membership.xpresshotelpos.com/banquetapi',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/banquetapi/, ''),
      },
    },
  },
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/x-date-pickers',
      'dayjs'
    ],
    exclude: [],
  },
});
