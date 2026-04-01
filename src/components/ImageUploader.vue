<template>
  <view class="image-uploader">
    <!-- 图片列表 -->
    <view class="image-list">
      <view
        class="image-item"
        v-for="(img, index) in images"
        :key="index"
      >
        <image class="image" :src="img" mode="aspectFill" @click="previewImage(index)" />
        <view class="delete-btn" v-if="!disabled" @click="deleteImage(index)">
          <text class="delete-icon">×</text>
        </view>
        <view class="upload-progress" v-if="uploading[index]">
          <text class="progress-text">{{ uploading[index] }}%</text>
        </view>
      </view>

      <!-- 上传按钮 -->
      <view
        class="upload-btn"
        v-if="!disabled && images.length < maxCount"
        @click="chooseImage"
      >
        <text class="upload-icon">＋</text>
        <text class="upload-text" v-if="showText">上传</text>
      </view>
    </view>

    <!-- 数量提示 -->
    <text class="count-tip" v-if="showTip">
      已选择 {{ images.length }}/{{ maxCount }} 张
    </text>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  // 图片列表
  images: {
    type: Array,
    default: () => []
  },
  // 最大数量
  maxCount: {
    type: Number,
    default: 9
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 显示文字
  showText: {
    type: Boolean,
    default: true
  },
  // 显示提示
  showTip: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:images', 'change', 'upload'])

const uploading = ref({})

// 选择图片
function chooseImage() {
  const count = props.maxCount - props.images.length
  if (count <= 0) {
    uni.showToast({ title: '已达最大数量', icon: 'none' })
    return
  }

  uni.chooseImage({
    count: count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const newImages = [...props.images, ...res.tempFilePaths]
      emit('update:images', newImages)
      emit('change', newImages)
    }
  })
}

// 预览图片
function previewImage(index) {
  if (uploading.value[index]) return

  uni.previewImage({
    urls: props.images,
    current: index
  })
}

// 删除图片
function deleteImage(index) {
  uni.showModal({
    title: '提示',
    content: '确定删除这张照片吗？',
    success: (res) => {
      if (res.confirm) {
        const newImages = props.images.filter((_, i) => i !== index)
        emit('update:images', newImages)
        emit('change', newImages)
      }
    }
  })
}

// 设置上传进度
function setUploadProgress(index, progress) {
  uploading.value[index] = progress
}

// 清除上传进度
function clearUploadProgress() {
  uploading.value = {}
}

defineExpose({
  setUploadProgress,
  clearUploadProgress
})
</script>

<style lang="scss" scoped>
.image-uploader {
  .image-list {
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

      .delete-icon {
        color: white;
        font-size: 18px;
        font-weight: 300;
      }
    }

    .upload-progress {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;

      .progress-text {
        color: white;
        font-size: 14px;
        font-weight: 600;
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

  .count-tip {
    display: block;
    text-align: right;
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }
}
</style>
