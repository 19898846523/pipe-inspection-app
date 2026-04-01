<template>
  <view class="location-picker">
    <view class="location-card" @click="handleClick">
      <view class="location-info" v-if="location">
        <view class="location-header">
          <text class="icon">📍</text>
          <text class="address">{{ location.address || '已选择位置' }}</text>
        </view>
        <view class="location-coordinates">
          <text class="label">经度：</text>
          <text class="value">{{ location.longitude?.toFixed(6) }}</text>
          <text class="label" style="margin-left: 16px;">纬度：</text>
          <text class="value">{{ location.latitude?.toFixed(6) }}</text>
        </view>
      </view>
      <view class="location-placeholder" v-else>
        <text class="placeholder-text">{{ placeholder }}</text>
      </view>
      <text class="arrow">›</text>
    </view>

    <view class="actions" v-if="location && showActions">
      <button class="action-btn" @click.stop="relocate">重新定位</button>
      <button class="action-btn" @click.stop="chooseOnMap">地图选点</button>
    </view>

    <!-- 加载状态 -->
    <view class="loading-mask" v-if="loading">
      <text class="loading-text">定位中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { getCurrentLocation, chooseLocation, formatLocation } from '@/utils/location'

const props = defineProps({
  // 当前位置
  location: {
    type: Object,
    default: null
  },
  // 占位文字
  placeholder: {
    type: String,
    default: '点击获取当前位置'
  },
  // 显示操作按钮
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:location', 'change'])

const loading = ref(false)

// 获取位置
async function handleClick() {
  if (loading.value) return

  loading.value = true
  try {
    const loc = await getCurrentLocation()
    emit('update:location', loc)
    emit('change', loc)
  } catch (e) {
    console.error('获取位置失败:', e)
  } finally {
    loading.value = false
  }
}

// 重新定位
async function relocate() {
  uni.showLoading({ title: '定位中...' })
  try {
    const loc = await getCurrentLocation()
    emit('update:location', loc)
    emit('change', loc)
  } catch (e) {
    console.error('定位失败:', e)
  } finally {
    uni.hideLoading()
  }
}

// 地图选点
async function chooseOnMap() {
  try {
    const result = await chooseLocation()
    const loc = {
      longitude: result.longitude,
      latitude: result.latitude,
      address: result.address || result.name,
      name: result.name
    }
    emit('update:location', loc)
    emit('change', loc)
  } catch (e) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.location-picker {
  position: relative;
}

.location-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 72px;
}

.location-info {
  flex: 1;

  .location-header {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 8px;

    .icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .address {
      flex: 1;
      font-size: 14px;
      color: #333;
      line-height: 1.4;
    }
  }

  .location-coordinates {
    margin-left: 24px;
    font-size: 12px;

    .label {
      color: #999;
    }

    .value {
      color: #1890ff;
    }
  }
}

.location-placeholder {
  flex: 1;

  .placeholder-text {
    color: #999;
    font-size: 14px;
  }
}

.arrow {
  font-size: 24px;
  color: #ccc;
  margin-left: 8px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;

  .action-btn {
    flex: 1;
    height: 36px;
    line-height: 36px;
    font-size: 13px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 6px;
  }
}

.loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  .loading-text {
    font-size: 14px;
    color: #666;
  }
}
</style>
