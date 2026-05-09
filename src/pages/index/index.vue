<template>
  <div class="container">
    <!-- 顶部状态栏 -->
    <header class="header">
      <div class="location-info" @click="refreshLocation">
        <span class="icon">📍</span>
        <span class="location-text">{{ locationText }}</span>
      </div>
      <div class="user-type" @click="goToUpload">
        <span class="badge">{{ userType }}</span>
        <span class="icon">➕</span>
      </div>
    </header>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="搜索上报记录"
          class="placeholder"
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="listRef" @scroll="handleScroll">
      <!-- 空状态 -->
      <div v-if="messageList.length === 0 && !loading" class="empty-state">
        <div class="empty-image">📭</div>
        <p class="empty-text">暂无上报记录</p>
        <button class="upload-btn" @click="goToUpload">立即上报</button>
      </div>

      <!-- 消息卡片 -->
      <div
        v-for="item in messageList"
        :key="item.id"
        class="message-card"
        @click="goToDetail(item)"
      >
        <div class="card-header">
          <div class="user-info">
            <div v-if="item.avatar" class="avatar">
              <img :src="item.avatar" alt="" />
            </div>
            <div v-else class="avatar-default">{{ item.uploaderName?.charAt(0) || '路' }}</div>
            <div class="uploader">
              <span class="name">{{ item.uploaderName || '匿名用户' }}</span>
              <span class="role" :class="item.userType">{{ item.userType || '路人' }}</span>
            </div>
          </div>
          <span class="time">{{ formatTime(item.createTime) }}</span>
        </div>

        <div class="card-content">
          <div class="location">
            <span class="icon">📍</span>
            <span class="location-text">{{ item.address || '未知位置' }}</span>
          </div>
          <div class="coordinates" v-if="item.longitude && item.latitude">
            <span class="label">经纬度：</span>
            <span class="value">{{ formatLocation(item.longitude, item.latitude) }}</span>
          </div>

          <!-- 图片预览 -->
          <div class="images" v-if="item.images && item.images.length > 0">
            <div
              v-for="(img, index) in item.images"
              :key="index"
              class="image-item"
              @click.stop="previewImage(item.images, index)"
            >
              <img :src="img" alt="" />
            </div>
          </div>

          <div class="description" v-if="item.description">
            <p class="desc-text">{{ item.description }}</p>
          </div>
        </div>

        <div class="card-footer">
          <div class="status" :class="item.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ getStatusText(item.status) }}</span>
          </div>
          <div class="actions">
            <span class="action-item">👁️ {{ item.viewCount || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <span class="loading-text">加载中...</span>
      </div>

      <!-- 没有更多 -->
      <div class="no-more" v-if="noMore">
        <span class="no-more-text">没有更多了</span>
      </div>
    </div>

    <!-- 悬浮按钮 -->
    <div class="fab-btn" @click="goToUpload">
      <span class="fab-icon">➕</span>
    </div>

    <!-- 底部导航 -->
    <nav class="tabbar">
      <div class="tab-item" :class="{ active: activeTab === 'index' }" @click="switchTab('index')">
        <span class="tab-icon">🏠</span>
        <span class="tab-text">首页</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'map' }" @click="switchTab('map')">
        <span class="tab-icon">🗺️</span>
        <span class="tab-text">地图</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'mine' }" @click="switchTab('mine')">
        <span class="tab-icon">👤</span>
        <span class="tab-text">我的</span>
      </div>
    </nav>

    <!-- 图片预览 -->
    <div class="image-preview" v-if="showPreview" @click="closePreview">
      <button class="close-btn" @click.stop="closePreview">×</button>
      <img :src="previewUrl" alt="" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getCurrentLocation, formatLocation } from '@/utils/location'
import { post } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

// 状态
const messageList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const listRef = ref(null)

// 位置信息
const locationText = ref('获取位置中...')

// 图片预览
const showPreview = ref(false)
const previewUrl = ref('')

// 用户类型
const userType = computed(() => userStore.userType)

// 当前 Tab
const activeTab = computed(() => {
  const hash = window.location.hash
  if (hash.includes('map')) return 'map'
  if (hash.includes('mine')) return 'mine'
  return 'index'
})

onMounted(() => {
  userStore.loadUser()
  initLocation()
  loadMessages()
})

// 初始化位置
async function initLocation() {
  try {
    const loc = await getCurrentLocation()
    locationText.value = loc.city || loc.district || '当前位置'
  } catch (e) {
    locationText.value = '点击获取位置'
  }
}

// 刷新位置
async function refreshLocation() {
  try {
    const loc = await getCurrentLocation()
    locationText.value = loc.city || loc.district || '当前位置'
  } catch (e) {
    locationText.value = '点击获取位置'
  }
}

