<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/types/survey'

interface Props {
  question: Question
  modelValue: unknown
  showError?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  showError: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: (string | number)[]): void
}>()

const selectedValues = computed<(string | number)[]>(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

function toggleOption(value: string | number): void {
  const current = [...selectedValues.value]
  const index = current.indexOf(value)
  if (index === -1) {
    current.push(value)
  } else {
    current.splice(index, 1)
  }
  emit('update:modelValue', current)
}

function isSelected(value: string | number): boolean {
  return selectedValues.value.includes(value)
}
</script>

<template>
  <div class="checkbox-question">
    <label
      v-for="option in question.options"
      :key="option.id"
      :class="['checkbox-option', { selected: isSelected(option.value) }]"
    >
      <input
        type="checkbox"
        :value="option.value"
        :checked="isSelected(option.value)"
        class="checkbox-input"
        @change="toggleOption(option.value)"
      />
      <span class="checkbox-custom">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span class="checkbox-label">{{ option.label }}</span>
    </label>
  </div>
</template>

<style scoped lang="scss">
.checkbox-question {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba($color-primary, 0.3);
    background: rgba($color-primary, 0.02);
  }

  &.selected {
    border-color: $color-primary;
    background: rgba($color-primary, 0.05);
  }
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;
  flex-shrink: 0;

  svg {
    width: 14px;
    height: 14px;
    opacity: 0;
    transform: scale(0);
    transition: all $transition-fast;
    color: $text-white;
  }
}

.checkbox-input:checked + .checkbox-custom {
  background: $color-primary;
  border-color: $color-primary;

  svg {
    opacity: 1;
    transform: scale(1);
  }
}

.checkbox-label {
  font-size: 0.9375rem;
  color: $text-primary;
}
</style>