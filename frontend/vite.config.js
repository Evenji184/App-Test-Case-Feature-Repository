import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function apiEndpointPlugin() {
    return {
        name: 'api-endpoint-logger',
        configureServer: function (server) {
            var _a;
            (_a = server.httpServer) === null || _a === void 0 ? void 0 : _a.once('listening', function () {
                var scheme = process.env.VITE_API_SCHEME || 'http';
                var host = process.env.VITE_API_HOST || 'localhost';
                var port = process.env.VITE_API_PORT || '8001';
                console.log("\n  API endpoint: ".concat(scheme, "://").concat(host, ":").concat(port, "/graphql\n"));
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
