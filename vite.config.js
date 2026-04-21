import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // 2. 添加 PWA 插件配置
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '管网巡检',
        short_name: '管网巡检',
        description: '管网巡检 App',
        theme_color: '#1890ff',
        icons: [
          {
            src: '/icon-1024.png',
            sizes: '1024x1024',
            type: 'image/png'
          },
          {
            src: '/icon-2048.png',
            sizes: '2048x2048',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') // 保留原有的路径别名设置
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static'
  }
})
