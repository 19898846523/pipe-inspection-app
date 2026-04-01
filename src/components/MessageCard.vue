<template>
  <view class="message-card" @click="handleClick">
    <view class="card-header">
      <view class="user-info">
        <image
          v-if="avatar"
          class="avatar"
          :src="avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar-default">{{ name?.charAt(0) || '匿' }}</view>
        <view class="uploader">
          <text class="name">{{ name || '匿名用户' }}</text>
          <text class="role" :class="userType">{{ userType || '路人' }}</text>
        </view>
      </view>
      <text class="time">{{ time }}</text>
    </view>

    <view class="card-content">
      <view class="location" v-if="showLocation">
        <text class="icon">📍</text>
        <text class="location-text">{{ address }}</text>
      </view>

      <view class="coordinates" v-if="showCoordinates && longitude && latitude">
        <text class="label">经纬度：</text>
        <text class="value">{{ formatLocation(longitude, latitude) }}</text>
      </view>

      <!-- 图片预览 -->
      <view class="images" v-if="images && images.length > 0">
        <image
          v-for="(img, index) in images"
          :key="index"
          class="image-item"
          :src="img"
          mode="aspectFill"
          @click.stop="previewImage(index)"
        />
      </view>

      <view class="description" v-if="description">
        <text class="desc-text">{{ description }}</text>
      </view>
    </view>

    <view class="card-footer" v-if="showFooter">
      <view class="status" :class="statusClass">
        <text class="status-dot"></text>
        <text class="status-text">{{ statusText }}</text>
      </view>
      <view class="actions" v-if="showActions">
        <slot name="actions"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatLocation } from '@/utils/location'

const props = defineProps({
  // 用户信息
  name: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  userType: {
    type: String,
    default: ''
  },
  // 时间
  time: {
    type: String,
    default: ''
  },
  // 位置
  address: {
    type: String,
    default: ''
  },
  longitude: {
    type: Number,
    default: 0
  },
  latitude: {
    type: Number,
    default: 0
  },
  // 图片
  images: {
    type: Array,
    default: () => []
  },
  // 描述
  description: {
    type: String,
    default: ''
  },
  // 状态
  status: {
    type: String,
    default: 'pending'
  },
  // 显示控制
  showLocation: {
    type: Boolean,
    default: true
  },
  showCoordinates: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'preview'])

const statusClass = computed(() => props.status)
const statusText = computed(() => {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  }
  return map[props.status] || '未知'
})

function handleClick() {
  emit('click', props)
}

function previewImage(index) {
  emit('preview', { images: props.images, index })
}
</script>

<style lang="scss" scoped>
.message-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

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
  }
}
</style>
