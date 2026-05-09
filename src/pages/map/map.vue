<template>
  <div class="container">
    <div class="map-wrapper">
      <div id="map-container" class="map-container"></div>

      <div class="map-controls">
        <button class="control-btn" @click="relocate" title="定位">
          <span class="control-icon">📍</span>
        </button>
        <button class="control-btn" @click="toggleLayer" title="切换图层">
          <span class="control-text">{{ satelliteMode ? '街道' : '卫星' }}</span>
        </button>
      </div>
    </div>

    <div class="bottom-sheet" :class="{ expanded: sheetExpanded }">
      <div class="sheet-handle" @click="toggleSheet">
        <div class="handle-bar"></div>
      </div>
      <div class="sheet-header">
        <h3 class="header-title">附近点位</h3>
        <span class="header-count">{{ nearbyList.length }} 个</span>
      </div>
      <div class="sheet-content">
        <div
          v-for="(item, index) in nearbyList"
          :key="item.id"
          class="list-item"
          @click="selectItem(item)"
        >
          <div class="item-icon">
            <span class="icon">{{ item.userType === '工程师' ? '🔧' : '👤' }}</span>
          </div>
          <div class="item-content">
            <h4 class="item-title">{{ item.address || '未知位置' }}</h4>
            <div class="item-meta">
              <span class="item-time">{{ formatTime(item.createTime) }}</span>
              <span class="item-user">{{ item.uploaderName }}</span>
            </div>
          </div>
          <div class="item-image" v-if="item.images && item.images.length > 0">
            <img class="thumb" :src="item.images[0]" alt="" />
          </div>
        </div>
      </div>
    </div>

    <nav class="tabbar">
      <div class="tab-item" :class="{ active: activeTab === 'index' }" @click="switchTab('index')">
        <span class="tab-icon">🏠</span>
        <span class="tab-text">首页</span>
      </div>
      <div class="tab-item active">
        <span class="tab-icon">🗺️</span>
        <span class="tab-text">地图</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'mine' }" @click="switchTab('mine')">
        <span class="tab-icon">👤</span>
        <span class="tab-text">我的</span>
      </div>
    </nav>

    <div class="detail-modal" v-if="selectedItem" @click.self="closeDetail">
      <div class="modal-content">
        <div class="modal-handle" @click="closeDetail">
          <div class="handle-bar"></div>
        </div>

        <div class="modal-body">
          <div class="detail-images" v-if="selectedItem.images && selectedItem.images.length > 0">
            <div class="image-scroll">
              <div class="image-list">
                <img
                  v-for="(img, idx) in selectedItem.images"
                  :key="idx"
                  :src="img"
                  class="detail-image"
                />
              </div>
            </div>
          </div>

          <div class="detail-info">
            <div class="detail-row">
              <span class="info-label">地址：</span>
              <span class="info-value">{{ selectedItem.address }}</span>
            </div>
            <div class="detail-row">
              <span class="info-label">描述：</span>
              <span class="info-value">{{ selectedItem.description || '暂无描述' }}</span>
            </div>
            <div class="detail-row">
              <span class="info-label">上报人：</span>
              <span class="info-value">{{ selectedItem.uploaderName }} ({{ selectedItem.userType }})</span>
            </div>
            <div class="detail-row">
              <span class="info-label">时间：</span>
              <span class="info-value">{{ formatFullTime(selectedItem.createTime) }}</span>
            </div>
          </div>

          <div class="detail-actions">
            <button class="action-btn secondary" @click="callUploader">联系上报人</button>
            <button class="action-btn primary" @click="navigateTo(selectedItem)">导航前往</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import AMapLoader from '@amap/amap-jsapi-loader'
import { formatLocation } from '@/utils/location'
import { post } from '@/utils/request'

const router = useRouter()

// 状态
// AMap 实例建议使用 shallowRef，避免 Vue 对其进行深度响应式追踪，提高性能
const map = shallowRef(null)
const AMapInstance = shallowRef(null) // 存储 AMap 类

const satelliteMode = ref(false)
const sheetExpanded = ref(false)
const nearbyList = ref([])
const selectedItem = ref(null)

let markers = []
let satelliteLayer = null

// 配置高德地图 Key (正式环境建议放在环境变量中)
const AMAP_CONFIG = {
  key: 'd7d972290ff37bd9d1fd229b483bb228', // 需替换
  securityCode: '5be9f77f2ef880de042d0503c84b1a94', // 需替换
  version: '2.0'
}

