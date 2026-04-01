/**
 * 封装 fetch 请求
 */

const BASE_URL = 'http://localhost:3000/api' // TODO: 替换为实际后端地址

/**
 * 请求封装
 * @param {Object} options - 请求配置
 * @returns {Promise}
 */
export function request(options = {}) {
  const config = {
    url: BASE_URL + options.url,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.header
    },
    body: options.data ? JSON.stringify(options.data) : undefined,
    ...options
  }

  // 添加 token
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const token = JSON.parse(userInfo).token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }

  return fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.body
  }).then(res => {
    if (res.ok) {
      return res.json()
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
  // 简单实现，实际项目可以使用更好的 UI 库
  console.log('[Toast]', message)
}

/**
 * GET 请求
 */
export function get(url, data = {}, options = {}) {
  const params = new URLSearchParams(data).toString()
  return request({ url: url + (params ? '?' + params : ''), method: 'GET', ...options })
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
    const token = JSON.parse(userInfo).token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
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
  }).then(res => {
    if (res.ok) {
      return res.json()
    } else {
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
