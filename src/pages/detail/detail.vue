<template>
  <div class="container">
    <div class="image-section" v-if="detail.images && detail.images.length > 0">
      <div class="swiper">
        <div class="swiper-wrapper" :style="swiperStyle">
          <div class="swiper-slide" v-for="(img, index) in detail.images" :key="index">
            <img class="swiper-image" :src="img" alt="" @click="previewImage(index)" />
          </div>
        </div>
        <div class="swiper-indicators" v-if="detail.images.length > 1">
          <span
            class="indicator"
            v-for="(img, index) in detail.images"
            :key="index"
            :class="{ active: currentSlide === index }"
          ></span>
        </div>
      </div>
    </div>

    <div class="status-section">
      <span class="status-tag" :class="detail.status">
        {{ getStatusText(detail.status) }}
      </span>
      <span class="time">{{ formatFullTime(detail.createTime) }}</span>
    </div>

    <section class="info-section">
      <div class="section-title">
        <span class="icon">📋</span>
        <h3 class="title">基本信息</h3>
      </div>
      <div class="info-content">
        <div class="info-row">
          <span class="label">事件标题：</span>
          <span class="value font-bold">{{ detail.title || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">所属领域：</span>
          <span class="value">{{ detail.domainName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">事件类别：</span>
          <span class="value">{{ detail.eventTypeName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">事件等级：</span>
          <span class="value">
            <span class="level-tag" :class="'level-' + (detail.eventLevel || 'default')">
              {{ detail.eventLevelName || '-' }}
            </span>
          </span>
        </div>
      </div>
    </section>

    <section class="info-section">
      <div class="section-title">
        <span class="icon">📍</span>
        <h3 class="title">时空信息</h3>
      </div>
      <div class="info-content">
        <div class="info-row">
          <span class="label">发生时间(起)：</span>
          <span class="value">{{ detail.occurStart ? formatFullTime(detail.occurStart) : '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">发生时间(止)：</span>
          <span class="value">{{ detail.occurEnd ? formatFullTime(detail.occurEnd) : '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">区域代码：</span>
          <span class="value">{{ detail.areaCode || '-' }}</span>
        </div>

        <div class="divider"></div>

        <p class="address">{{ detail.address || '未知位置' }}</p>
        <div class="coordinates-box">
          <div class="coordinates">
            <span class="label">经度：</span>
            <span class="value">{{ detail.longitude?.toFixed(6) || '-' }}</span>
          </div>
          <div class="coordinates">
            <span class="label">纬度：</span>
            <span class="value">{{ detail.latitude?.toFixed(6) || '-' }}</span>
          </div>
        </div>
        <div class="location-actions">
          <button class="action-btn" @click="openLocation">
            <span class="btn-icon">🗺️</span>
            <span class="btn-text">查看地图</span>
          </button>
          <button class="action-btn" @click="navigateTo">
            <span class="btn-icon">🧭</span>
            <span class="btn-text">导航</span>
          </button>
        </div>
      </div>
    </section>

    <section class="info-section">
      <div class="section-title">
        <span class="icon">👤</span>
        <h3 class="title">上报人信息</h3>
      </div>
      <div class="info-content">
        <div class="uploader-row">
          <div class="uploader-avatar">
            <span class="avatar-text">{{ detail.uploaderName?.charAt(0) || '匿' }}</span>
          </div>
          <div class="uploader-info">
            <span class="uploader-name">{{ detail.uploaderName || '匿名用户' }}</span>
            <span class="uploader-type" :class="detail.userType">{{ detail.userType || '路人' }}</span>
          </div>
        </div>
        <button class="contact-btn" v-if="detail.userType === '工程师'" @click="contactUploader">
          联系上报人
        </button>
      </div>
    </section>

    <section class="info-section" v-if="detail.content">
      <div class="section-title">
        <span class="icon">📝</span>
        <h3 class="title">事件详情</h3>
      </div>
      <div class="info-content">
        <p class="description">{{ detail.content }}</p>
      </div>
    </section>

    <section class="info-section" v-if="detail.status !== 'pending'">
      <div class="section-title">
        <span class="icon">🔄</span>
        <h3 class="title">处理进度</h3>
      </div>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot pending"></div>
          <div class="timeline-content">
            <span class="timeline-title">已上报</span>
            <span class="timeline-time">{{ formatTime(detail.createTime) }}</span>
          </div>
        </div>
        <div class="timeline-item" v-if="detail.status === 'processing' || detail.status === 'completed'">
          <div class="timeline-dot processing"></div>
          <div class="timeline-content">
            <span class="timeline-title">处理中</span>
            <span class="timeline-time">{{ detail.processTime ? formatTime(detail.processTime) : '待处理' }}</span>
          </div>
        </div>
        <div class="timeline-item" v-if="detail.status === 'completed'">
          <div class="timeline-dot completed"></div>
          <div class="timeline-content">
            <span class="timeline-title">已完成</span>
            <span class="timeline-time">{{ detail.completeTime ? formatTime(detail.completeTime) : '待完成' }}</span>
          </div>
        </div>
      </div>
    </section>

    <div class="action-bar">
      <div class="action-item" @click="toggleFavorite">
        <span class="action-icon">{{ isFavorite ? '❤️' : '🤍' }}</span>
        <span class="action-text">{{ isFavorite ? '已收藏' : '收藏' }}</span>
      </div>
      <div class="action-item" @click="handleShare">
        <span class="action-icon">📤</span>
        <span class="action-text">分享</span>
      </div>
      <div class="action-item" @click="handleReport">
        <span class="action-icon">⚠️</span>
        <span class="action-text">举报</span>
      </div>
      <button class="primary-btn" v-if="isEngineer" @click="handleProcess">
        {{ detail.status === 'pending' ? '开始处理' : '更新进度' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
// import { formatLocation } from '@/utils/location' // 如果未使用可移除

const userStore = useUserStore()

// 状态：已根据 upload.vue 的请求参数补全
const detail = ref({
  id: '',
  title: '',
  domain: '',
  domainName: '',
  eventType: '',
  eventTypeName: '',
  eventLevel: '',
  eventLevelName: '',
  areaCode: '',
  occurStart: null,
  occurEnd: null,
  longitude: 0,
  latitude: 0,
  address: '',
  createTime: null,
  processTime: null,
  completeTime: null,
  uploaderName: '',
  userType: '',
  images: [],
  content: '', // 原为 description，现对齐 upload.vue
  status: 'pending'
})
const isFavorite = ref(false)
const isEngineer = ref(false)
const currentSlide = ref(0)

onMounted(() => {
  userStore.loadUser()
  isEngineer.value = userStore.isEngineer
  loadDetail()

  // 自动轮播
  setInterval(() => {
    if (detail.value.images.length > 1) {
      currentSlide.value = (currentSlide.value + 1) % detail.value.images.length
    }
  }, 3000)
})

// 轮播样式
const swiperStyle = computed(() => ({
  transform: `translateX(-${currentSlide.value * 100}%)`
}))

// 加载详情
function loadDetail() {
  const params = new URLSearchParams(window.location.hash.split('?')[1])
  const id = params.get('id') || 'mock-1'

  // 模拟数据：整合了原有的和新增补充的字段
  // 注：实际开发中，domainName / eventTypeName 等通常由后端直接返回（或者通过字典转译）
  detail.value = {
    id,
    title: '主干道供水管网破损漏水',
    domain: 'WATER',
    domainName: '供水管网',
    eventType: 'BROKEN',
    eventTypeName: '设施损坏',
    eventLevel: 'HIGH',
    eventLevelName: '重大级',
    areaCode: '110105',
    occurStart: '2023-10-24 10:30:00',
    occurEnd: '', // 如果没有结束时间则为空
    longitude: 116.397428,
    latitude: 39.90923,
    address: '北京市朝阳区 xx 路 xx 号',
    createTime: Date.now() - 3600000,
    processTime: Date.now() - 1800000,
    completeTime: null,
    uploaderName: '工程师 1',
    userType: '工程师',
    images: ['/static/demo1.jpg', '/static/demo2.jpg', '/static/demo3.jpg'],
    content: '巡检发现该处主干道管网存在严重破损并伴随漏水情况，需要及时安排抢修处理。现场已做好安全警示和隔离。',
    status: 'processing'
  }
}

// 预览图片
function previewImage(index) {
  const preview = document.createElement('div')
  preview.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:1000;'
  preview.innerHTML = `
    <button style="position:absolute;top:20px;right:20px;width:40px;height:40px;background:rgba(255,255,255,0.2);border:none;border-radius:50%;color:white;font-size:28px;cursor:pointer;">×</button>
    <img src="${detail.value.images[index]}" style="max-width:100%;max-height:100%;object-fit:contain;" />
  `
  preview.querySelector('button').onclick = () => preview.remove()
  document.body.appendChild(preview)
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

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '待处理'
  // 兼容字符串类型的时间（如 occurStart 可能是 "2023-10-24 10:30:00"）
  const date = typeof timestamp === 'string' ? new Date(timestamp.replace(/-/g, '/')) : new Date(timestamp)
  if (isNaN(date.getTime())) return timestamp
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatFullTime(timestamp) {
  if (!timestamp) return ''
  const date = typeof timestamp === 'string' ? new Date(timestamp.replace(/-/g, '/')) : new Date(timestamp)
  if (isNaN(date.getTime())) return timestamp
  return date.toLocaleString('zh-CN', { hour12: false })
}

// 打开位置
function openLocation() {
  if (detail.value.longitude && detail.value.latitude) {
    const url = `https://uri.amap.com/marker?position=${detail.value.longitude},${detail.value.latitude}&name=${encodeURIComponent(detail.value.address || '管网位置')}&coordinate=gaode&sys=1`
    window.open(url, '_blank')
  } else {
    alert('位置信息缺失')
  }
}

// 导航
function navigateTo() {
  if (detail.value.longitude && detail.value.latitude) {
    const url = `https://uri.amap.com/marker?position=${detail.value.longitude},${detail.value.latitude}&name=${encodeURIComponent(detail.value.address || '管网位置')}&coordinate=gaode&sys=1`
    window.open(url, '_blank')
  }
}

// 联系上报人
function contactUploader() {
  alert('功能开发中')
}

// 收藏
function toggleFavorite() {
  isFavorite.value = !isFavorite.value
  alert(isFavorite.value ? '已收藏' : '已取消收藏')
}

// 分享
function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: detail.value.title || '管网巡检事件',
      text: detail.value.content,
      url: window.location.href
    })
  } else {
    alert('分享功能暂不支持')
  }
}

// 举报
function handleReport() {
  const reason = prompt('请说明举报原因')
  if (reason) {
    alert('举报已提交')
  }
}

// 处理
function handleProcess() {
  alert('功能开发中')
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* 轮播图样式保持不变 */
.image-section {
  .swiper {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: hidden;

    .swiper-wrapper {
      display: flex;
      height: 100%;
      transition: transform 0.3s ease;
    }

    .swiper-slide {
      min-width: 100%;
      height: 100%;
    }

    .swiper-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
    }

    .swiper-indicators {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);

        &.active {
          background: white;
        }
      }
    }
  }
}

/* 状态标签 */
.status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;

  .status-tag {
    padding: 6px 16px;
    border-radius: 16px;
    font-size: 13px;

    &.pending {
      background: #fff7e6;
      color: #faad14;
    }

    &.processing {
      background: #e6f7ff;
      color: #1890ff;
    }

    &.completed {
      background: #f6ffed;
      color: #52c41a;
    }
  }

  .time {
    font-size: 13px;
    color: #999;
  }
}

/* 详情卡片基础容器 */
.info-section {
  background: white;
  margin-top: 12px;
  padding: 16px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 16px;

    .icon {
      font-size: 18px;
    }

    .title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  .info-content {
    /* 新增：键值对排列布局，适用于基本信息和时空信息 */
    .info-row {
      display: flex;
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #666;
        width: 90px;
        flex-shrink: 0;
      }

      .value {
        color: #333;
        flex: 1;
        word-break: break-all;

        &.font-bold {
          font-weight: bold;
          font-size: 15px;
        }

        /* 等级标签样式 */
        .level-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;

          &.level-HIGH { background: #fff1f0; color: #f5222d; }
          &.level-MIDDLE { background: #fff7e6; color: #faad14; }
          &.level-LOW { background: #e6f7ff; color: #1890ff; }
          &.level-default { background: #f5f5f5; color: #666; }
        }
      }
    }

    /* 区域分割线 */
    .divider {
      height: 1px;
      background: #f0f0f0;
      margin: 16px 0;
    }

    .address {
      font-size: 15px;
      color: #333;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .coordinates-box {
      display: flex;
      gap: 20px;
      margin-bottom: 12px;

      .coordinates {
        font-size: 13px;

        .label {
          color: #999;
        }

        .value {
          color: #1890ff;
        }
      }
    }

    .location-actions {
      display: flex;
      gap: 12px;

      .action-btn {
        flex: 1;
        height: 40px;
        background: #f5f5f5;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border: none;
        cursor: pointer;

        .btn-icon {
          font-size: 16px;
        }

        .btn-text {
          font-size: 13px;
          color: #333;
        }
      }
    }

    .uploader-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .uploader-avatar {
        width: 48px;
        height: 48px;
        background: #1890ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;

        .avatar-text {
          font-size: 20px;
          font-weight: bold;
          color: white;
        }
      }

      .uploader-info {
        flex: 1;

        .uploader-name {
          display: block;
          font-size: 15px;
          color: #333;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .uploader-type {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;

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

    .contact-btn {
      width: 100%;
      height: 40px;
      background: #1890ff;
      color: white;
      font-size: 14px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
    }

    .description {
      font-size: 14px;
      color: #666;
      line-height: 1.8;
      margin: 0;
      white-space: pre-wrap;
    }
  }
}

/* 时间轴 */
.timeline {
  .timeline-item {
    display: flex;
    gap: 16px;
    padding: 12px 0;
    position: relative;

    &:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 44px;
      width: 2px;
      height: calc(100% - 44px);
      background: #e8e8e8;
    }

    .timeline-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      flex-shrink: 0;

      &.pending {
        background: #faad14;
      }

      &.processing {
        background: #1890ff;
      }

      &.completed {
        background: #52c41a;
      }
    }

    .timeline-content {
      flex: 1;

      .timeline-title {
        display: block;
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
      }

      .timeline-time {
        display: block;
        font-size: 12px;
        color: #999;
      }
    }
  }
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 24px;
    cursor: pointer;

    .action-icon {
      font-size: 22px;
      margin-bottom: 4px;
    }

    .action-text {
      font-size: 12px;
      color: #666;
    }
  }

  .primary-btn {
    flex: 1;
    max-width: 200px;
    height: 44px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 22px;
    cursor: pointer;
  }
}
</style>