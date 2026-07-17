import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages ຢູ່ໃຕ້ /superwork/ · dev ຢູ່ / → ໃຊ້ import.meta.env.BASE_URL ທຸກບ່ອນທີ່ອ້າງ public file
  base: process.env.NODE_ENV === 'production' ? '/superwork/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
