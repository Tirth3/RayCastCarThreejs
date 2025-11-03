import { defineConfig } from 'vite'

// Vite config for a Three.js project that allows all hosts
export default defineConfig({
  server: {
    host: true,          // allows access from network IPs (e.g. mobile testing)
    allowedHosts: true,  // allows ALL hosts, including ngrok or localhost
    port: 5173           // you can change this if needed
  },
  optimizeDeps: {
    include: ['three']   // ensures Three.js is pre-bundled for better performance
  },
  build: {
    chunkSizeWarningLimit: 1500 // optional: avoids large bundle warnings
  }
})
