<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()

const surveyId = computed(() => route.params.id as string)
const survey = computed(() => store.getSurveyById(surveyId.value))

function goBack(): void {
  router.push('/')
}
</script>

<template>
  <div class="preview-page">
    <header class="header">
      <div class="header-content">
        <h1>问卷预览</h1>
        <button class="btn-back" @click="goBack">返回编辑</button>
      </div>
    </header>

    <main v-if="survey" class="main">
      <div class="preview-container">
        <div class="preview-header">
          <h2 class="preview-title">{{ survey.title }}</h2>
          <p v-if="survey.description" class="preview-desc">{{ survey.description }}</p>
        </div>

        <div class="preview-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>预览模式 - 回答不会被保存</span>
        </div>

        <div class="preview-questions">
          <div
            v-for="(question, index) in survey.questions"
            :key="question.id"
            class="preview-question"
          >
            <div class="question-meta">
              <span class="question-number">Q{{ index + 1 }}</span>
              <span v-if="question.required" class="required-badge">必填</span>
            </div>
            <h3 class="question-title">{{ question.title }}</h3>
            <p v-if="question.description" class="question-desc">
              {{ question.description }}
            </p>

            <div class="question-placeholder">
              <template v-if="question.type === 'radio' || question.type === 'checkbox'">
                <div
                  v-for="option in question.options"
                  :key="option.id"
                  class="option-placeholder"
                >
                  <span class="option-marker" />
                  <span>{{ option.label }}</span>
                </div>
              </template>
              <template v-else-if="question.type === 'input'">
                <div class="input-placeholder">单行文本输入</div>
              </template>
              <template v-else-if="question.type === 'textarea'">
                <div class="input-placeholder textarea">多行文本输入</div>
              </template>
              <template v-else-if="question.type === 'scale'">
                <div class="scale-placeholder">
                  <span>{{ question.scaleConfig?.min || 1 }}</span>
                  <div class="scale-dots">━━━</div>
                  <span>{{ question.scaleConfig?.max || 5 }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-else class="not-found">
      <h2>问卷不存在</h2>
      <button @click="goBack">返回首页</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-page {
  min-height: 100vh;
  background: $bg-secondary;
}

.header {
  background: $bg-white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: $spacing-md $spacing-lg;

  .header-content {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.btn-back {
  padding: $spacing-sm $spacing-md;
  color: $text-secondary;
  font-weight: 500;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.main {
  padding: $spacing-xl $spacing-md;
}

.preview-container {
  max-width: 800px;
  margin: 0 auto;
}

.preview-header {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.preview-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.preview-desc {
  color: $text-secondary;
}

.preview-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: rgba($color-warning, 0.1);
  color: darken($color-warning, 15%);
  border-radius: $radius-lg;
  margin-bottom: $spacing-lg;
  font-size: 0.875rem;

  svg {
    width: 18px;
    height: 18px;
  }
}

.preview-questions {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.preview-question {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.question-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: $color-primary;
  background: rgba($color-primary, 0.1);
  padding: 2px 8px;
  border-radius: $radius-full;
}

.required-badge {
  font-size: 0.625rem;
  font-weight: 600;
  color: $color-danger;
  background: rgba($color-danger, 0.1);
  padding: 2px 6px;
  border-radius: $radius-full;
}

.question-title {
  font-size: 1rem;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.question-desc {
  font-size: 0.875rem;
  color: $text-muted;
  margin-bottom: $spacing-lg;
}

.question-placeholder {
  margin-top: $spacing-lg;
}

.option-placeholder {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm 0;
  color: $text-secondary;
}

.option-marker {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: $radius-full;
}

.input-placeholder {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  color: $text-muted;
  font-size: 0.875rem;

  &.textarea {
    min-height: 80px;
  }
}

.scale-placeholder {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  color: $text-muted;

  .scale-dots {
    flex: 1;
    text-align: center;
    letter-spacing: 2px;
  }
}

.not-found {
  text-align: center;
  padding: $spacing-2xl;

  h2 {
    margin-bottom: $spacing-lg;
    color: $text-secondary;
  }

  button {
    padding: $spacing-md $spacing-xl;
    background: $color-primary;
    color: $text-white;
    font-weight: 600;
    border-radius: $radius-lg;
  }
}
</style>