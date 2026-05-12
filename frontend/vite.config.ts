import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function apiEndpointPlugin(): Plugin {
  return {
    name: 'api-endpoint-logger',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const scheme = process.env.VITE_API_SCHEME || 'http';
        const host = process.env.VITE_API_HOST || 'localhost';
        const port = process.env.VITE_API_PORT || '8001';
        console.log(`\n  API endpoint: ${scheme}://${host}:${port}/graphql\n`);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiEndpointPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
