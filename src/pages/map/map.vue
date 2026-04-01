<template>
  <div class="container">
    <!-- 地图容器 -->
    <div class="map-wrapper">
      <div ref="mapContainer" id="map" class="map-container"></div>

      <!-- 地图控制按钮 -->
      <div class="map-controls">
        <button class="control-btn" @click="relocate" title="定位">
          <span class="control-icon">📍</span>
        </button>
        <button class="control-btn" @click="toggleLayer" title="切换图层">
          <span class="control-text">{{ satelliteMode ? '街道' : '卫星' }}</span>
        </button>
      </div>
    </div>

    <!-- 底部列表 -->
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

    <!-- 底部导航 -->
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

    <!-- 点位详情弹窗 -->
    <div class="detail-modal" v-if="selectedItem" @click="closeDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-handle" @click="closeDetail">
          <div class="handle-bar"></div>
        </div>
        <div class="modal-body">
          <div class="detail-images" v-if="selectedItem.images?.length > 0">
            <div class="image-scroll">
              <div class="image-list">
                <img
                  v-for="(img, i) in selectedItem.images"
                  :key="i"
                  class="detail-image"
                  :src="img"
                  alt=""
                />
              </div>
            </div>
          </div>
          <div class="detail-info">
            <div class="detail-row">
              <span class="info-label">位置：</span>
              <span class="info-value">{{ selectedItem.address || '未知' }}</span>
            </div>
            <div class="detail-row">
              <span class="info-label">坐标：</span>
              <span class="info-value">{{ formatLocation(selectedItem.longitude, selectedItem.latitude) }}</span>
            </div>
            <div class="detail-row">
              <span class="info-label">时间：</span>
              <span class="info-value">{{ formatFullTime(selectedItem.createTime) }}</span>
            </div>
            <div class="detail-row">
              <span class="info-label">上报人：</span>
              <span class="info-value">{{ selectedItem.uploaderName || '匿名' }}（{{ selectedItem.userType || '路人' }}）</span>
            </div>
            <div class="detail-row" v-if="selectedItem.description">
              <span class="info-label">描述：</span>
              <span class="info-value">{{ selectedItem.description }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="action-btn primary" @click="navigateTo(selectedItem)">
              导航到这里
            </button>
            <button class="action-btn secondary" @click="callUploader">
              联系上报人
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCurrentLocation, formatLocation } from '@/utils/location'

const router = useRouter()

// 状态
const mapContainer = ref(null)
const satelliteMode = ref(false)
const sheetExpanded = ref(false)
const nearbyList = ref([])
const selectedItem = ref(null)

// 地图实例
let map = null
let markers = []
let userMarker = null

// 图层
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
})

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© ESRI'
})

// 当前 Tab
const activeTab = computed(() => {
  const hash = window.location.hash
  if (hash.includes('index')) return 'index'
  if (hash.includes('mine')) return 'mine'
  return 'map'
})

onMounted(() => {
  initMap()
  loadMarkers()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// 初始化地图
function initMap() {
  if (!mapContainer.value) return

  // 创建地图
  map = L.map('map', {
    center: [39.908823, 116.397476], // 北京
    zoom: 13,
    layers: [streetLayer]
  })

  // 添加缩放控制
  L.control.zoom({
    position: 'topright'
  }).addTo(map)

  // 地图加载完成后定位
  setTimeout(() => {
    locateUser()
  }, 500)
}

// 定位用户
async function locateUser() {
  try {
    const loc = await getCurrentLocation()
    const latlng = [loc.latitude, loc.longitude]

    // 移动地图到用户位置
    map.setView(latlng, 16)

    // 添加用户位置标记
    if (userMarker) {
      map.removeLayer(userMarker)
    }

    userMarker = L.marker(latlng).addTo(map)
      .bindPopup('<b>你的位置</b>')
      .openPopup()

    // 添加精度圆圈
    L.circle(latlng, { radius: 50, color: '#1890ff', fillColor: '#1890ff', fillOpacity: 0.2 })
      .addTo(map)
  } catch (e) {
    console.error('定位失败:', e)
  }
}

// 加载标记点
function loadMarkers() {
  // 模拟数据
  const mockData = [
    {
      id: '1',
      latitude: 39.908823,
      longitude: 116.397476,
      address: '北京市朝阳区 xx 路 1 号',
      createTime: Date.now() - 3600000,
      uploaderName: '工程师 1',
      userType: '工程师',
      images: ['/static/demo1.jpg'],
      description: '管网破损'
    },
    {
      id: '2',
      latitude: 39.918823,
      longitude: 116.407476,
      address: '北京市朝阳区 xx 街 2 号',
      createTime: Date.now() - 7200000,
      uploaderName: '路人 1',
      userType: '路人',
      images: [],
      description: ''
    },
    {
      id: '3',
      latitude: 39.898823,
      longitude: 116.387476,
      address: '北京市东城区 xx 道 3 号',
      createTime: Date.now() - 86400000,
      uploaderName: '工程师 2',
      userType: '工程师',
      images: ['/static/demo2.jpg', '/static/demo3.jpg'],
      description: '发现漏水情况'
    }
  ]

  nearbyList.value = mockData

  // 添加标记到地图
  mockData.forEach(item => {
    const marker = L.marker([item.latitude, item.longitude]).addTo(map)
      .bindPopup(`
        <div style="min-width: 200px;">
          <b>${item.address || '未知位置'}</b><br/>
          <span style="color: #666;">${item.uploaderName} (${item.userType})</span><br/>
          <span style="color: #999; font-size: 12px;">${formatTime(item.createTime)}</span>
        </div>
      `)

    marker.on('click', () => {
      selectItem(item)
    })

    markers.push(marker)
  })

  // 调整地图边界以显示所有标记
  if (markers.length > 0) {
    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds(), { padding: [50, 50] })
  }
}

// 重新定位
async function relocate() {
  await locateUser()
}

// 切换图层
function toggleLayer() {
  satelliteMode.value = !satelliteMode.value
  if (satelliteMode.value) {
    map.removeLayer(streetLayer)
    map.addLayer(satelliteLayer)
  } else {
    map.removeLayer(satelliteLayer)
    map.addLayer(streetLayer)
  }
}

// 切换面板
function toggleSheet() {
  sheetExpanded.value = !sheetExpanded.value
}

// 选择项目
function selectItem(item) {
  selectedItem.value = item

  // 移动地图到该位置
  if (map) {
    map.setView([item.latitude, item.longitude], 18)
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
  const diff = Date.now() - timestamp
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

function formatFullTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
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
  bottom: 100px;
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
  z-index: 1000;

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
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: white;
  border-top: 1px solid #e8e8e8;
  padding-bottom: env(safe-area-inset-bottom);

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

// Leaflet 样式修复
:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

:deep(.leaflet-popup-content) {
  margin: 12px;
  line-height: 1.5;
}
</style>
