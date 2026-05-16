<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import type { Question, QuestionType, Survey } from '@/types/survey'
import QuestionEditor from '@/components/editor/QuestionEditor.vue'
import QuestionCard from '@/components/editor/QuestionCard.vue'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()

const surveyId = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => !!surveyId.value)

const survey = ref<Partial<Survey>>({
  title: '',
  description: '',
  questions: [],
  settings: {
    allowSave: true,
    showProgress: true,
    randomizeQuestions: false,
    randomizeOptions: false
  }
})

const questionTypes: { type: QuestionType; label: string; icon: string }[] = [
  { type: 'radio', label: '单选题', icon: '○' },
  { type: 'checkbox', label: '多选题', icon: '☑' },
  { type: 'input', label: '填空题', icon: '✎' },
  { type: 'textarea', label: '多行文本', icon: '☰' },
  { type: 'scale', label: '评分题', icon: '★' },
  { type: 'matrix', label: '矩阵题', icon: '▦' },
  { type: 'sort', label: '排序题', icon: '⇅' }
]

const showQuestionTypes = ref(false)
const editingQuestion = ref<Question | null>(null)
const draggedIndex = ref<number | null>(null)

onMounted(() => {
  if (surveyId.value) {
    const existing = store.getSurveyById(surveyId.value)
    if (existing) {
      survey.value = { ...existing }
    } else {
      router.push('/')
    }
  }
})

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function addQuestion(type: QuestionType): void {
  const defaultOptions =
    type === 'radio' || type === 'checkbox' || type === 'sort'
      ? [
          { id: generateId(), label: '选项 1', value: '1' },
          { id: generateId(), label: '选项 2', value: '2' }
        ]
      : undefined

  const newQuestion: Question = {
    id: generateId(),
    type,
    title: '',
    required: false,
    options: defaultOptions,
    scaleConfig:
      type === 'scale'
        ? {
            min: 1,
            max: 5,
            minLabel: '非常不满意',
            maxLabel: '非常满意'
          }
        : undefined,
    matrixConfig:
      type === 'matrix'
        ? {
            rows: [
              { id: generateId(), label: '行 1' },
              { id: generateId(), label: '行 2' }
            ],
            columns: [
              { id: generateId(), label: '非常不同意' },
              { id: generateId(), label: '不同意' },
              { id: generateId(), label: '一般' },
              { id: generateId(), label: '同意' },
              { id: generateId(), label: '非常同意' }
            ]
          }
        : undefined
  }

  survey.value.questions?.push(newQuestion)
  editingQuestion.value = newQuestion
  showQuestionTypes.value = false
}

function updateQuestion(index: number, question: Question): void {
  if (survey.value.questions) {
    survey.value.questions[index] = question
  }
  editingQuestion.value = null
}

function deleteQuestion(index: number): void {
  if (survey.value.questions) {
    survey.value.questions.splice(index, 1)
  }
}

function handleDragStart(index: number): void {
  draggedIndex.value = index
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
}

function handleDrop(targetIndex: number): void {
  if (draggedIndex.value === null || !survey.value.questions) return
  if (draggedIndex.value === targetIndex) return

  const questions = [...survey.value.questions]
  const [removed] = questions.splice(draggedIndex.value, 1)
  questions.splice(targetIndex, 0, removed)
  survey.value.questions = questions
  draggedIndex.value = null
}

function saveSurvey(): void {
  if (!survey.value.title?.trim()) {
    alert('请输入问卷标题')
    return
  }

  if (isEditing.value && surveyId.value) {
    store.updateSurvey(surveyId.value, survey.value)
  } else {
    store.createSurvey(survey.value)
  }

  router.push('/')
}

function publishSurvey(): void {
  if (!survey.value.title?.trim()) {
    alert('请输入问卷标题')
    return
  }

  if (!survey.value.questions?.length) {
    alert('请至少添加一个问题')
    return
  }

  let newSurvey: Survey
  if (isEditing.value && surveyId.value) {
    store.updateSurvey(surveyId.value, survey.value)
    const updated = store.getSurveyById(surveyId.value)
    if (updated) {
      store.publishSurvey(surveyId.value)
      newSurvey = updated
    } else {
      return
    }
  } else {
    newSurvey = store.createSurvey(survey.value)
    store.publishSurvey(newSurvey.id)
  }

  router.push('/')
}

function goBack(): void {
  router.push('/')
}
</script>

