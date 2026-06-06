import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Classic Vite + Tailwind (via PostCSS)
export default defineConfig({
  plugins: [react()],
})

