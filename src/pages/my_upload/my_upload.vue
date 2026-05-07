<template>
  <div class="my-uploads-container">
    <header class="page-header">
      <div class="back-btn" @click="goBack">
        <span class="icon">‹</span> 返回
      </div>
      <h2 class="title">我的上报</h2>
      <div class="placeholder"></div>
    </header>

    <div class="list-content">
      <div v-if="uploadList.length === 0" class="empty-state">
        暂无上报数据
      </div>

      <div
        v-else
        class="upload-card"
        v-for="item in uploadList"
        :key="item.id"
        @click="goToDetail(item)"
      >
        <div class="card-header">
          <h3 class="event-title">{{ item.title || '无标题事件' }}</h3>
          <span class="status-tag" :class="getStatusClass(item.flag)">
            {{ item.flag_label }}
          </span>
        </div>

        <div class="card-body">
          <div class="tag-group">
            <span class="info-tag domain">{{ item.domain_label }}</span>
            <span class="info-tag type">{{ item.eventType_label }}</span>
            <span class="info-tag level" :class="'level-' + item.eventLevel">
              {{ item.eventLevel_label }}
            </span>
          </div>
          <div class="location-info">
            <span class="icon">📍</span>
            <span class="text">{{ item.areaNames_label }}</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="time">上报时间: {{ item.reportTime }}</span>
          <span class="arrow">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '@/utils/request'

const router = useRouter()
const uploadList = ref([])

onMounted(() => {
  loadData()
})

// 调用真实的后端接口
async function loadData() {
  try {
    // 按照您截图中的请求体结构组装参数
    const params = {
      action: "grsb",
      domain: "",
      eventLevel: "",
      eventType: "",
      flag: "",
      occurEndBetween: "",
      occurStartBetween: "",
      pageNo: 1,
      pageSize: 10,
      titleLike: ""
    }

    const res = await post('/opt-event/page', params)

    // 根据您之前提供的 txt 文件，接口成功时 status 为 200，数据在 data.records 中
    if (res && res.status === 200 && res.data) {
      uploadList.value = res.data.records || []
    } else {
      console.error('获取列表失败:', res.message)
    }
  } catch (error) {
    console.error('接口请求异常:', error)
  }
}

// 动态匹配状态颜色样式
function getStatusClass(flag) {
  // 根据接口返回的 flag 值匹配（此处按推测设定，可根据实际业务调整）
  const map = {
    '0': 'status-pending',    // 未确认
    '1': 'status-processing', // 处理中
    '2': 'status-completed'   // 已完成
  }
  return map[flag] || 'status-default'
}

function goBack() {
  router.back()
}

// 点击跳转到详情页，携带完整的事件数据
function goToDetail(item) {
  // 由于列表接口已经返回了绝大部分详细信息（包括 content, 经纬度等）
  // 我们可以将其转为 JSON 字符串存入 sessionStorage 中，供 detail.vue 读取
  sessionStorage.setItem('currentEventDetail', JSON.stringify(item))
  router.push(`/detail?id=${item.id}`)
}
</script>

<style lang="scss" scoped>
.my-uploads-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn {
    font-size: 16px;
    color: #333;
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 60px;

    .icon {
      font-size: 24px;
      margin-right: 4px;
      margin-top: -2px;
    }
  }

  .title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #333;
  }

  .placeholder {
    width: 60px;
  }
}

.list-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.upload-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.1s;

  &:active {
    transform: scale(0.98);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .event-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin: 0;
      flex: 1;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .status-tag {
      margin-left: 12px;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;

      &.status-pending { background: #fff7e6; color: #faad14; }
      &.status-processing { background: #e6f7ff; color: #1890ff; }
      &.status-completed { background: #f6ffed; color: #52c41a; }
      &.status-default { background: #f5f5f5; color: #666; }
    }
  }

  .card-body {
    margin-bottom: 16px;

    .tag-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;

      .info-tag {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        background: #f0f2f5;
        color: #5c6b77;

        &.level-1 { background: #fff1f0; color: #f5222d; } /* 一级通常红色 */
        &.level-2 { background: #fff7e6; color: #faad14; }
        &.level-3 { background: #e6f7ff; color: #1890ff; } /* 三级通常蓝色 */
      }
    }

    .location-info {
      display: flex;
      align-items: flex-start;
      font-size: 13px;
      color: #666;
      line-height: 1.5;

      .icon {
        margin-right: 4px;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed #eee;
    padding-top: 12px;

    .time {
      font-size: 12px;
      color: #999;
    }

    .arrow {
      font-size: 18px;
      color: #ccc;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
</style>
