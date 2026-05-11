/**
 * 封装 fetch 请求
 */

// 动态获取 BASE_URL
/*const isDev = import.meta.env.DEV
const BASE_URL = isDev
  ? '/Gwgl-Server'
  : '/api/Gwgl-Server'
 */
 const BASE_URL = '/Gwgl-Server'
/**
 * 请求封装
 * @param {Object} options - 请求配置
 * @returns {Promise}
 */
export function request(options = {}) {
  // 修复点1：去掉尾部的 ...options，防止 url 被原始值覆盖
  const config = {
    url: BASE_URL + options.url,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers // 允许自定义 header 覆盖默认 header
    },
    body: options.data ? JSON.stringify(options.data) : undefined
  }
  let hasToken = false;
  // 添加 token
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const token = JSON.parse(userInfo).token
      if (token) {
        config.headers['Authorization'] = token
        hasToken = true;
      }
    } catch (e) {
      console.error('解析 userInfo 失败', e)
    }
  }

  return fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.body
  }).then(async res => {
    if (res.ok) {
      // 修复点2：增加 try-catch 容错，且只调用一次 res.json()
      try {
        const data = await res.json()

        const expiredCodes = [401, 403]
        if (data && expiredCodes.includes(data.status)) {
          if (hasToken) {
            // 情况 A：带了 Token 却返回 403 -> 说明 Token 已经失效，执行强制登出
            handleTokenExpired(data.message || '登录已过期，请重新登录')
          } else {
            // 情况 B：没带 Token 返回 403 -> 路人模式访问了需要权限的接口
            // 此时【不执行】强制跳转，只是打断 Promise 链，让页面的列表直接渲染空状态
            console.warn('路人模式无权限访问该接口')
          }
          return Promise.reject(new Error(data.message || 'Token已失效'))
        }
        return data // 直接返回解析后的 data
      } catch (err) {
        console.error('接口返回了非 JSON 格式的数据', err)
        throw new Error('服务器返回数据格式异常')
      }
    } else {
      handleError(res)
      throw res
    }
  })
}

/**
 * 专门处理 Token 失效的逻辑
 */
function handleTokenExpired(msg) {
  // 1. 清除本地存储
  localStorage.removeItem('userInfo')
  sessionStorage.clear()

  // 2. 呼叫全局淡黑色提示框
  showToast('身份验证已过期，需重新登录')
  // 2. 延迟后跳转回登录页，并强制刷新页面清空状态
  setTimeout(() => {
    window.location.hash = '#/login'
    window.location.reload() // 强制刷新，重置 Vue 和 Pinia 状态
  }, 2000)
}
/**
 * 处理 HTTP 层面的错误响应
 */
function handleError(res) {
  const statusCode = res.status

  switch (statusCode) {
    case 401:
    case 403: // 将 HTTP 403 也指向 Token 失效逻辑（双保险）
      if (hasToken) {
        handleTokenExpired('登录失效，请重新登录')
      } else {
        // 未登录状态下遭遇 403，静默处理或给予轻提示
        console.warn('接口需要登录权限')
      }
      break
    case 404:
      showToast('请求资源不存在')
      break
    case 500:
      showToast('服务器错误')
      break
    default:
      showToast('请求失败')
  }
}

/**
 * 全局原生 Toast 提示框
 */
function showToast(message) {
  // 如果页面上已经有残余的 toast，先移除，防止重复叠加
  const existingToast = document.getElementById('global-toast')
  if (existingToast) {
    document.body.removeChild(existingToast)
  }

  // 1. 创建 DOM 元素
  const toastDiv = document.createElement('div')
  toastDiv.id = 'global-toast'
  toastDiv.innerText = message

  // 2. 设定内联样式 (淡黑色半透明，居中显示)
  toastDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.75); /* 淡黑色背景 */
    color: #ffffff;
    padding: 12px 24px;
    font-size: 15px;
    border-radius: 8px;
    z-index: 99999; /* 确保层级最高，覆盖所有弹窗和导航栏 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none; /* 不阻挡用户的任何点击操作 */
    opacity: 0;
    transition: opacity 0.3s ease-in-out; /* 淡入淡出动画 */
  `

  // 3. 挂载到 body 上
  document.body.appendChild(toastDiv)

  // 4. 利用 requestAnimationFrame 触发浏览器的重绘，实现淡入效果
  requestAnimationFrame(() => {
    toastDiv.style.opacity = '1'
  })

  // 5. 设定 1.5 秒后开始淡出，并在 2 秒后将元素从 DOM 树中彻底移除
  setTimeout(() => {
    toastDiv.style.opacity = '0'
    setTimeout(() => {
      if (document.body.contains(toastDiv)) {
        document.body.removeChild(toastDiv)
      }
    }, 300) // 等待 0.3s 的 CSS transition 动画播放完毕
  }, 1500)
}

/**
 * GET 请求
 */
export function get(url, data = {}, options = {}) {
  const params = new URLSearchParams(data).toString()
  // 注意这里的组装逻辑
  const fullUrl = url + (params ? '?' + params : '')
  return request({ url: fullUrl, method: 'GET', ...options })
}

/**
 * POST 请求
 */
export function post(url, data = {}, options = {}) {
  return request({ url, method: 'POST', data, ...options })
}

/**
 * 文件上传
 */
export function upload(url, file, formData = {}) {
  const userInfo = localStorage.getItem('userInfo')
  const headers = {}

  if (userInfo) {
    try {
      const token = JSON.parse(userInfo).token
      if (token) {
        headers['Authorization'] = token
      }
    } catch (e) {}
  }

  const form = new FormData()
  form.append('file', file)
  Object.keys(formData).forEach(key => {
    form.append(key, formData[key])
  })

  return fetch(BASE_URL + url, {
    method: 'POST',
    headers,
    body: form
  }).then(async res => {
    if (res.ok) {
      return await res.json()
    } else {
      handleError(res)
      throw res
    }
  })
}

export default {
  request,
  get,
  post,
  upload
}