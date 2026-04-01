<template>
  <div class="container">
    <!-- 位置信息 -->
    <section class="section">
      <div class="section-title">
        <span class="icon">📍</span>
        <span class="title">位置信息</span>
        <span class="required">*</span>
      </div>
      <div class="location-card" @click="getLocation">
        <div class="location-info" v-if="locationData">
          <p class="address">{{ locationData.address || '已获取经纬度' }}</p>
          <p class="coordinates">
            {{ formatLocation(locationData.longitude, locationData.latitude) }}
          </p>
        </div>
        <div class="location-placeholder" v-else>
          <p class="placeholder-text">点击获取当前位置</p>
        </div>
        <span class="arrow">›</span>
      </div>
      <div class="location-actions" v-if="locationData">
        <button class="mini-btn" @click.stop="getLocation">重新定位</button>
      </div>
    </section>

    <!-- 时间信息 -->
    <section class="section">
      <div class="section-title">
        <span class="icon">🕐</span>
        <span class="title">上报时间</span>
      </div>
      <div class="info-card">
        <span class="info-value">{{ currentTime }}</span>
      </div>
    </section>

    <!-- 照片上传 -->
    <section class="section">
      <div class="section-title">
        <span class="icon">📷</span>
        <span class="title">现场照片</span>
        <span class="optional">（最多 9 张）</span>
      </div>
      <div class="image-uploader">
        <div
          class="image-item"
          v-for="(img, index) in images"
          :key="index"
        >
          <img class="image" :src="img" alt="" @click="previewImage(index)" />
          <div class="delete-btn" @click="deleteImage(index)">
            <span class="delete-icon">×</span>
          </div>
        </div>
        <div
          class="upload-btn"
          v-if="images.length < 9"
          @click="chooseImage"
        >
          <span class="upload-icon">＋</span>
          <span class="upload-text">上传</span>
        </div>
      </div>
    </section>

    <!-- 文字描述 -->
    <section class="section">
      <div class="section-title">
        <span class="icon">📝</span>
        <span class="title">文字描述</span>
        <span class="optional">（可选）</span>
      </div>
      <textarea
        class="textarea"
        v-model="description"
        placeholder="请描述管网问题的具体情况..."
        maxlength="500"
      />
      <span class="char-count">{{ description.length }}/500</span>
    </section>

    <!-- 上报人信息 -->
    <section class="section">
      <div class="section-title">
        <span class="icon">👤</span>
        <span class="title">上报人信息</span>
      </div>
      <div class="uploader-info">
        <div class="uploader-row">
          <span class="label">用户类型：</span>
          <span class="value badge" :class="userTypeClass">{{ userType }}</span>
        </div>
        <div class="uploader-row">
          <span class="label">昵称：</span>
          <input
            class="nickname-input"
            v-model="uploaderName"
            placeholder="请输入昵称（可选）"
          />
        </div>
        <div class="uploader-row" v-if="isLoggedIn">
          <span class="label">账号：</span>
          <span class="value">{{ userInfo?.username || '-' }}</span>
        </div>
      </div>
    </section>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <button class="submit-btn" :class="{ disabled: submitting }" @click="handleSubmit">
        {{ submitting ? '提交中...' : '立即上报' }}
      </button>
    </div>

    <!-- Toast -->
    <div class="toast" v-if="toastShow">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getCurrentLocation, formatLocation } from '@/utils/location'

const router = useRouter()
const userStore = useUserStore()

// 状态
const locationData = ref(null)
const currentTime = ref('')
const images = ref([])
const description = ref('')
const uploaderName = ref('')
const submitting = ref(false)

// Toast
const toastShow = ref(false)
const toastMessage = ref('')

// 用户信息
const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)
const userType = computed(() => userStore.userType)
const userTypeClass = computed(() => userStore.isEngineer ? 'engineer' : 'passerby')

function showToast(message) {
  toastMessage.value = message
  toastShow.value = true
  setTimeout(() => {
    toastShow.value = false
  }, 2000)
}

onMounted(() => {
  userStore.loadUser()
  updateTime()
  getLocation()
})

// 更新时间
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取位置
async function getLocation() {
  try {
    locationData.value = await getCurrentLocation()
  } catch (e) {
    console.error('定位失败:', e)
    showToast('定位失败，请检查浏览器权限')
  }
}

// 选择图片
function chooseImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.value.length > 9) {
      showToast('最多只能上传 9 张图片')
      return
    }
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        images.value.push(event.target.result)
      }
      reader.readAsDataURL(file)
    })
  }
  input.click()
}

// 预览图片
function previewImage(index) {
  // 创建全屏预览
  const preview = document.createElement('div')
  preview.className = 'image-preview-full'
  preview.innerHTML = `
    <button class="close-btn" onclick="this.parentElement.remove()">×</button>
    <img src="${images.value[index]}" alt="" />
  `
  preview.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:1000;'
  document.body.appendChild(preview)

  const img = preview.querySelector('img')
  img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;'

  const btn = preview.querySelector('.close-btn')
  btn.style.cssText = 'position:absolute;top:20px;right:20px;width:40px;height:40px;background:rgba(255,255,255,0.2);border:none;border-radius:50%;color:white;font-size:28px;cursor:pointer;'
}

// 删除图片
function deleteImage(index) {
  if (confirm('确定删除这张照片吗？')) {
    images.value.splice(index, 1)
  }
}

// 提交
async function handleSubmit() {
  // 验证
  if (!locationData.value) {
    showToast('请获取位置信息')
    return
  }

  if (images.value.length === 0) {
    showToast('请至少上传一张照片')
    return
  }

  submitting.value = true

  try {
    // 模拟上传
    await new Promise(resolve => setTimeout(resolve, 1500))

    showToast('上报成功')

    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (e) {
    console.error('上传失败:', e)
    showToast('上传失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.section {
  background: white;
  margin-top: 12px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;

  .icon {
    font-size: 18px;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .required {
    color: #ff4d4f;
    font-size: 14px;
  }

  .optional {
    color: #999;
    font-size: 12px;
    font-weight: normal;
  }
}

.location-card,
.info-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.location-card {
  position: relative;

  .coordinates {
    font-size: 12px;
    color: #1890ff;
    margin-top: 4px;
  }

  .arrow {
    font-size: 24px;
    color: #ccc;
  }
}

.location-placeholder {
  .placeholder-text {
    color: #999;
    font-size: 14px;
  }
}

.location-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.mini-btn {
  flex: 1;
  height: 36px;
  font-size: 13px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.info-value {
  font-size: 14px;
  color: #333;
}

.image-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;

  .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .delete-icon {
      color: white;
      font-size: 18px;
      font-weight: 300;
    }
  }
}

.upload-btn {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  cursor: pointer;

  .upload-icon {
    font-size: 32px;
    color: #1890ff;
  }

  .upload-text {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }
}

.textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  resize: vertical;
  font-family: inherit;
}

.textarea:focus {
  outline: none;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.uploader-info {
  .uploader-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .label {
      width: 80px;
      font-size: 14px;
      color: #666;
    }

    .value {
      font-size: 14px;
      color: #333;

      &.badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;

        &.engineer {
          background: #e6f7ff;
          color: #1890ff;
        }

        &.passerby {
          background: #f5f5f5;
          color: #666;
        }
      }
    }

    .nickname-input {
      flex: 1;
      font-size: 14px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 6px;
      border: none;
      outline: none;
    }
  }
}

.submit-section {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 24px;
  cursor: pointer;

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 1000;
  font-size: 14px;
}
</style>
