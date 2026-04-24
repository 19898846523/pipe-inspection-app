import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get,post } from '@/utils/request'
import { encryptRSA } from '@/utils/encrypt'

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

  // 真实接入后端 API 的登录逻辑
  const login = async (username, password) => {
    try {
      // 1. 获取公钥
      const keyRes = await get('/sys-login/get-publicKey',{},{
        headers: {
          'TenantId':'1'
        }
      })
      if (keyRes.status !== 200) {
        throw new Error(keyRes.message || '获取公钥失败')
      }
      const publicKey = keyRes.data

      // 2. 使用公钥加密密码
      const encryptedPassword = encryptRSA(password, publicKey)
      if (!encryptedPassword) {
        throw new Error('密码加密失败')
      }

      // 3. 发起真正的登录请求
      const loginRes = await post('/sys-login/sign-in', {
        account: username,           // 注意：前端绑定的叫 username，后端接口需要叫 account
        password: encryptedPassword, // 传入加密后的密码
        captcha: ''                  // 暂时传空，如后端后续需要再接入
      },
          {
            headers: {
              'TenantId':'1'
            }
          })

      // 4. 判断后端返回结果
      if (loginRes.status === 200) {
        // 假设登录成功后，后端会在 loginRes.data 里返回 token 等信息
        const token = loginRes.data // 【注意】如果后端返回的是对象，可能需要改成 loginRes.data.token

        // 构造存入本地的用户信息 (保留原有的 UI 需要的字段)
        const actualUserInfo = {
          token: token,
          username: username,
          role: 'engineer', // 只要能登录成功，就是工程师
          avatar: '/static/avatar-default.png'
        }

        // 保存状态
        userInfo.value = actualUserInfo
        isLoggedIn.value = true
        localStorage.setItem('userInfo', JSON.stringify(actualUserInfo))

        return Promise.resolve(actualUserInfo)
      } else {
        // 登录失败 (例如密码错误)，抛出后端返回的错误信息
        throw new Error(loginRes.message || '账号或密码错误')
      }

    } catch (error) {
      // 将错误抛给组件层去显示 Toast
      return Promise.reject(error)
    }
  }

  // 登出
  const logout =async () => {
    try {
      // 1. 通知后端使其 Token 失效
      await post('/sys-login/sign-out', {})
    } catch (error) {
      // 就算后端接口报错（比如网络断了），也不影响前端清数据
      console.warn('调用后端登出接口失败，但前端将继续清除缓存:', error)
    } finally {
      // 2. 无论后端接口是否调用成功，前端必须强制清理本地状态
      userInfo.value = null
      isLoggedIn.value = false
      localStorage.removeItem('userInfo')

      // 注意：这里通常还会配合路由跳转到登录页，可以在组件里写，也可以在这里写
      // window.location.hash = '/login'
    }
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
