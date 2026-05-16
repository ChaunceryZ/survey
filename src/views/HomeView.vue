<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { SurveyStatus } from '@/types/survey'

const router = useRouter()
const store = useSurveyStore()

const surveys = computed(() => store.surveys)

function getStatusLabel(status: SurveyStatus): string {
  const labels: Record<SurveyStatus, string> = {
    [SurveyStatus.Draft]: '草稿',
    [SurveyStatus.Published]: '已发布',
    [SurveyStatus.Closed]: '已关闭'
  }
  return labels[status]
}

function getStatusClass(status: SurveyStatus): string {
  const classes: Record<SurveyStatus, string> = {
    [SurveyStatus.Draft]: 'status-draft',
    [SurveyStatus.Published]: 'status-published',
    [SurveyStatus.Closed]: 'status-closed'
  }
  return classes[status]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function createNew(): void {
  router.push('/create')
}

function editSurvey(id: string): void {
  router.push(`/edit/${id}`)
}

function fillSurvey(id: string, event?: Event): void {
  event?.stopPropagation()
  router.push(`/fill/${id}`)
}

function viewAnalysis(id: string, event?: Event): void {
  event?.stopPropagation()
  router.push(`/analysis/${id}`)
}

function deleteSurvey(id: string, event: Event): void {
  event.stopPropagation()
  if (confirm('确定要删除这份问卷吗？')) {
    store.deleteSurvey(id)
  }
}

function duplicateSurvey(id: string, event: Event): void {
  event.stopPropagation()
  store.duplicateSurvey(id)
}
</script>

<template>
  <div class="home">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">Smart Survey</h1>
        <button class="btn-create" @click="createNew">
          <span class="icon">+</span>
          创建问卷
        </button>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <section v-if="surveys.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2>暂无问卷</h2>
          <p>点击上方按钮创建您的第一份问卷</p>
        </section>

        <div v-else class="survey-grid">
          <article
            v-for="survey in surveys"
            :key="survey.id"
            class="survey-card"
            @click="editSurvey(survey.id)"
          >
            <div class="card-header">
              <span :class="['status-badge', getStatusClass(survey.status)]">
                {{ getStatusLabel(survey.status) }}
              </span>
              <div class="card-actions">
                <button
                  v-if="survey.status === SurveyStatus.Published"
                  class="action-btn"
                  title="填写问卷"
                  @click="fillSurvey(survey.id, $event)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  v-if="survey.questions.length > 0"
                  class="action-btn"
                  title="数据分析"
                  @click="viewAnalysis(survey.id, $event)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                </button>
                <button
                  class="action-btn"
                  title="复制"
                  @click="duplicateSurvey(survey.id, $event)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
                <button
                  class="action-btn action-btn--danger"
                  title="删除"
                  @click="deleteSurvey(survey.id, $event)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <h3 class="card-title">{{ survey.title }}</h3>
            <p class="card-description">{{ survey.description || '暂无描述' }}</p>

            <div class="card-footer">
              <span class="question-count">{{ survey.questions.length }} 题</span>
              <span class="date">{{ formatDate(survey.updatedAt) }}</span>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: $spacing-md $spacing-lg;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-white;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background: $text-white;
  color: #667eea;
  font-weight: 600;
  border-radius: $radius-lg;
  transition: all $transition-fast;

  .icon {
    font-size: 1.25rem;
    font-weight: 700;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}

.main {
  padding: $spacing-2xl $spacing-md;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  color: $text-white;

  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto $spacing-lg;
    opacity: 0.5;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: $spacing-sm;
  }

  p {
    opacity: 0.7;
  }
}

.survey-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.survey-card {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  cursor: pointer;
  transition: all $transition-normal;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-xl;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.status-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: $radius-full;

  &.status-draft {
    background: rgba(107, 114, 128, 0.1);
    color: $text-secondary;
  }

  &.status-published {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.status-closed {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }
}

.card-actions {
  display: flex;
  gap: $spacing-xs;
  opacity: 0;
  transition: opacity $transition-fast;

  .survey-card:hover & {
    opacity: 1;
  }
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  color: $text-secondary;
  transition: all $transition-fast;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.1);
    color: $color-primary;
  }

  &--danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
  line-height: 1.4;
}

.card-description {
  font-size: 0.875rem;
  color: $text-secondary;
  margin-bottom: $spacing-lg;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $spacing-md;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  color: $text-muted;
}
</style>
