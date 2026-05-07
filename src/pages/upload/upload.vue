<template>
  <div class="container">
    <section class="section">
      <div class="section-header">
        <span class="icon">📋</span>
        <span class="title">基本信息</span>
      </div>

      <div class="form-group">
        <van-field
          v-model="formData.title"
          label="事件标题"
          placeholder="请输入事件标题"
          required
          input-align="right"
        />

        <van-field
          v-model="fieldDisplay.domain"
          is-link
          readonly
          label="所属领域"
          placeholder="请选择领域"
          required
          input-align="right"
          @click="showPicker.domain = true"
        />

        <van-field
          v-model="fieldDisplay.eventType"
          is-link
          readonly
          label="事件类别"
          placeholder="请选择事件类别"
          required
          input-align="right"
          @click="showPicker.eventType = true"
        />

        <van-field
          v-model="fieldDisplay.eventLevel"
          is-link
          readonly
          label="事件等级"
          placeholder="请选择事件等级"
          required
          input-align="right"
          @click="showPicker.eventLevel = true"
        />
      </div>
    </section>

    <van-popup v-model:show="showPicker.domain" position="bottom">
      <van-picker
        :columns="dictColumns.domain"
        @confirm="onConfirmDomain"
        @cancel="showPicker.domain = false"
      />
    </van-popup>

    <van-popup v-model:show="showPicker.eventType" position="bottom">
      <van-picker
        :columns="dictColumns.eventType"
        @confirm="onConfirmEventType"
        @cancel="showPicker.eventType = false"
      />
    </van-popup>

    <van-popup v-model:show="showPicker.eventLevel" position="bottom">
      <van-picker
        :columns="dictColumns.eventLevel"
        @confirm="onConfirmEventLevel"
        @cancel="showPicker.eventLevel = false"
      />
    </van-popup>

    <section class="section">
      <div class="section-header">
        <span class="icon">📍</span>
        <span class="title">时空信息</span>
      </div>

      <div class="form-group">
        <div class="form-item">
          <span class="label">发生时间(起)</span>
          <input type="datetime-local" class="input-control" v-model="formData.occurStart" />
        </div>

        <div class="form-item">
          <span class="label">发生时间(止)</span>
          <input type="datetime-local" class="input-control" v-model="formData.occurEnd" />
        </div>

        <div class="form-item" @click="showPicker.area = true">
          <span class="label">事件区域</span>
          <input
            class="input-control"
            v-model="fieldDisplay.area"
            placeholder="请选择事件区域"
            readonly
          />
        </div>
      </div>

      <div class="location-card" @click="getLocation">
        <div class="location-info" v-if="formData.latitude">
          <p class="address">{{ formData.address || '已获取位置' }}</p>
          <p class="coordinates">
            经度: {{ formData.longitude.toFixed(6) }} | 纬度: {{ formData.latitude.toFixed(6) }}
          </p>
        </div>
        <div class="location-placeholder" v-else>
          <p class="placeholder-text">点击获取当前位置(经纬度)</p>
        </div>
        <span class="arrow">›</span>
      </div>
    </section>

    <van-popup v-model:show="showPicker.area" position="bottom">
      <van-cascader
        v-model="formData.areaCode"
        title="请选择事件区域"
        :options="areaTreeOptions"
        :field-names="{ text: 'label', value: 'value', children: 'children' }"
        @close="showPicker.area = false"
        @finish="onFinishArea"
        @change="onChangeArea"
      />
    </van-popup>

    <section class="section">
      <div class="section-header">
        <span class="icon">📝</span>
        <span class="title">事件详情</span>
      </div>

      <textarea
        class="textarea"
        v-model="formData.content"
        placeholder="请详细描述管网问题的具体情况..."
        maxlength="500"
      />
      <span class="char-count">{{ formData.content.length }}/500</span>

      <div class="image-uploader mt-12">
        <div class="image-item" v-for="(img, index) in images" :key="index">
          <img class="image" :src="img" @click="previewImage(index)" />
          <div class="delete-btn" @click="deleteImage(index)">×</div>
        </div>
        <div class="upload-btn" v-if="images.length < 9" @click="chooseImage">
          <span class="upload-icon">＋</span>
          <span class="upload-text">上传照片</span>
        </div>
      </div>
    </section>

    <div class="submit-section">
      <button class="submit-btn" :class="{ disabled: submitting }" @click="handleSubmit">
        {{ submitting ? '提交中...' : '立即上报' }}
      </button>
    </div>

    <div class="toast" v-if="toastShow">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { post, get } from '@/utils/request'
