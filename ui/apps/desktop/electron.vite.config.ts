import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const dashboardSrc = resolve(__dirname, '../dashboard/src')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: './src/renderer',
    build: {
      rollupOptions: {
        input: './src/renderer/index.html'
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': dashboardSrc,
        '@dashboard': dashboardSrc,
        '@locales': resolve(__dirname, '../dashboard/locales')
      }
    },
    plugins: [react(), svgr()],
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            config: resolve(__dirname, 'tailwind.config.js')
          }),
          autoprefixer()
        ]
      }
    },
    server: {
      proxy: {
        '^/api/v1/terminal/sockjs*': {
          target: 'ws://localhost:8000',
          changeOrigin: false,
          secure: false,
          ws: true
        },
        '^/api/v1.*': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    }
  }
})
