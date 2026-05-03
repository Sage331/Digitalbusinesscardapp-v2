import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import reactNativeWeb from 'vite-plugin-react-native-web';

export default defineConfig({
  plugins: [react(), tailwindcss(), reactNativeWeb(),],
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      // This tells Vite to allow JSX inside .js files (the cause of your errors)
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      // This maps mobile components to web components so it doesn't crash
      'react-native': 'react-native-web',
    },
  },
});