import { getCurrentLocation } from '@/utils/location'

const router = useRouter()

const formData = ref({
  title: '',
  content: '',
  domain: '',
  eventType: '',
  eventLevel: '',
  areaCode: '',
  address: '',
  latitude: 0,
  longitude: 0,
  occurStart: '',
  occurEnd: ''
})

const images = ref([])
const submitting = ref(false)
const toastShow = ref(false)
const toastMessage = ref('')

const fieldDisplay = ref({
  domain: '',
  eventType: '',
  eventLevel: '',
  area: ''
})

const showPicker = ref({
  domain: false,
  eventType: false,
  eventLevel: false,
  area: false
})

const dictColumns = ref({
  domain: [],
  eventType: [],
  eventLevel: []
})

const areaTreeOptions = ref([])

onMounted(() => {
  loadAllDicts()
  setDefaultTime()
  loadAreaTree()
})

async function fetchDict(dictCode) {
  try {
    const res = await post('/sys-dict/listDictItem', { dictCode })
    if (res.status === 200 && res.data) {
      return res.data
    }
    return []
  } catch (error) {
    console.error(`获取字典 ${dictCode} 失败`, error)
    return []
  }
}

async function loadAllDicts() {
  try {
    const domainRes = await fetchDict('DOMAIN')
    const eventTypeRes = await fetchDict('EVENT_TYPE')
    const eventLevelRes = await fetchDict('EVENT_LEVEL')

    dictColumns.value.domain = domainRes.map(item => ({ text: item.itemText, value: item.itemValue }))
    dictColumns.value.eventType = eventTypeRes.map(item => ({ text: item.itemText, value: item.itemValue }))
    dictColumns.value.eventLevel = eventLevelRes.map(item => ({ text: item.itemText, value: item.itemValue }))
  } catch (error) {
    console.error('加载字典失败:', error)
  }
}

function cleanChildren(data) {
  if (!data || data.length === 0) return
  data.forEach(item => {
    if (item.children && item.children.length === 0) {
      delete item.children
    } else if (item.children && item.children.length > 0) {
      cleanChildren(item.children)
    }
  })
}

async function loadAreaTree() {
  try {
    const res = await get('/sys-area/getMyTree')
    if (res.status === 200 && res.data) {
      const treeData = res.data
      cleanChildren(treeData)
      areaTreeOptions.value = treeData
    }
  } catch (error) {
    console.error('获取区域结构失败', error)
  }
}

const onConfirmDomain = ({ selectedOptions }) => {
  formData.value.domain = selectedOptions[0].value
  fieldDisplay.value.domain = selectedOptions[0].text
  showPicker.value.domain = false
}

const onConfirmEventType = ({ selectedOptions }) => {
  formData.value.eventType = selectedOptions[0].value
  fieldDisplay.value.eventType = selectedOptions[0].text
  showPicker.value.eventType = false
}

const onConfirmEventLevel = ({ selectedOptions }) => {
  formData.value.eventLevel = selectedOptions[0].value
  fieldDisplay.value.eventLevel = selectedOptions[0].text
  showPicker.value.eventLevel = false
}

