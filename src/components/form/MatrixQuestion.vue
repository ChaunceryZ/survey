<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types/survey'

interface Props {
  question: Question
  modelValue: unknown
  showError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showError: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void
}>()

const currentValue = computed<Record<string, string>>(() => {
  if (props.modelValue && typeof props.modelValue === 'object' && !Array.isArray(props.modelValue)) {
    return props.modelValue as Record<string, string>
  }
  return {}
})

function selectCell(rowId: string, colId: string): void {
  emit('update:modelValue', { ...currentValue.value, [rowId]: colId })
}

function isChecked(rowId: string, colId: string): boolean {
  const val = currentValue.value[rowId]
  if (val === undefined) return false
  return String(val) === String(colId)
}
</script>

<template>
  <div class="matrix-question">
    <div v-if="!question.matrixConfig" class="matrix-empty">
      矩阵题配置缺失
    </div>
    <div v-else class="matrix-wrapper">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="matrix-corner"></th>
            <th v-for="col in question.matrixConfig.columns" :key="col.id" class="matrix-col-header">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in question.matrixConfig.rows" :key="row.id" class="matrix-row">
            <td class="matrix-row-label">{{ row.label }}</td>
            <td
              v-for="col in question.matrixConfig.columns"
              :key="col.id"
              class="matrix-cell"
              @click="selectCell(row.id, col.id)"
            >
              <label class="radio-wrapper">
                <input
                  type="radio"
                  class="radio-input"
                  :name="`${question.id}-${row.id}`"
                  :checked="isChecked(row.id, col.id)"
                  @change="selectCell(row.id, col.id)"
                />
                <span :class="['radio-dot', { checked: isChecked(row.id, col.id) }]"></span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="showError" class="matrix-error">请完成所有行的选择</p>
  </div>
</template>

<style scoped lang="scss">
.matrix-question {
  width: 100%;
}

.matrix-empty {
  padding: $spacing-lg;
  text-align: center;
  color: $text-muted;
  font-size: 0.875rem;
}

.matrix-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.matrix-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: $radius-lg;
  overflow: hidden;
}

.matrix-corner {
  background: $bg-secondary;
  min-width: 120px;
}

.matrix-col-header {
  padding: $spacing-sm $spacing-md;
  background: $color-primary;
  color: $text-white;
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.matrix-row {
  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  &:hover {
    background: rgba($color-primary, 0.02);
  }
}

.matrix-row-label {
  padding: $spacing-sm $spacing-md;
  font-size: 0.9375rem;
  font-weight: 500;
  color: $text-primary;
  text-align: left;
  white-space: nowrap;
  background: $bg-secondary;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.matrix-cell {
  padding: $spacing-sm;
  text-align: center;
  cursor: pointer;
  transition: background $transition-fast;
  min-width: 80px;

  &:hover {
    background: rgba($color-primary, 0.05);
  }
}

.radio-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  width: 24px;
  height: 24px;
}

.radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.radio-dot {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: $radius-full;
  transition: all $transition-fast;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    background: $color-primary;
    border-radius: $radius-full;
    transform: translate(-50%, -50%) scale(0);
    transition: transform $transition-fast;
  }

  &.checked {
    border-color: $color-primary;

    &::after {
      transform: translate(-50%, -50%) scale(1);
    }
  }
}

.matrix-error {
  margin-top: $spacing-xs;
  font-size: 0.8125rem;
  color: $color-danger;
}

@media (max-width: #{$breakpoint-sm}) {
  .matrix-col-header {
    padding: $spacing-xs $spacing-sm;
    font-size: 0.75rem;
  }

  .matrix-row-label {
    padding: $spacing-xs $spacing-sm;
    font-size: 0.8125rem;
  }

  .matrix-cell {
    padding: $spacing-xs;
    min-width: 60px;
  }

  .radio-dot {
    width: 18px;
    height: 18px;

    &::after {
      width: 8px;
      height: 8px;
    }
  }
}
</style>
