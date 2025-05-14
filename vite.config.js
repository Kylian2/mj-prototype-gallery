import { defineConfig } from 'vite';
import path from "node:path";
import fs from 'fs';

export default defineConfig({
    server: {
        https: {
            key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem'))
        },
        host: '0.0.0.0', 
        port: 8080
    }
});