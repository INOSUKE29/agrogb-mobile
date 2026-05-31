import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        // Atalho para o processo Main do Electron
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      }
    }),
  ],
})
