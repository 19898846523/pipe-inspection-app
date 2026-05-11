import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    name: 'index',
    component: () => import('@/pages/index/index.vue'),
    meta: { title: '管网巡检' }
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('@/pages/upload/upload.vue'),
    meta: { title: '上报信息' }
  },
  {
    path: '/event-image-upload',
    name: 'event-image-upload',
    component: () => import('@/pages/upload/event_image_upload.vue'),
    meta: { title: '上传现场照片' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/login.vue'),
    meta: { title: '工程师登录' }
  },
  {
    path: '/mine',
    name: 'mine',
    component: () => import('@/pages/mine/mine.vue'),
    meta: { title: '个人中心' }
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/pages/map/map.vue'),
    meta: { title: '点位地图' }
  },
  {
    path: '/detail',
    name: 'detail',
    component: () => import('@/pages/detail/detail.vue'),
    meta: { title: '详情' }
  },
  {
    path: '/my-uploads',
    name: 'my-uploads',
    // ⚠️ 重点注意：这里的路径必须和您实际存放 my_upload.vue 的位置一致！
    // 如果您像其他页面一样建了文件夹，可能是 '@/pages/my_upload/my_upload.vue'
    // 如果您直接放在了 pages 目录下，就是 '@/pages/my_upload.vue'
    component: () => import('@/pages/my_upload/my_upload.vue'),
    meta: { title: '我的上报' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