onMounted(() => {
  window._AMapSecurityConfig = { securityJsCode: AMAP_CONFIG.securityCode }
  initMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
  }
})

// 初始化地图
async function initMap() {
  try {
    const AMap = await AMapLoader.load({
      key: AMAP_CONFIG.key,
      version: AMAP_CONFIG.version,
      plugins: ['AMap.Geolocation', 'AMap.Scale', 'AMap.ToolBar']
    })

    AMapInstance.value = AMap

    map.value = new AMap.Map('map-container', {
      viewMode: '3D', // 开启 3D 视图
      zoom: 13,
      center: [116.397476, 39.908823] // 注意：高德经纬度顺序是 [lng, lat]
    })

    // 添加控件
    map.value.addControl(new AMap.Scale())
    map.value.addControl(new AMap.ToolBar({ position: 'RT' }))

    // 加载数据
    loadMarkers()

    // 自动定位
    locateUser()
  } catch (e) {
    console.error('地图加载失败:', e)
  }
}

// 定位用户 (使用高德官方定位插件，精度更高且已处理坐标偏移)
function locateUser() {
  const AMap = AMapInstance.value
  const geolocation = new AMap.Geolocation({
    enableHighAccuracy: true, // 是否使用高精度定位
    timeout: 10000,           // 超过10秒后停止定位
    position: 'RB',           // 定位按钮的停靠位置
    offset: [10, 20],         // 定位按钮与设置的停靠位置的偏移量
    zoomToAccuracy: true,     // 定位成功后是否自动调整地图视野到定位点
  })

  map.value.addControl(geolocation)
  geolocation.getCurrentPosition((status, result) => {
    if (status === 'complete') {
      console.log('定位成功', result)
    } else {
      console.error('定位失败', result)
    }
  })
}

// 加载标记点
async function loadMarkers() {
  const AMap = AMapInstance.value

  try {
    // 为了在地图上显示更多点位，我们把 pageSize 设大一点 (比如 50)
    const params = {
      action: "grsb",
      domain: "", eventLevel: "", eventType: "", flag: "",
      occurEndBetween: "", occurStartBetween: "", titleLike: "",
      pageNo: 1,
      pageSize: 50
    }

    const res = await post('/opt-event/page', params)

    if (res && res.status === 200 && res.data) {
      const records = res.data.records || []

      // 过滤掉没有经纬度的脏数据，并进行字段映射
      const realData = records
        .filter(item => item.longitude && item.latitude)
        .map(item => {
          return {
            id: item.id,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address || item.areaNames_label || '未知位置',
            createTime: item.reportTime, // 接口的时间字符串
            uploaderName: item.userName || '未知用户',
            userType: '路人',
            images: [],
            description: item.content || item.title || '暂无描述',
            rawItem: item
          }
        })

      nearbyList.value = realData

      // 清除旧标记
      map.value.remove(markers)
      markers = []

      realData.forEach(item => {
        const marker = new AMap.Marker({
          position: [item.longitude, item.latitude],
          title: item.address,
          map: map.value
        })

        marker.on('click', () => {
          selectItem(item)
        })

        markers.push(marker)
      })

      // 自动缩放以展示所有标记
      if (markers.length > 0) {
        map.value.setFitView(markers)
      }
    }
  } catch (error) {
    console.error('地图点位获取失败:', error)
  }
}

// 重新定位
async function relocate() {
  locateUser()
}

// 切换图层
function toggleLayer() {
  const AMap = AMapInstance.value
  satelliteMode.value = !satelliteMode.value

  if (satelliteMode.value) {
    if (!satelliteLayer) {
      satelliteLayer = new AMap.TileLayer.Satellite()
    }
    map.value.add(satelliteLayer)
  } else {
    if (satelliteLayer) {
      map.value.remove(satelliteLayer)
    }
  }
}

// 切换面板
function toggleSheet() {
  sheetExpanded.value = !sheetExpanded.value
}

// 选择项目
function selectItem(item) {
  selectedItem.value = item
  if (map.value) {
    map.value.setZoomAndCenter(18, [item.longitude, item.latitude])
  }
}

// 关闭详情
function closeDetail() {
  selectedItem.value = null
}

// 导航
function navigateTo(item) {
  // 使用高德地图导航
  const url = `https://uri.amap.com/marker?position=${item.longitude},${item.latitude}&name=${encodeURIComponent(item.address || '管网位置')}&coordinate=gaode&sys=1`
  window.open(url, '_blank')
}

