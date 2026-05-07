<template>
  <div class="container">
    <header class="user-header">
      <div class="header-content">
        <div class="avatar-section">
          <div v-if="isLoggedIn && userInfo?.avatar" class="avatar">
            <img :src="userInfo.avatar" alt="" />
          </div>
          <div v-else class="avatar-default">
            <span class="avatar-text">{{ isLoggedIn ? userInfo?.username?.charAt(0) : '路' }}</span>
          </div>
        </div>
        <div class="user-info">
          <h2 class="username">{{ isLoggedIn ? userInfo?.username : '路人用户' }}</h2>
          <span class="user-type" :class="isLoggedIn ? 'engineer' : 'passerby'">
            {{ userType }}
          </span>
        </div>
      </div>
    </header>

    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-value">{{ stats.uploadCount }}</span>
        <span class="stat-label">我的上报</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.viewCount }}</span>
        <span class="stat-label">累计浏览</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.followUpCount }}</span>
        <span class="stat-label">我的跟进</span>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-group">
        <span class="group-title">我的服务</span>
        <div class="menu-list">
          <div class="menu-item" @click="goToMyUploads">
            <span class="menu-icon">📋</span>
            <span class="menu-text">我的上报</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goToFollowUp">
            <span class="menu-icon">🔄</span>
            <span class="menu-text">我的跟进</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="auth-section">
        <button
          v-if="!isLoggedIn"
          class="login-btn"
          @click="goToLogin"
        >
          工程师登录
        </button>
        <button
          v-else
          class="logout-btn"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
    </div>

    <div class="version-section">
      <span class="version">Version 1.0.0</span>
    </div>

    <nav class="tabbar">
      <div class="tab-item" :class="{ active: activeTab === 'index' }" @click="switchTab('index')">
        <span class="tab-icon">🏠</span>
        <span class="tab-text">首页</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'map' }" @click="switchTab('map')">
        <span class="tab-icon">🗺️</span>
        <span class="tab-text">地图</span>
      </div>
      <div class="tab-item active">
        <span class="tab-icon">👤</span>
        <span class="tab-text">我的</span>
      </div>
    </nav>
    <div class="custom-modal-overlay" v-if="showLogoutModal">
      <div class="custom-modal">
        <div class="modal-header">提示</div>
        <div class="modal-body">确定要退出登录吗？</div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showLogoutModal = false">取 消</button>
          <button class="btn-confirm" @click="executeLogout">确 定</button>
        </div>
      </div>
    </div>
    <div class="toast" v-if="toastShow">
        <span>{{toastMessage}}</span>
    </div>

  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const showLogoutModal = ref(false)
const toastShow = ref(false)
const toastMessage = ref('')

// 状态
const stats = ref({
  uploadCount: 0,
  viewCount: 0,
  followUpCount: 0
})

// 用户信息
const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)
const userType = computed(() => userStore.userType)

// 当前 Tab
const activeTab = computed(() => {
  const hash = window.location.hash
  if (hash.includes('index')) return 'index'
  if (hash.includes('map')) return 'map'
  return 'mine'
})

onMounted(() => {
  userStore.loadUser()
  loadStats()
})

// 加载统计数据
function loadStats() {
  stats.value = {
    uploadCount: isLoggedIn.value ? 12 : 0,
    viewCount: isLoggedIn.value ? 156 : 0,
    followUpCount: isLoggedIn.value ? 8 : 0
  }
}

function goToLogin() {
  router.push('/login')
}

function handleLogout() {
  showLogoutModal.value = true
}

function showToast(message) {
  toastMessage.value = message
  toastShow.value = true
  setTimeout(() => {
    toastShow.value = false
  }, 2000)
}

async function executeLogout() {
  // 先关闭弹窗
  showLogoutModal.value = false

  // 执行退出逻辑
  await userStore.logout()

  // 清空本页面的统计数据
  stats.value = { uploadCount: 0, viewCount: 0, followUpCount: 0 }

  // 提示
  showToast('已退出登录')
}

function goToMyUploads() {
  if (!isLoggedIn.value) {
    showToast('请先登录')
    return
  }
  router.push('/my-uploads')
}

function goToFollowUp() {
  if (!isLoggedIn.value) {
    showToast('请先登录')
    return
  }
  showToast('功能开发中')
}

function switchTab(tab) {
  router.push('/' + tab)
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.user-header {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 40px 20px 30px;

  .header-content {
    display: flex;
    align-items: center;
  }

  .avatar-section {
    .avatar,
    .avatar-default {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      overflow: hidden;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-default {
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;

      .avatar-text {
        font-size: 32px;
        font-weight: bold;
        color: white;
      }
    }
  }

  .user-info {
    flex: 1;
    margin-left: 16px;

    .username {
      font-size: 20px;
      font-weight: 600;
      color: white;
      margin-bottom: 6px;
    }

    .user-type {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 12px;

      &.engineer {
        background: rgba(255, 255, 255, 0.25);
        color: white;
      }

      &.passerby {
        background: rgba(0, 0, 0, 0.15);
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

.stats-section {
  display: flex;
  align-items: center;
  background: white;
  margin: -20px 16px 12px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #1890ff;
      margin-bottom: 6px;
    }

    .stat-label {
      font-size: 13px;
      color: #999;
    }
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: #e8e8e8;
  }
}

.menu-section {
  margin: 0 16px;
}

.menu-group {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;

  .group-title {
    display: block;
    padding: 16px 16px 8px;
    font-size: 13px;
    color: #999;
  }

  .menu-list {
    .menu-item {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-top: 1px solid #f0f0f0;
      cursor: pointer;

      .menu-icon {
        font-size: 20px;
        margin-right: 12px;
      }

      .menu-text {
        flex: 1;
        font-size: 15px;
        color: #333;
      }

      .menu-arrow {
        font-size: 24px;
        color: #ccc;
      }
    }
  }
}

.auth-section {
  margin-top: 24px;
  padding: 0 16px;

  .login-btn,
  .logout-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 24px;
    cursor: pointer;
  }

  .login-btn {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
  }

  .logout-btn {
    background: #fff;
    color: #ff4d4f;
    border: 1px solid #ff4d4f;
  }
}

.version-section {
  text-align: center;
  padding: 32px 0;

  .version {
    font-size: 13px;
    color: #999;
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

/* ======= 弹窗的样式 ======= */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.custom-modal {
  width: 300px;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: scaleUp 0.2s ease-out forwards;
}

@keyframes scaleUp {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  padding: 16px 20px 8px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.modal-body {
  padding: 16px 20px 24px;
  font-size: 15px;
  color: #666;
  text-align: center;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #eee;

  button {
    flex: 1;
    height: 48px;
    background: transparent;
    border: none;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:active {
      background-color: #f5f5f5;
    }
  }

  .btn-cancel {
    color: #666;
    border-right: 1px solid #eee;
  }

  .btn-confirm {
    color: #ff4d4f;
    font-weight: bold;
  }
}

/* ======= Toast 提示框的样式 ======= */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 10000;
  text-align: center;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>