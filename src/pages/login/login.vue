<template>
  <div class="container">
    <!-- Logo 区域 -->
    <div class="logo-section">
      <div class="logo-icon">🔧</div>
      <h1 class="logo-title">工程师登录</h1>
      <p class="logo-subtitle">登录后享受更多权限</p>
    </div>

    <!-- 登录表单 -->
    <div class="form-section">
      <div class="form-item">
        <div class="input-wrapper">
          <span class="input-icon">👤</span>
          <input
            class="input"
            v-model="username"
            type="text"
            placeholder="请输入工程师账号"
          />
        </div>
      </div>

      <div class="form-item">
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input
            class="input"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
          />
          <span class="eye-icon" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </span>
        </div>
      </div>

      <div class="form-options">
        <label class="checkbox-label">
          <input type="checkbox" :checked="rememberMe" @change="onRememberChange" />
          <span class="checkbox-text">记住登录状态</span>
        </label>
        <span class="forget-link" @click="handleForget">忘记密码？</span>
      </div>

      <button
        class="login-btn"
        :class="{ disabled: loggingIn }"
        @click="handleLogin"
      >
        {{ loggingIn ? '登录中...' : '登 录' }}
      </button>

      <!-- 其他登录方式 -->
      <div class="other-methods">
        <div class="divider">
          <div class="divider-line"></div>
          <span class="divider-text">其他登录方式</span>
          <div class="divider-line"></div>
        </div>
        <div class="methods">
          <div class="method-item" @click="handlePhoneLogin">
            <span class="method-icon">📱</span>
            <span class="method-text">手机号登录</span>
          </div>
          <div class="method-item" @click="handleCodeLogin">
            <span class="method-icon">📧</span>
            <span class="method-text">验证码登录</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部说明 -->
    <div class="footer-section">
      <p class="footer-text">
        未注册工程师账号？
        <span class="link" @click="handleRegister">联系管理员</span>
      </p>
      <p class="footer-hint">
        路人用户无需登录即可使用上报功能
      </p>
    </div>

    <!-- Toast -->
    <div class="toast" v-if="toastShow">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 状态
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const loggingIn = ref(false)

// Toast
const toastShow = ref(false)
const toastMessage = ref('')

function showToast(message) {
  toastMessage.value = message
  toastShow.value = true
  setTimeout(() => {
    toastShow.value = false
  }, 2000)
}

// 登录
async function handleLogin() {
  // 验证输入
  if (!username.value.trim()) {
    showToast('请输入账号')
    return
  }

  if (!password.value) {
    showToast('请输入密码')
    return
  }

  loggingIn.value = true

  try {
    // 调用登录
    await userStore.login(username.value.trim(), password.value)

    showToast('登录成功')

    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (e) {
    console.error('登录失败:', e)
    showToast('登录失败，请检查账号密码')
  } finally {
    loggingIn.value = false
  }
}

function onRememberChange(e) {
  rememberMe.value = e.target.checked
}

function handleForget() {
  showToast('请联系管理员重置密码')
}

function handlePhoneLogin() {
  showToast('该功能开发中')
}

function handleCodeLogin() {
  showToast('该功能开发中')
}

function handleRegister() {
  showToast('请联系系统管理员')
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1890ff 0%, #096dd9 100%);
  padding: 60px 24px 24px;
}

.logo-section {
  text-align: center;
  margin-bottom: 48px;

  .logo-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .logo-title {
    display: block;
    font-size: 24px;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }

  .logo-subtitle {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.form-section {
  background: white;
  border-radius: 24px 24px 0 0;
  padding: 32px 24px;
  min-height: calc(100vh - 300px);
}

.form-item {
  margin-bottom: 20px;

  .input-wrapper {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 12px;
    padding: 0 16px;
    height: 52px;
    position: relative;

    .input-icon {
      font-size: 20px;
      margin-right: 12px;
    }

    .input {
      flex: 1;
      font-size: 16px;
      color: #333;
      border: none;
      outline: none;
      background: transparent;
    }

    .eye-icon {
      font-size: 18px;
      padding: 8px;
      cursor: pointer;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;

    .checkbox-text {
      font-size: 14px;
      color: #666;
    }
  }

  .forget-link {
    font-size: 14px;
    color: #1890ff;
    cursor: pointer;
  }
}

.login-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 26px;
  margin-bottom: 32px;
  cursor: pointer;

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.other-methods {
  .divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    .divider-line {
      flex: 1;
      height: 1px;
      background: #e8e8e8;
    }

    .divider-text {
      font-size: 13px;
      color: #999;
    }
  }

  .methods {
    display: flex;
    justify-content: center;
    gap: 32px;
  }

  .method-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    .method-icon {
      font-size: 32px;
    }

    .method-text {
      font-size: 13px;
      color: #666;
    }
  }
}

.footer-section {
  text-align: center;
  padding: 24px;

  .footer-text {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 12px;

    .link {
      color: white;
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .footer-hint {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
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
