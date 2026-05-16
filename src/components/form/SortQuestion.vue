<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  (e: 'update:modelValue', value: (string | number)[]): void
}>()

const defaultOrder = computed<(string | number)[]>(() =>
  (props.question.options || []).map((o) => o.value)
)

const sortedItems = ref<(string | number)[]>(
  Array.isArray(props.modelValue) && props.modelValue.length > 0
    ? [...(props.modelValue as (string | number)[])]
    : [...defaultOrder.value]
)

watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val) && val.length > 0) {
      sortedItems.value = [...val as (string | number)[]]
    }
  }
)

let draggingIndex: number | null = null
const dragOverIndex = ref<number | null>(null)

function getOptionLabel(value: string | number): string {
  const opt = props.question.options?.find((o) => o.value === value)
  return opt ? opt.label : String(value)
}

function onDragStart(index: number, event: DragEvent): void {
  draggingIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(index: number, event: DragEvent): void {
  event.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave(): void {
  dragOverIndex.value = null
}

function onDrop(index: number): void {
  if (draggingIndex === null || draggingIndex === index) {
    draggingIndex = null
    dragOverIndex.value = null
    return
  }

  const newItems = [...sortedItems.value]
  const [moved] = newItems.splice(draggingIndex, 1)
  newItems.splice(index, 0, moved)
  sortedItems.value = newItems

  emit('update:modelValue', newItems)

  draggingIndex = null
  dragOverIndex.value = null
}

function onDragEnd(): void {
  draggingIndex = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="sort-question">
    <p class="sort-hint">拖拽选项进行排序，排在前面的优先级更高</p>
    <div class="sort-list">
      <div
        v-for="(item, index) in sortedItems"
        :key="item"
        :class="[
          'sort-item',
          {
            'sort-dragging': draggingIndex === index,
            'sort-drag-over': dragOverIndex === index && draggingIndex !== index
          }
        ]"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover="onDragOver(index, $event)"
        @dragleave="onDragLeave"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <span class="sort-grip">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </span>
        <span class="sort-number">{{ index + 1 }}</span>
        <span class="sort-label">{{ getOptionLabel(item) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sort-question {
  width: 100%;
}

.sort-hint {
  font-size: 0.8125rem;
  color: $text-muted;
  margin-bottom: $spacing-md;
}

.sort-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-lg;
  cursor: grab;
  user-select: none;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba($color-primary, 0.3);
    box-shadow: $shadow-sm;
  }

  &:active {
    cursor: grabbing;
  }

  &.sort-dragging {
    opacity: 0.4;
    border-style: dashed;
    border-color: $color-primary;
  }

  &.sort-drag-over {
    border-color: $color-primary;
    background: rgba($color-primary, 0.05);
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.sort-grip {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: $text-muted;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
  }
}

.sort-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($color-primary, 0.1);
  color: $color-primary;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: $radius-full;
  flex-shrink: 0;
}

.sort-label {
  flex: 1;
  font-size: 0.9375rem;
  color: $text-primary;
}
</style>
