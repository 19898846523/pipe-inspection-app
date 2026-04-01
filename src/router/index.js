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
