import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  define: { global: 'globalThis' },
  resolve: { alias: { buffer: 'buffer' } },
  optimizeDeps: { include: ['buffer'] },
  plugins: [react()],
})
