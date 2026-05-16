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
  (e: 'update:modelValue', value: number): void
}>()

const scaleConfig = computed(() => props.question.scaleConfig || { min: 1, max: 5 })

const scaleRange = computed(() => {
  const { min, max } = scaleConfig.value
  const range: number[] = []
  for (let i = min; i <= max; i++) {
    range.push(i)
  }
  return range
})
</script>

<template>
  <div class="scale-question">
    <div class="scale-labels">
      <span class="label-min">{{ scaleConfig.minLabel }}</span>
      <span class="label-max">{{ scaleConfig.maxLabel }}</span>
    </div>
    <div class="scale-options">
      <button
        v-for="value in scaleRange"
        :key="value"
        :class="['scale-btn', { active: modelValue === value }]"
        @click="emit('update:modelValue', value)"
      >
        {{ value }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scale-question {
  padding: $spacing-md 0;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-md;
  font-size: 0.875rem;
  color: $text-muted;
}

.scale-options {
  display: flex;
  gap: $spacing-sm;
  justify-content: space-between;
}

.scale-btn {
  flex: 1;
  max-width: 60px;
  padding: $spacing-md;
  background: $bg-white;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-lg;
  font-size: 1rem;
  font-weight: 600;
  color: $text-secondary;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba($color-primary, 0.3);
    color: $color-primary;
    transform: translateY(-2px);
  }

  &.active {
    background: $color-primary;
    border-color: $color-primary;
    color: $text-white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($color-primary, 0.3);
  }
}
</style>