<template>
  <div class="editor">
    <header class="header">
      <div class="header-content">
        <button class="btn-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div class="header-actions">
          <button class="btn-secondary" @click="saveSurvey">保存草稿</button>
          <button class="btn-primary" @click="publishSurvey">发布问卷</button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="editor-container">
        <div class="survey-info">
          <input
            v-model="survey.title"
            type="text"
            class="title-input"
            placeholder="输入问卷标题..."
          />
          <textarea
            v-model="survey.description"
            class="description-input"
            placeholder="问卷描述（可选）..."
            rows="2"
          />
        </div>

        <div class="questions-section">
          <h2 class="section-title">
            问题列表
            <span class="count">({{ survey.questions?.length || 0 }})</span>
          </h2>

          <div class="questions-list">
            <div
              v-for="(question, index) in survey.questions"
              :key="question.id"
              class="question-wrapper"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragover="handleDragOver"
              @drop="handleDrop(index)"
            >
              <QuestionCard
                :question="question"
                :index="index + 1"
                :is-editing="editingQuestion?.id === question.id"
                @edit="editingQuestion = question"
                @delete="deleteQuestion(index)"
              />
              <QuestionEditor
                v-if="editingQuestion?.id === question.id"
                :question="question"
                :types="questionTypes"
                @update="updateQuestion(index, $event)"
                @cancel="editingQuestion = null"
              />
            </div>
          </div>

          <div class="add-question">
            <button class="add-btn" @click="showQuestionTypes = !showQuestionTypes">
              <span class="icon">+</span>
              添加问题
            </button>
            <div v-if="showQuestionTypes" class="question-types">
              <button
                v-for="qt in questionTypes"
                :key="qt.type"
                class="type-btn"
                @click="addQuestion(qt.type)"
              >
                <span class="type-icon">{{ qt.icon }}</span>
                <span class="type-label">{{ qt.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <aside class="settings-panel">
          <h3 class="panel-title">问卷设置</h3>
          <div class="setting-item">
            <label class="checkbox-label">
              <input v-model="survey.settings!.allowSave" type="checkbox" />
              <span>允许保存进度</span>
            </label>
          </div>
          <div class="setting-item">
            <label class="checkbox-label">
              <input v-model="survey.settings!.showProgress" type="checkbox" />
              <span>显示进度条</span>
            </label>
          </div>
          <div class="setting-item">
            <label class="checkbox-label">
              <input v-model="survey.settings!.randomizeQuestions" type="checkbox" />
              <span>随机排列题目</span>
            </label>
          </div>
          <div class="setting-item">
            <label class="checkbox-label">
              <input v-model="survey.settings!.randomizeOptions" type="checkbox" />
              <span>随机排列选项</span>
            </label>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.editor {
  min-height: 100vh;
  background: $bg-secondary;
}

.header {
  background: $bg-white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
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

.btn-back {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  color: $text-secondary;
  font-weight: 500;
  border-radius: $radius-md;
  transition: all $transition-fast;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: $text-primary;
  }
}

.header-actions {
  display: flex;
  gap: $spacing-md;
}

.btn-secondary {
  padding: $spacing-sm $spacing-lg;
  background: $bg-secondary;
  color: $text-primary;
  font-weight: 600;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: darken($bg-secondary, 5%);
  }
}

.btn-primary {
  padding: $spacing-sm $spacing-lg;
  background: $color-primary;
  color: $text-white;
  font-weight: 600;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: $color-primary-hover;
  }
}

.main {
  padding: $spacing-xl $spacing-md;
}

.editor-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: $spacing-xl;

  @media (max-width: $breakpoint-lg) {
    grid-template-columns: 1fr;
  }
}

.survey-info {
  grid-column: 1 / -1;
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  box-shadow: $shadow-sm;
}

.title-input {
  width: 100%;
  font-size: 1.5rem;
  font-weight: 600;
  border: none;
  outline: none;
  background: transparent;
  margin-bottom: $spacing-md;

  &::placeholder {
    color: $text-muted;
  }
}

.description-input {
  width: 100%;
  font-size: 1rem;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  color: $text-secondary;

  &::placeholder {
    color: $text-muted;
  }
}

.questions-section {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  box-shadow: $shadow-sm;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: $spacing-lg;
  color: $text-primary;

  .count {
    color: $text-muted;
    font-weight: 400;
  }
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.question-wrapper {
  position: relative;
}

.add-question {
  margin-top: $spacing-lg;
  position: relative;
}

.add-btn {
  width: 100%;
  padding: $spacing-md;
  border: 2px dashed rgba($color-primary, 0.3);
  border-radius: $radius-lg;
  color: $color-primary;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  transition: all $transition-fast;

  .icon {
    font-size: 1.25rem;
  }

  &:hover {
    border-color: $color-primary;
    background: rgba($color-primary, 0.05);
  }
}

.question-types {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: $spacing-sm;
  background: $bg-white;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  padding: $spacing-md;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: $spacing-sm;
  z-index: 10;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-md;
  border-radius: $radius-md;
  transition: all $transition-fast;

  .type-icon {
    font-size: 1.5rem;
  }

  .type-label {
    font-size: 0.875rem;
    color: $text-secondary;
  }

  &:hover {
    background: rgba($color-primary, 0.1);

    .type-label {
      color: $color-primary;
    }
  }
}

.settings-panel {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
  height: fit-content;
  position: sticky;
  top: 80px;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: $spacing-lg;
  color: $text-primary;
}

.setting-item {
  margin-bottom: $spacing-md;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  font-size: 0.9375rem;
  color: $text-secondary;

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: $color-primary;
    cursor: pointer;
  }
}
</style>