// 加载消息列表
async function loadMessages(isRefresh = false) {
  if (loading.value) return

  loading.value = true
  try {
    const targetPage = isRefresh ? 1 : currentPage.value
    // 构造真实接口所需的参数
    const params = {
      action: "grsb",
      domain: "",
      eventLevel: "",
      eventType: "",
      flag: "",
      occurEndBetween: "",
      occurStartBetween: "",
      pageNo: targetPage,
      pageSize: pageSize.value,
      titleLike: searchKeyword.value // 绑定搜索框的值
    }

    const res = await post('/opt-event/page', params)

    if (res && res.status === 200 && res.data) {
      const records = res.data.records || []

      // 字段映射：将后端真实字段转换为模板所需的字段格式
      const realData = records.map(item => {
        // 推导状态
        let currentStatus = 'pending'
        if (item.flag === '1') currentStatus = 'processing'
        if (item.flag === '2') currentStatus = 'completed'

        return {
          id: item.id,
          uploaderName: item.userName || '未知用户',
          userType: '路人', // 根据业务可改为判断逻辑
          createTime: item.reportTime, // 后端返回的时间字符串
          longitude: item.longitude,
          latitude: item.latitude,
          address: item.address || item.areaNames_label || '未知位置',
          images: [], // 列表接口未返回图片，设为空
          description: item.content || item.title || '暂无描述',
          status: currentStatus,
          viewCount: 0,
          rawItem: item // 将完整原始数据保存下来，跳转详情时用
        }
      })

      if (isRefresh) {
        messageList.value = realData
        currentPage.value = 1
      } else {
        messageList.value = [...messageList.value, ...realData]
      }

      noMore.value = records.length < pageSize.value
    } else {
      console.error('获取首页列表失败:', res?.message)
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新（简化版）
async function onRefresh() {
  refreshing.value = true
  currentPage.value = 1
  noMore.value = false
  await loadMessages(true)
}

// 滚动加载更多
function handleScroll(e) {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollTop + clientHeight >= scrollHeight - 100 && !loading.value && !noMore.value) {
    currentPage.value++
    loadMessages()
  }
}

// 搜索
function handleSearch() {
  currentPage.value = 1
  loadMessages(true)
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  // 转换字符串为时间戳
  const timeNum = typeof timestamp === 'string' ? new Date(timestamp.replace(/-/g, '/')).getTime() : timestamp
  if (isNaN(timeNum)) return timestamp

  const now = Date.now()
  const diff = now - timeNum

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  const date = new Date(timeNum)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取状态文本
function getStatusText(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  }
  return map[status] || '未知'
}

// 预览图片
function previewImage(images, index) {
  previewUrl.value = images[index]
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
  previewUrl.value = ''
}

// 切换 Tab
function switchTab(tab) {
  router.push('/' + tab)
}

// 跳转上传
function goToUpload() {
  router.push('/upload')
}

// 跳转详情
function goToDetail(item) {
  // 把真正的后端原始数据 item.rawItem 存入 sessionStorage 供 detail.vue 解析
  sessionStorage.setItem('currentEventDetail', JSON.stringify(item.rawItem))
  router.push({ path: '/detail', query: { id: item.id } })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 6px;

  .location-text {
    font-size: 14px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.user-type {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;

  .badge {
    font-size: 12px;
  }
}

.search-bar {
  padding: 12px 16px;
  background: white;
}

.search-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 10px 16px;
  gap: 8px;

  .search-icon {
    font-size: 16px;
  }

  input {
    flex: 1;
    font-size: 14px;
    background: transparent;
    border: none;
    outline: none;
  }

  .placeholder {
    color: #999;
  }
}

.message-list {
  height: calc(100vh - 140px);
  overflow-y: auto;
  padding: 0 16px 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;

  .empty-image {
    font-size: 80px;
  }

  .empty-text {
    margin-top: 20px;
    color: #999;
    font-size: 14px;
  }

  .upload-btn {
    margin-top: 20px;
    background: #1890ff;
    color: white;
    border: none;
    padding: 10px 40px;
    border-radius: 20px;
    font-size: 14px;
  }
}

.message-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .avatar,
      .avatar-default {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        overflow: hidden;
      }

      .avatar-default {
        background: #1890ff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .uploader {
        display: flex;
        flex-direction: column;

        .name {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .role {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 2px;
          width: fit-content;

          &.工程师 {
            background: #e6f7ff;
            color: #1890ff;
          }

          &.路人 {
            background: #f5f5f5;
            color: #666;
          }
        }
      }
    }

    .time {
      font-size: 12px;
      color: #999;
    }
  }

  .card-content {
    .location {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;

      .location-text {
        font-size: 14px;
        color: #333;
      }
    }

    .coordinates {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;

      .label {
        color: #999;
      }

      .value {
        color: #1890ff;
      }
    }

    .images {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;

      .image-item {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        background: #f5f5f5;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .description {
      .desc-text {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;

    .status {
      display: flex;
      align-items: center;
      gap: 4px;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.pending { background: #faad14; }
        &.processing { background: #1890ff; }
        &.completed { background: #52c41a; }
      }

      .status-text {
        font-size: 12px;
        color: #666;
      }
    }

    .actions {
      display: flex;
      gap: 16px;

      .action-item {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.loading-state,
.no-more {
  text-align: center;
  padding: 20px;

  .loading-text,
  .no-more-text {
    color: #999;
    font-size: 14px;
  }
}

.fab-btn {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  z-index: 100;

  .fab-icon {
    font-size: 28px;
    color: white;
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

.image-preview {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}
</style>
