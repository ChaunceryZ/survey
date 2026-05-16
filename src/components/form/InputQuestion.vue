<script setup lang="ts">
import type { Question } from '@/types/survey'

interface Props {
  question: Question
  modelValue: string
  showError?: boolean
  errorMessage?: string
  textarea?: boolean
}

withDefaults(defineProps<Props>(), {
  showError: false,
  textarea: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="input-question">
    <textarea
      v-if="textarea"
      :value="modelValue"
      class="input textarea"
      placeholder="请输入您的回答..."
      rows="4"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :value="modelValue"
      type="text"
      class="input"
      placeholder="请输入您的回答..."
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped lang="scss">
.input-question {
  width: 100%;
}

.input {
  width: 100%;
  padding: $spacing-md;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-lg;
  font-size: 0.9375rem;
  transition: all $transition-fast;

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
  }

  &::placeholder {
    color: $text-muted;
  }
}

.textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}
</style>