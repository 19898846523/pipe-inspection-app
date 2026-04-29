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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '管网巡检',
        short_name: '管网巡检',
        description: '管网巡检 App',
        theme_color: '#1890ff',
        background_color: '#ffffff', // 启动页背景色
        display: 'standalone', // 关键：让网页以独立 App 模式运行，隐藏浏览器地址栏
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            "purpose": "any maskable"
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
    open: false,
    // 【新增】代理配置
    proxy: {
      // 当我们在代码里请求带有 /Gwgl-Server 开头的接口时，Vite 会拦截并代理
      '/Gwgl-Server': {
        target: 'http://123.60.186.220:8100', // 你的真实后端目标地址
        changeOrigin: true, // 开启跨域
        // 因为你的后端接口本身就包含 /Gwgl-Server，所以这里不需要 rewrite 重写路径
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static'
  }
})