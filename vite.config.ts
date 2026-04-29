import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.PASSCODE': JSON.stringify(env.PASSCODE),
      'process.env.HF_TOKEN': JSON.stringify(env.HF_TOKEN),
      'process.env.HUGGINGFACE_MODEL_ID': JSON.stringify(env.HUGGINGFACE_MODEL_ID),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-genai': ['@google/genai'],
            'vendor-ui': ['motion/react', 'lucide-react', 'react-markdown'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/hf-api': {
          target: 'https://api-inference.huggingface.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hf-api/, '')
        }
      }
    },
  };
});