// 联系上报人
function callUploader() {
  alert('功能开发中')
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  const timeNum = typeof timestamp === 'string' ? new Date(timestamp.replace(/-/g, '/')).getTime() : timestamp
  if (isNaN(timeNum)) return timestamp

  const diff = Date.now() - timeNum
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

function formatFullTime(timestamp) {
  if (!timestamp) return ''
  // 兼容 iOS/Safari 等对 "YYYY-MM-DD" 不友好的时间格式
  const date = typeof timestamp === 'string' ? new Date(timestamp.replace(/-/g, '/')) : new Date(timestamp)
  if (isNaN(date.getTime())) return timestamp
  return date.toLocaleString('zh-CN', { hour12: false })
}

function switchTab(tab) {
  router.push('/' + tab)
}
</script>

<style lang="scss" scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-controls {
  position: absolute;
  right: 10px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;

  .control-btn {
    width: 44px;
    height: 44px;
    background: white;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;

    .control-icon,
    .control-text {
      font-size: 14px;
      color: #333;
    }
  }
}

.bottom-sheet {
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 30vh;
  transition: max-height 0.3s ease;
  overflow: hidden;
  z-index: 1001;
  flex-shrink: 0;

  &.expanded {
    max-height: 60vh;
  }

  .sheet-handle {
    padding: 12px;
    display: flex;
    justify-content: center;
    cursor: pointer;

    .handle-bar {
      width: 40px;
      height: 4px;
      background: #e8e8e8;
      border-radius: 2px;
    }
  }

  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px 12px;
    border-bottom: 1px solid #f0f0f0;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .header-count {
      font-size: 13px;
      color: #999;
    }
  }

  .sheet-content {
    height: 100%;
    overflow-y: auto;
    padding: 0 16px 16px;
  }

  .list-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;

    .item-icon {
      width: 44px;
      height: 44px;
      background: #f5f5f5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;

      .icon {
        font-size: 20px;
      }
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-title {
        font-size: 14px;
        color: #333;
        margin: 0 0 6px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-meta {
        display: flex;
        gap: 12px;

        .item-time,
        .item-user {
          font-size: 12px;
          color: #999;
        }
      }
    }

    .item-image {
      width: 60px;
      height: 60px;
      margin-left: 12px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;

      .thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
}

.detail-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 2000;

  .modal-content {
    background: white;
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
  }

  .modal-handle {
    padding: 12px;
    display: flex;
    justify-content: center;
    cursor: pointer;

    .handle-bar {
      width: 40px;
      height: 4px;
      background: #e8e8e8;
      border-radius: 2px;
    }
  }

  .modal-body {
    .detail-images {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;

      .image-scroll {
        overflow-x: auto;
        white-space: nowrap;
      }

      .image-list {
        display: inline-flex;
        gap: 8px;
      }

      .detail-image {
        width: 120px;
        height: 120px;
        border-radius: 8px;
        object-fit: cover;
      }
    }

    .detail-info {
      padding: 16px;

      .detail-row {
        display: flex;
        margin-bottom: 12px;

        .info-label {
          width: 70px;
          font-size: 14px;
          color: #999;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 14px;
          color: #333;
          flex: 1;
        }
      }
    }

    .detail-actions {
      display: flex;
      gap: 12px;
      padding: 16px;

      .action-btn {
        flex: 1;
        height: 44px;
        border-radius: 22px;
        font-size: 15px;
        border: none;
        cursor: pointer;

        &.primary {
          background: #1890ff;
          color: white;
        }

        &.secondary {
          background: #f5f5f5;
          color: #333;
        }
      }
    }
  }
}

.tabbar {
  display: flex;
  background: white;
  border-top: 1px solid #e8e8e8;
  padding-bottom: env(safe-area-inset-bottom);
  flex-shrink: 0;
  z-index: 1000;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 2px;
    cursor: pointer;

    .tab-icon {
      font-size: 22px;
    }

    .tab-text {
      font-size: 11px;
      color: #7a7e83;
    }

    &.active .tab-text {
      color: #1890ff;
    }
  }
}

/* 隐藏高德默认的定位按钮（如果你想用自己 UI 里的定位按钮） */
:deep(.amap-geolocation-con) {
  display: none !important;
}

/* 隐藏高德地图的 Logo 和版权信息（可选，如果影响底部 UI） */
:deep(.amap-logo),
:deep(.amap-copyright) {
  display: none !important;
}
</style>