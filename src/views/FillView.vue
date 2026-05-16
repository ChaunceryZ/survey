<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import type { Question } from '@/types/survey'
import RadioQuestion from '@/components/form/RadioQuestion.vue'
import CheckboxQuestion from '@/components/form/CheckboxQuestion.vue'
import InputQuestion from '@/components/form/InputQuestion.vue'
import ScaleQuestion from '@/components/form/ScaleQuestion.vue'
import MatrixQuestion from '@/components/form/MatrixQuestion.vue'
import SortQuestion from '@/components/form/SortQuestion.vue'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()

const surveyId = computed(() => route.params.id as string)
const survey = computed(() => store.getSurveyById(surveyId.value))

const answers = ref<Record<string, unknown>>({})
const currentQuestionIndex = ref(0)
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

onMounted(() => {
  if (!survey.value) {
    router.push('/')
  }
})

const visibleQuestions = computed(() => {
  if (!survey.value) return []
  let questions = [...survey.value.questions]

  if (survey.value.settings.randomizeQuestions) {
    questions = questions.sort(() => Math.random() - 0.5)
  }

  return questions.filter((q) => {
    if (!q.logic) return true

    const conditionMet = q.logic.conditions.every((cond) => {
      const answer = answers.value[cond.questionId]
      switch (cond.operator) {
        case 'equals':
          return answer === cond.value
        case 'not_equals':
          return answer !== cond.value
        case 'contains':
          return Array.isArray(answer) && answer.includes(cond.value as string)
        default:
          return true
      }
    })

    if (q.logic.action === 'show') return conditionMet
    if (q.logic.action === 'hide') return !conditionMet
    return true
  })
})

const currentQuestion = computed(() => visibleQuestions.value[currentQuestionIndex.value])

const progress = computed(() => {
  if (visibleQuestions.value.length === 0) return 0
  return Math.round((currentQuestionIndex.value / visibleQuestions.value.length) * 100)
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === visibleQuestions.value.length - 1
})

function validateQuestion(question: Question): boolean {
  const answer = answers.value[question.id]

  if (question.required) {
    if (answer === undefined || answer === null || answer === '') {
      errors.value[question.id] = '请回答此问题'
      return false
    }
    if (Array.isArray(answer) && answer.length === 0) {
      errors.value[question.id] = '请至少选择一个选项'
      return false
    }
    if (question.type === 'matrix' && question.matrixConfig) {
      const matrixAnswer = answer as Record<string, string | number> | undefined
      const allRowsAnswered = question.matrixConfig.rows.every(
        (row) => matrixAnswer && matrixAnswer[row.id] !== undefined
      )
      if (!allRowsAnswered) {
        errors.value[question.id] = '请完成所有行的选择'
        return false
      }
    }
  }

  if (question.validation) {
    const { type, value, message } = question.validation
    if (type === 'min_length' && typeof answer === 'string' && answer.length < (value as number)) {
      errors.value[question.id] = message
      return false
    }
    if (type === 'max_length' && typeof answer === 'string' && answer.length > (value as number)) {
      errors.value[question.id] = message
      return false
    }
  }

  delete errors.value[question.id]
  return true
}

