# 管网巡检 App

基于 Vue 3 + Vite + Vue Router 开发的响应式 Web App，支持移动端和桌面端浏览，可通过 PWA 方式安装在手机上使用。

## 功能特性

### 用户类型
- **路人用户**：无需登录即可上传管网消息
- **工程师用户**：需要登录后方可上传，享受更多权限

### 核心功能
- 📍 **定位上报**：自动获取当前位置（经纬度）
- 📷 **照片上传**：支持拍照或从相册选择（最多 9 张）
- 📝 **文字描述**：可选填的问题描述
- 🗺️ **地图展示**：查看所有上报点位的分布
- 📋 **消息列表**：浏览所有上报记录
- 👤 **个人中心**：管理个人信息和上报记录

## 技术栈

- **框架**：Vue 3 + Vite
- **路由**：Vue Router 4
- **状态管理**：Pinia
- **UI**：原生 CSS + SCSS
- **定位**：HTML5 Geolocation API

## 项目结构

```
F:\文件\管网 APP\
├── src/
│   ├── pages/              # 页面
│   │   ├── index/          # 首页（消息列表）
│   │   ├── upload/         # 上传页
│   │   ├── login/          # 工程师登录
│   │   ├── mine/           # 个人中心
│   │   ├── map/            # 地图页
│   │   └── detail/         # 详情页
│   ├── router/             # 路由配置
│   ├── store/              # Pinia 状态管理
│   │   └── user.js         # 用户状态
│   ├── utils/              # 工具函数
│   │   ├── request.js      # 请求封装
│   │   └── location.js     # 定位工具
│   ├── static/             # 静态资源
│   ├── App.vue             # 应用入口
│   ├── main.js             # 入口文件
│   └── uni.scss            # 全局样式
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd "F:\文件\管网 APP"
npm install --legacy-peer-deps
```

### 2. 开发环境运行

```bash
npm run dev:h5
```

运行后访问 http://localhost:5173 预览应用。

### 3. 生产打包

```bash
npm run build:h5
```

打包后的文件在 `dist` 目录。

## 功能说明

### 首页
- 显示所有管网上报记录
- 支持下拉刷新和上拉加载更多
- 支持搜索功能
- 显示上报人类型（路人/工程师）
- 显示处理状态（待处理/处理中/已完成）

### 上报页面
- 自动获取当前位置和经纬度
- 支持拍照或从相册选择照片（最多 9 张）
- 可填写文字描述
- 显示当前用户类型

### 工程师登录
- 账号密码登录
- 支持记住登录状态
- 登录后享受更多权限

### 地图页面
- 显示所有上报点位
- 点击查看点位详情
- 支持导航到点位位置

### 个人中心
- 显示用户信息
- 查看统计数据（上报数、浏览量等）
- 访问我的上报、我的收藏等功能
- 退出登录

## 移动端适配

本项目采用响应式设计，自动适配不同尺寸的屏幕：

- 使用 viewport  meta 标签适配移动端
- 使用 rem/em 和百分比单位
- 使用 flexbox 布局
- 支持触摸操作

## PWA 安装（可选）

如需将应用安装到手机，可以添加 PWA 支持：

1. 安装 vite-plugin-pwa:
```bash
npm install vite-plugin-pwa --save-dev
```

2. 配置 vite.config.js:
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '管网巡检',
        short_name: '管网巡检',
        description: '管网巡检 App',
        theme_color: '#1890ff',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

## API 集成

当前项目使用 Mock 数据，实际使用时需要修改以下文件：

### 修改 API 地址
编辑 `src/utils/request.js`：
```javascript
const BASE_URL = 'https://your-api-domain.com/api'
```

### 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/messages` | GET | 获取消息列表 |
| `/messages` | POST | 创建消息 |
| `/messages/:id` | GET | 获取消息详情 |
| `/messages/:id` | PUT | 更新消息 |
| `/messages/:id` | DELETE | 删除消息 |
| `/upload` | POST | 上传图片 |
| `/login` | POST | 工程师登录 |
| `/logout` | POST | 登出 |

## 自定义配置

### 修改主题色
编辑 `src/uni.scss` 中的 `$primary-color` 变量：
```scss
$primary-color: #1890ff; // 修改为你想要的颜色
```

### 修改应用名称
编辑 `index.html` 中的 `<title>` 标签。

## 注意事项

1. **定位功能**：需要在 HTTPS 环境或 localhost 下才能使用
2. **图片上传**：当前使用 base64 编码存储，实际项目需要上传到服务器
3. **浏览器兼容**：推荐使用 Chrome、Safari 等现代浏览器
4. **生产环境**：需要配置合适的后端 API 和服务器

## 后续扩展建议

- [ ] 添加 PWA 支持，实现离线访问
- [ ] 集成真实地图服务（Google Maps / 高德地图）
- [ ] 对接后端 API
- [ ] 添加图片压缩功能
- [ ] 实现消息审核流程
- [ ] 添加推送通知功能
- [ ] 实现工程师认证体系
- [ ] 添加数据统计分析功能

## License

MIT
