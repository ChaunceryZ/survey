<script setup lang="ts">
import type { Question } from '@/types/survey'

interface Props {
  question: Question
  modelValue: unknown
  showError?: boolean
  errorMessage?: string
}

withDefaults(defineProps<Props>(), {
  showError: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()
</script>

<template>
  <div class="radio-question">
    <label
      v-for="option in question.options"
      :key="option.id"
      class="radio-option"
    >
      <input
        type="radio"
        :name="question.id"
        :value="option.value"
        :checked="modelValue === option.value"
        class="radio-input"
        @change="emit('update:modelValue', option.value)"
      />
      <span class="radio-custom" />
      <span class="radio-label">{{ option.label }}</span>
    </label>
  </div>
</template>

<style scoped lang="scss">
.radio-question {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.radio-option {
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

  &:has(.radio-input:checked) {
    border-color: $color-primary;
    background: rgba($color-primary, 0.05);
  }
}

.radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: $radius-full;
  position: relative;
  transition: all $transition-fast;
  flex-shrink: 0;

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
}

.radio-input:checked + .radio-custom {
  border-color: $color-primary;

  &::after {
    transform: translate(-50%, -50%) scale(1);
  }
}

.radio-label {
  font-size: 0.9375rem;
  color: $text-primary;
}
</style>