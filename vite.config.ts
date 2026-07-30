import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The dev server is reached via LAN IP, a port-forwarded public IP, and
    // a DDNS domain depending on where the request comes from — Vite 6's
    // host-header check would otherwise reject all but whichever one was
    // listed literally.
    allowedHosts: true,
  },
})
