<template>
  <div class="container">
    <div class="header-nav">
      <span class="back" @click="handleSkip">跳过/返回</span>
      <h3>上传现场照片</h3>
    </div>

    <section class="section">
      <div class="event-info">
        <p><strong>事件：</strong>{{ eventInfo.title }}</p>
        <p class="desc">请为该事件补充现场照片</p>
      </div>

      <div class="image-uploader mt-12">
        <div class="image-item" v-for="(img, index) in previewList" :key="index">
          <img class="image" :src="img" />
          <div class="delete-btn" @click="deleteImage(index)">×</div>
        </div>

        <div class="upload-btn" v-if="fileList.length < 9" @click="triggerFileSelect">
          <span class="upload-icon">＋</span>
          <span class="upload-text">选择照片</span>
        </div>
        <input
          type="file"
          ref="fileInput"
          multiple
          accept="image/*"
          style="display: none"
          @change="onFileChange"
        />
      </div>
    </section>

    <div class="submit-section">
      <button class="submit-btn" :class="{ disabled: uploading }" @click="submitImages">
        {{ uploading ? `上传中 (${successCount}/${fileList.length})...` : '确认上传' }}
      </button>
    </div>

    <div class="toast" v-if="toastShow">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { upload } from '@/utils/request' // 引入已封装的上传方法

const route = useRoute()
const router = useRouter()

const eventInfo = ref({
  id: '',
  title: '',
  content: '',
  domain: '',
  eventType: ''
})

const fileInput = ref(null)
const fileList = ref([])      // 存储真实的 File 对象用于上传
const previewList = ref([])   // 存储 blob URL 用于预览
const uploading = ref(false)
const successCount = ref(0)
const toastShow = ref(false)
const toastMessage = ref('')

onMounted(() => {
  // 从路由提取上报成功后传来的参数
  eventInfo.value = {
    id: route.query.id || '',
    title: route.query.title || '未知事件',
    content: route.query.content || '事件图片',
    domain: route.query.domain || '1',
    eventType: route.query.eventType || '101'
  }
})

function showToast(message) {
  toastMessage.value = message
  toastShow.value = true
  setTimeout(() => { toastShow.value = false }, 2000)
}

function triggerFileSelect() {
  fileInput.value.click()
}

function onFileChange(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return

  // 限制最多9张
  const remainSpace = 9 - fileList.value.length
  const toAdd = files.slice(0, remainSpace)

  toAdd.forEach(file => {
    fileList.value.push(file)
    previewList.value.push(URL.createObjectURL(file))
  })

  // 清空 input value 防止选同一张图不触发 change
  e.target.value = ''
}

function deleteImage(index) {
  fileList.value.splice(index, 1)
  // 释放内存
  URL.revokeObjectURL(previewList.value[index])
  previewList.value.splice(index, 1)
}

function handleSkip() {
  // 图片是选填项，用户可以选择跳过并返回列表页
  router.go(-2) // 因为是从列表 -> 基本信息 -> 图片上传，-2 返回列表
}

async function submitImages() {
  if (fileList.value.length === 0) {
    return showToast('请至少选择一张照片')
  }
  if (!eventInfo.value.id) {
    return showToast('事件信息缺失，无法关联图片')
  }

  uploading.value = true
  successCount.value = 0
  let failCount = 0

  // 遍历上传每一张图片（匹配 Python 脚本中 /sys-file/save 的入参逻辑）
  for (let i = 0; i < fileList.value.length; i++) {
    const file = fileList.value[i]

    // 构建表单额外数据
    const formData = {
      name: eventInfo.value.title,
      description: eventInfo.value.content,
      ext1: 'event-img', // 固定标识
      ext2: eventInfo.value.domain,
      ext3: eventInfo.value.eventType,
      reportNo: String(eventInfo.value.id) // 核心：事件ID
    }

    try {
      // 这里的 upload 方法底层使用 FormData，且没有写死 Content-Type，符合后端要求
      const res = await upload('/sys-file/save', file, formData)
      if (res && res.status === 200) {
        successCount.value++
      } else {
        failCount++
      }
    } catch (error) {
      console.error(`第 ${i + 1} 张图片上传失败:`, error)
      failCount++
    }
  }

  uploading.value = false

  if (failCount === 0) {
    showToast('全部上传成功！')
    setTimeout(() => { router.go(-2) }, 1500)
  } else {
    showToast(`上传结束：成功 ${successCount.value}，失败 ${failCount}`)
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f4f6f8;
  padding-bottom: 80px;
}
.header-nav {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  h3 { flex: 1; text-align: center; margin: 0; padding-right: 40px; font-size: 16px;}
  .back { font-size: 14px; color: #666; padding: 4px; z-index: 10;}
}
.section { background: #fff; margin-bottom: 12px; padding: 16px; }
.event-info {
  background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 16px;
  p { font-size: 14px; color: #333; margin: 0 0 6px 0; }
  .desc { font-size: 12px; color: #999; margin: 0; }
}

.mt-12 { margin-top: 12px; }
.image-uploader { display: flex; flex-wrap: wrap; gap: 10px; }
.image-item {
  position: relative; width: 80px; height: 80px; border-radius: 6px; overflow: hidden;
  .image { width: 100%; height: 100%; object-fit: cover; }
  .delete-btn {
    position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5);
    color: #fff; width: 20px; height: 20px; text-align: center;
    line-height: 20px; font-size: 14px; cursor: pointer;
  }
}
.upload-btn {
  width: 80px; height: 80px; background: #f5f5f5; border: 1px dashed #ddd; border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999;
  cursor: pointer;
  .upload-icon { font-size: 24px; }
  .upload-text { font-size: 12px; }
}

.submit-section { position: fixed; bottom: 0; left: 0; width: 100%; background: #fff; padding: 10px 16px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 10; }
.submit-btn {
  width: 100%; height: 44px; border-radius: 22px; background: #1890ff; color: #fff; border: none; font-size: 16px; font-weight: bold;
  &.disabled { opacity: 0.6; pointer-events: none; }
}
.toast { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); color: #fff; padding: 10px 20px; border-radius: 6px; z-index: 999; }
</style>