const onChangeArea = ({ selectedOptions }) => {
  if (selectedOptions.length > 0) {
    fieldDisplay.value.area = selectedOptions.map(option => option.label).join('/')
    formData.value.areaCode = selectedOptions[selectedOptions.length - 1].value
  }
}

const onFinishArea = ({ selectedOptions }) => {
  showPicker.value.area = false
  fieldDisplay.value.area = selectedOptions.map(option => option.label).join('/')
  formData.value.areaCode = selectedOptions[selectedOptions.length - 1].value
}

function showToast(message) {
  toastMessage.value = message
  toastShow.value = true
  setTimeout(() => { toastShow.value = false }, 2000)
}

function setDefaultTime() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  formData.value.occurStart = now.toISOString().slice(0, 16)
}

async function getLocation() {
  try {
    const loc = await getCurrentLocation()
    formData.value.latitude = loc.latitude
    formData.value.longitude = loc.longitude
  } catch (e) {
    showToast('定位失败，请检查权限')
  }
}

function chooseImage() { /* ... */ }
function previewImage(index) { /* ... */ }
function deleteImage(index) {
  if (confirm('确定删除吗？')) images.value.splice(index, 1)
}

async function handleSubmit() {
  if (!formData.value.title) return showToast('请输入事件标题')
  if (!formData.value.domain) return showToast('请选择领域')
  if (!formData.value.eventType) return showToast('请选择事件类别')
  if (!formData.value.areaCode) return showToast('请选择事件区域')
  if (!formData.value.latitude) return showToast('请获取位置信息')

  submitting.value = true

  try {
    const payload = { ...formData.value }
    if (payload.occurStart) {
      payload.occurStart = payload.occurStart.replace('T', ' ') + ':00'
    }
    if (payload.occurEnd) {
      payload.occurEnd = payload.occurEnd.replace('T', ' ') + ':00'
    } else {
      payload.occurEnd = null
    }

    const res = await post('/opt-event/save', payload)

    if (res.status === 200) {
      showToast('上报成功')
      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      showToast(res.message || '上报失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
    showToast('网络或服务器异常')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f4f6f8;
  padding-bottom: 80px;
}

.section {
  background: #fff;
  margin-bottom: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  .icon { margin-right: 6px; }
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;

  &:last-child { border-bottom: none; }

  .label {
    width: 90px;
    font-size: 14px;
    color: #333;
    .required { color: red; margin-left: 2px; }
  }

  .input-control {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    text-align: right;
    color: #333;

    &::placeholder { color: #999; }
  }
}

.location-card {
  margin-top: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .address { font-size: 14px; color: #333; font-weight: 500;}
  .coordinates { font-size: 12px; color: #1890ff; margin-top: 4px; }
  .placeholder-text { font-size: 14px; color: #999; }
  .arrow { color: #ccc; font-size: 20px; }
}

.textarea {
  width: 100%;
  height: 100px;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  resize: none;
  outline: none;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.mt-12 { margin-top: 12px; }
.image-uploader { display: flex; flex-wrap: wrap; gap: 10px; }
.image-item {
  position: relative; width: 80px; height: 80px; border-radius: 6px; overflow: hidden;
  .image { width: 100%; height: 100%; object-fit: cover; }
  .delete-btn { position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5); color: #fff; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 14px; }
}
.upload-btn {
  width: 80px; height: 80px; background: #f5f5f5; border: 1px dashed #ddd; border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999;
  .upload-icon { font-size: 24px; }
  .upload-text { font-size: 12px; }
}

.submit-section {
  position: fixed; bottom: 0; left: 0; width: 100%; background: #fff; padding: 10px 16px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 10;
}
.submit-btn {
  width: 100%; height: 44px; border-radius: 22px; background: #1890ff; color: #fff; border: none; font-size: 16px; font-weight: bold;
  &.disabled { opacity: 0.6; pointer-events: none; }
}

.toast {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); color: #fff; padding: 10px 20px; border-radius: 6px; z-index: 999;
}
</style>