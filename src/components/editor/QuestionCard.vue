<script setup lang="ts">
import type { Question, QuestionType } from '@/types/survey'

interface Props {
  question: Question
  index: number
  isEditing: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const typeLabels: Record<QuestionType, string> = {
  radio: '单选题',
  checkbox: '多选题',
  input: '填空题',
  textarea: '多行文本',
  scale: '评分题',
  matrix: '矩阵题',
  sort: '排序题'
}
</script>

<template>
  <div :class="['question-card', { 'is-editing': isEditing }]">
    <div class="card-drag">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </div>

    <div class="card-content">
      <div class="card-header">
        <span class="question-number">Q{{ index }}</span>
        <span class="question-type">{{ typeLabels[question.type] }}</span>
        <span v-if="question.required" class="required-badge">必答</span>
      </div>
      <p class="question-title">{{ question.title || '未填写问题' }}</p>
      <p v-if="question.description" class="question-desc">{{ question.description }}</p>

      <div v-if="question.options?.length" class="options-preview">
        <span v-for="opt in question.options.slice(0, 4)" :key="opt.id" class="option-tag">
          {{ opt.label }}
        </span>
        <span v-if="question.options.length > 4" class="option-more">
          +{{ question.options.length - 4 }}
        </span>
      </div>

      <div v-if="question.type === 'scale' && question.scaleConfig" class="scale-preview">
        <span>{{ question.scaleConfig.min }}</span>
        <span class="scale-dots">━━━</span>
        <span>{{ question.scaleConfig.max }}</span>
      </div>

      <div v-if="question.type === 'matrix' && question.matrixConfig" class="matrix-preview">
        <div class="matrix-preview-header">
          <span
            v-for="col in question.matrixConfig.columns.slice(0, 4)"
            :key="col.id"
            class="matrix-col-tag"
          >
            {{ col.label }}
          </span>
          <span v-if="question.matrixConfig.columns.length > 4" class="option-more">
            +{{ question.matrixConfig.columns.length - 4 }}
          </span>
        </div>
        <div class="matrix-preview-rows">
          <span
            v-for="row in question.matrixConfig.rows.slice(0, 3)"
            :key="row.id"
            class="matrix-row-tag"
          >
            {{ row.label }}
          </span>
          <span v-if="question.matrixConfig.rows.length > 3" class="option-more">
            +{{ question.matrixConfig.rows.length - 3 }}
          </span>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <button class="action-btn" title="编辑" @click="emit('edit')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button class="action-btn action-btn--danger" title="删除" @click="emit('delete')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.question-card {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: $radius-lg;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba($color-primary, 0.3);
    box-shadow: $shadow-sm;

    .card-drag {
      opacity: 1;
    }

    .card-actions {
      opacity: 1;
    }
  }

  &.is-editing {
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
  }
}

.card-drag {
  width: 24px;
  height: 24px;
  color: $text-muted;
  cursor: grab;
  opacity: 0;
  transition: opacity $transition-fast;

  svg {
    width: 100%;
    height: 100%;
  }

  &:active {
    cursor: grabbing;
  }
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.question-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: $color-primary;
  background: rgba($color-primary, 0.1);
  padding: 2px 6px;
  border-radius: $radius-sm;
}

.question-type {
  font-size: 0.75rem;
  color: $text-muted;
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
  font-size: 0.9375rem;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.5;
}

.question-desc {
  font-size: 0.8125rem;
  color: $text-muted;
  margin-top: $spacing-xs;
}

.options-preview {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.option-tag {
  font-size: 0.75rem;
  color: $text-secondary;
  background: $bg-secondary;
  padding: 2px 8px;
  border-radius: $radius-full;
}

.option-more {
  font-size: 0.75rem;
  color: $text-muted;
  padding: 2px 8px;
}

.scale-preview {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
  font-size: 0.875rem;
  color: $text-secondary;

  .scale-dots {
    flex: 1;
    text-align: center;
    letter-spacing: 2px;
    color: $text-muted;
  }
}

.matrix-preview {
  margin-top: $spacing-sm;
  padding: $spacing-sm;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.matrix-preview-header {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-bottom: $spacing-xs;
}

.matrix-col-tag {
  font-size: 0.6875rem;
  color: $color-primary;
  background: rgba($color-primary, 0.1);
  padding: 1px 6px;
  border-radius: $radius-sm;
}

.matrix-preview-rows {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.matrix-row-tag {
  font-size: 0.6875rem;
  color: $text-secondary;
  background: $bg-white;
  padding: 1px 6px;
  border-radius: $radius-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.card-actions {
  display: flex;
  gap: $spacing-xs;
  opacity: 0;
  transition: opacity $transition-fast;
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
    background: rgba($color-primary, 0.1);
    color: $color-primary;
  }

  &--danger:hover {
    background: rgba($color-danger, 0.1);
    color: $color-danger;
  }
}
</style>