function next(): void {
  if (!currentQuestion.value) return

  if (!validateQuestion(currentQuestion.value)) return

  if (!isLastQuestion.value) {
    currentQuestionIndex.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function prev(): void {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function submit(): Promise<void> {
  if (!validateQuestion(currentQuestion.value)) return

  isSubmitting.value = true

  await new Promise((resolve) => setTimeout(resolve, 500))

  if (survey.value) {
    store.submitResponse(survey.value.id, answers.value)
  }

  router.push('/thanks')
}

function goHome(): void {
  router.push('/')
}
</script>

<template>
  <div class="fill-page">
    <header v-if="survey" class="header">
      <div class="header-content">
        <h1 class="title">{{ survey.title }}</h1>
        <div v-if="survey.settings.showProgress" class="progress-info">
          <span class="progress-text">{{ progress }}% 完成</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }" />
          </div>
        </div>
      </div>
    </header>

    <main v-if="survey" class="main">
      <div class="survey-container">
        <div v-if="currentQuestion" class="question-card">
          <div class="question-header">
            <span class="question-number">问题 {{ currentQuestionIndex + 1 }}</span>
            <span v-if="currentQuestion.required" class="required-hint">必填</span>
          </div>

          <h2 class="question-title">{{ currentQuestion.title }}</h2>
          <p v-if="currentQuestion.description" class="question-desc">
            {{ currentQuestion.description }}
          </p>

          <div class="question-input">
            <RadioQuestion
              v-if="currentQuestion.type === 'radio'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id]"
              :show-error="!!errors[currentQuestion.id]"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
            <CheckboxQuestion
              v-else-if="currentQuestion.type === 'checkbox'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id]"
              :show-error="!!errors[currentQuestion.id]"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
            <InputQuestion
              v-else-if="currentQuestion.type === 'input'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id] as string"
              :show-error="!!errors[currentQuestion.id]"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
            <ScaleQuestion
              v-else-if="currentQuestion.type === 'scale'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id]"
              :show-error="!!errors[currentQuestion.id]"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
            <InputQuestion
              v-else-if="currentQuestion.type === 'textarea'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id] as string"
              :show-error="!!errors[currentQuestion.id]"
              :textarea="true"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
            <MatrixQuestion
              v-else-if="currentQuestion.type === 'matrix'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id]"
              :show-error="!!errors[currentQuestion.id]"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
            <SortQuestion
              v-else-if="currentQuestion.type === 'sort'"
              :question="currentQuestion"
              :model-value="answers[currentQuestion.id]"
              :show-error="!!errors[currentQuestion.id]"
              @update:model-value="answers[currentQuestion.id] = $event"
            />
          </div>

          <p v-if="errors[currentQuestion.id]" class="error-message">
            {{ errors[currentQuestion.id] }}
          </p>
        </div>

        <div class="navigation">
          <button
            class="btn-nav btn-prev"
            :disabled="currentQuestionIndex === 0"
            @click="prev"
          >
            上一题
          </button>
          <button
            v-if="!isLastQuestion"
            class="btn-nav btn-next"
            @click="next"
          >
            下一题
          </button>
          <button
            v-else
            class="btn-nav btn-submit"
            :disabled="isSubmitting"
            @click="submit"
          >
            {{ isSubmitting ? '提交中...' : '提交问卷' }}
          </button>
        </div>

        <div class="question-dots">
          <span
            v-for="(q, index) in visibleQuestions"
            :key="q.id"
            :class="['dot', { active: index === currentQuestionIndex, answered: answers[q.id] !== undefined }]"
            @click="currentQuestionIndex = index"
          />
        </div>
      </div>
    </main>

    <footer class="footer">
      <button class="btn-home" @click="goHome">返回首页</button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.fill-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.header {
  background: $bg-white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: $spacing-lg;
}

.header-content {
  max-width: 700px;
  margin: 0 auto;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.progress-text {
  font-size: 0.875rem;
  color: $text-muted;
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $color-primary, $color-primary-light);
  border-radius: $radius-full;
  transition: width $transition-slow;
}

.main {
  padding: $spacing-xl $spacing-md;
}

.survey-container {
  max-width: 700px;
  margin: 0 auto;
}

.question-card {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
}

.question-header {
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
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-full;
}

.required-hint {
  font-size: 0.75rem;
  color: $color-danger;
}

.question-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.6;
  margin-bottom: $spacing-sm;
}

.question-desc {
  font-size: 0.9375rem;
  color: $text-secondary;
  margin-bottom: $spacing-lg;
}

.question-input {
  margin-top: $spacing-lg;
}

.error-message {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.1);
  color: $color-danger;
  font-size: 0.875rem;
  border-radius: $radius-md;
}

.navigation {
  display: flex;
  justify-content: space-between;
  gap: $spacing-md;
  margin-top: $spacing-xl;
}

.btn-nav {
  flex: 1;
  padding: $spacing-md $spacing-lg;
  font-size: 1rem;
  font-weight: 600;
  border-radius: $radius-lg;
  transition: all $transition-fast;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-prev {
  background: $bg-white;
  color: $text-secondary;
  border: 1px solid rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    background: $bg-secondary;
  }
}

.btn-next {
  background: $color-primary;
  color: $text-white;

  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }
}

.btn-submit {
  background: linear-gradient(135deg, $color-success, darken($color-success, 10%));
  color: $text-white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}

.question-dots {
  display: flex;
  justify-content: center;
  gap: $spacing-sm;
  margin-top: $spacing-xl;
  flex-wrap: wrap;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: $radius-full;
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all $transition-fast;

  &.active {
    background: $color-primary;
    transform: scale(1.2);
  }

  &.answered {
    background: rgba($color-primary, 0.4);
  }

  &:hover {
    transform: scale(1.3);
  }
}

.footer {
  padding: $spacing-xl $spacing-md;
  text-align: center;
}

.btn-home {
  color: $text-muted;
  font-size: 0.875rem;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: $text-secondary;
  }
}
</style>