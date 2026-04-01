/**
 * 定位相关工具函数
 */

/**
 * 获取当前位置
 * @returns {Promise<Object>} 包含经纬度信息
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理位置'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          address: '',
          province: '',
          city: '',
          district: '',
          street: ''
        })
      },
      (error) => {
        console.error('获取位置失败:', error)
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * 格式化经纬度
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {string} 格式化后的字符串
 */
export function formatLocation(lng, lat) {
  return `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`
}

/**
 * 计算两点间距离（单位：米）
 */
export function getDistance(lng1, lat1, lng2, lat2) {
  const radLat1 = (lat1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180
  const a = radLat1 - radLat2
  const b = (lng1 * Math.PI) / 180 - (lng2 * Math.PI) / 180
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    )
  s = s * 6378137
  return Math.round(s)
}

/**
 * 打开地图导航
 */
export function openMap(longitude, latitude, name = '') {
  // 使用高德地图打开位置
  // 高德地图 URL 格式：https://uri.amap.com/marker?position=经度，纬度&name=名称
  const url = `https://uri.amap.com/marker?position=${longitude},${latitude}&name=${encodeURIComponent(name || '管网位置')}&coordinate=gaode&sys=1`
  window.open(url, '_blank')
}

export default {
  getCurrentLocation,
  formatLocation,
  getDistance,
  openMap
}
