/**
 * 封装 fetch 请求
 */

// 动态获取 BASE_URL
const isDev = import.meta.env.DEV
const BASE_URL = isDev ? '/Gwgl-Server' : 'http://123.60.186.220:8100/Gwgl-Server'

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

  // 添加 token
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const token = JSON.parse(userInfo).token
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
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
        return data // 直接返回解析后的 data
      } catch (err) {
        console.error('接口返回了非 JSON 格式的数据(可能是代理没生效返回了HTML)', err)
        throw new Error('服务器返回数据格式异常')
      }
    } else {
      handleError(res)
      throw res
    }
  })
}

/**
 * 处理错误响应
 */
function handleError(res) {
  const statusCode = res.status

  switch (statusCode) {
    case 401:
      showToast('请先登录')
      localStorage.removeItem('userInfo')
      setTimeout(() => {
        window.location.hash = '/login'
      }, 1500)
      break
    case 403:
      showToast('无权限访问')
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
 * Toast 提示
 */
function showToast(message) {
  console.log('[Toast]', message)
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
        headers['Authorization'] = `Bearer ${token}`
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