import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const isLoggedIn = ref(false)
  const userInfo = ref(null)

  // 从本地存储加载
  const loadUser = () => {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      userInfo.value = JSON.parse(stored)
      isLoggedIn.value = true
    }
  }

  // 登录
  const login = (username, password) => {
    // TODO: 实际项目中这里应该调用后端 API
    // 模拟登录成功
    const mockUserInfo = {
      id: '1001',
      username: username,
      role: 'engineer',
      avatar: '/static/avatar-default.png'
    }

    userInfo.value = mockUserInfo
    isLoggedIn.value = true
    localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))

    return Promise.resolve(mockUserInfo)
  }

  // 登出
  const logout = () => {
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('userInfo')
  }

  // 是否为工程师
  const isEngineer = computed(() => {
    return isLoggedIn.value && userInfo.value?.role === 'engineer'
  })

  // 用户类型
  const userType = computed(() => {
    return isLoggedIn.value ? '工程师' : '路人'
  })

  return {
    isLoggedIn,
    userInfo,
    isEngineer,
    userType,
    loadUser,
    login,
    logout
  }
})
