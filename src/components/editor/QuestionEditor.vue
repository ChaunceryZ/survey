<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  LogicAction,
  LogicOperator,
  Question,
  QuestionType,
  QuestionOption,
  ValidationType
} from '@/types/survey'

interface Props {
  question: Question
  questions: Question[]
  types: { type: QuestionType; label: string; icon: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', question: Question): void
  (e: 'cancel'): void
}>()

const validationTypes: { type: ValidationType; label: string }[] = [
  { type: 'min_length', label: '最小长度' },
  { type: 'max_length', label: '最大长度' },
  { type: 'pattern', label: '正则表达式' },
  { type: 'range', label: '数值范围' }
]

const logicOperators: { operator: LogicOperator; label: string }[] = [
  { operator: 'equals', label: '等于' },
  { operator: 'not_equals', label: '不等于' },
  { operator: 'contains', label: '包含' },
  { operator: 'greater_than', label: '大于' },
  { operator: 'less_than', label: '小于' }
]

const logicActions: { action: LogicAction; label: string }[] = [
  { action: 'show', label: '显示本题' },
  { action: 'hide', label: '隐藏本题' },
  { action: 'jump', label: '跳转到题目' }
]

function cloneQuestion(question: Question): Question {
  return JSON.parse(JSON.stringify(question)) as Question
}

const localQuestion = ref<Question>(cloneQuestion(props.question))

const availableLogicQuestions = computed(() =>
  props.questions.filter((question) => question.id !== localQuestion.value.id)
)

watch(
  () => props.question,
  (newVal) => {
    localQuestion.value = cloneQuestion(newVal)
  },
  { deep: true }
)

function addOption(): void {
  if (!localQuestion.value.options) {
    localQuestion.value.options = []
  }
  const newOption: QuestionOption = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    label: `选项 ${localQuestion.value.options.length + 1}`,
    value: String(localQuestion.value.options.length + 1)
  }
  localQuestion.value.options.push(newOption)
}

function removeOption(index: number): void {
  localQuestion.value.options?.splice(index, 1)
}

function updateOption(index: number, label: string): void {
  if (localQuestion.value.options) {
    localQuestion.value.options[index].label = label
  }
}

function addMatrixRow(): void {
  if (!localQuestion.value.matrixConfig) return
  localQuestion.value.matrixConfig.rows.push({
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    label: `行 ${localQuestion.value.matrixConfig.rows.length + 1}`
  })
}

function addMatrixColumn(): void {
  if (!localQuestion.value.matrixConfig) return
  localQuestion.value.matrixConfig.columns.push({
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    label: `列 ${localQuestion.value.matrixConfig.columns.length + 1}`
  })
}

function enableValidation(): void {
  localQuestion.value.validation = {
    type: 'min_length',
    value: 1,
    message: '回答不符合要求'
  }
}

function disableValidation(): void {
  localQuestion.value.validation = undefined
}

function enableLogic(): void {
  const firstQuestion = availableLogicQuestions.value[0]
  localQuestion.value.logic = {
    conditions: firstQuestion
      ? [
          {
            questionId: firstQuestion.id,
            operator: 'equals',
            value: ''
          }
        ]
      : [],
    action: 'show'
  }
}

function disableLogic(): void {
  localQuestion.value.logic = undefined
}

function addLogicCondition(): void {
  if (!localQuestion.value.logic) return
  const firstQuestion = availableLogicQuestions.value[0]
  if (!firstQuestion) return
  localQuestion.value.logic.conditions.push({
    questionId: firstQuestion.id,
    operator: 'equals',
    value: ''
  })
}

function removeLogicCondition(index: number): void {
  localQuestion.value.logic?.conditions.splice(index, 1)
}

function submit(): void {
  emit('update', cloneQuestion(localQuestion.value))
}

function cancel(): void {
  emit('cancel')
}
</script>

<template>
  <div class="question-editor">
    <div class="editor-content">
      <div class="form-group">
        <label class="label">问题标题</label>
        <input
          v-model="localQuestion.title"
          type="text"
          class="input"
          placeholder="输入问题内容..."
        />
      </div>

      <div class="form-group">
        <label class="label">问题描述（可选）</label>
        <input
          v-model="localQuestion.description"
          type="text"
          class="input"
          placeholder="补充说明..."
        />
      </div>

      <div class="form-row">
        <label class="checkbox-label">
          <input v-model="localQuestion.required" type="checkbox" />
          <span>必答题</span>
        </label>
      </div>

      <div
        v-if="localQuestion.type === 'input' || localQuestion.type === 'textarea' || localQuestion.type === 'scale'"
        class="form-group"
      >
        <div class="validation-header">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="!!localQuestion.validation"
              @change="($event.target as HTMLInputElement).checked ? enableValidation() : disableValidation()"
            />
            <span>自定义校验</span>
          </label>
        </div>
        <div v-if="localQuestion.validation" class="validation-grid">
          <select v-model="localQuestion.validation.type" class="input">
            <option
              v-for="item in validationTypes"
              :key="item.type"
              :value="item.type"
            >
              {{ item.label }}
            </option>
          </select>
          <input
            v-model="localQuestion.validation.value"
            type="text"
            class="input"
            placeholder="校验值，例如 6 或 1,5"
          />
          <input
            v-model="localQuestion.validation.message"
            type="text"
            class="input validation-message"
            placeholder="错误提示"
          />
        </div>
      </div>

      <div v-if="availableLogicQuestions.length > 0" class="form-group logic-config">
        <div class="validation-header">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="!!localQuestion.logic"
              @change="($event.target as HTMLInputElement).checked ? enableLogic() : disableLogic()"
            />
            <span>条件逻辑</span>
          </label>
        </div>
        <div v-if="localQuestion.logic" class="logic-content">
          <div
            v-for="(condition, conditionIndex) in localQuestion.logic.conditions"
            :key="conditionIndex"
            class="logic-condition"
          >
            <select v-model="condition.questionId" class="input">
              <option
                v-for="questionItem in availableLogicQuestions"
                :key="questionItem.id"
                :value="questionItem.id"
              >
                {{ questionItem.title || '未填写问题' }}
              </option>
            </select>
            <select v-model="condition.operator" class="input">
              <option
                v-for="item in logicOperators"
                :key="item.operator"
                :value="item.operator"
              >
                {{ item.label }}
              </option>
            </select>
            <input
              v-model="condition.value"
              type="text"
              class="input"
              placeholder="比较值"
            />
            <button
              class="btn-remove"
              :disabled="localQuestion.logic.conditions.length <= 1"
              @click="removeLogicCondition(conditionIndex)"
            >
              ×
            </button>
          </div>
          <button class="btn-add-option" @click="addLogicCondition">+ 添加条件</button>
          <div class="logic-action">
            <select v-model="localQuestion.logic.action" class="input">
              <option
                v-for="item in logicActions"
                :key="item.action"
                :value="item.action"
              >
                {{ item.label }}
              </option>
            </select>
            <select
              v-if="localQuestion.logic.action === 'jump'"
              v-model="localQuestion.logic.targetQuestionId"
              class="input"
            >
              <option value="">选择跳转目标</option>
              <option
                v-for="questionItem in availableLogicQuestions"
                :key="questionItem.id"
                :value="questionItem.id"
              >
                {{ questionItem.title || '未填写问题' }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div
        v-if="
          localQuestion.type === 'radio' ||
          localQuestion.type === 'checkbox' ||
          localQuestion.type === 'sort'
        "
        class="form-group"
      >
        <label class="label">选项</label>
        <div class="options-list">
          <div
            v-for="(option, index) in localQuestion.options"
            :key="option.id"
            class="option-item"
          >
            <span class="option-index">{{ index + 1 }}</span>
            <input
              :value="option.label"
              type="text"
              class="input option-input"
              @input="updateOption(index, ($event.target as HTMLInputElement).value)"
            />
            <button class="btn-remove" @click="removeOption(index)">×</button>
          </div>
          <button class="btn-add-option" @click="addOption">+ 添加选项</button>
        </div>
      </div>

      <div v-if="localQuestion.type === 'scale'" class="form-group">
        <label class="label">评分范围</label>
        <div class="scale-config">
          <div class="scale-field">
            <span>最小值</span>
            <input
              v-model.number="localQuestion.scaleConfig!.min"
              type="number"
              class="input scale-input"
              min="0"
              max="10"
            />
          </div>
          <div class="scale-field">
            <span>最大值</span>
            <input
              v-model.number="localQuestion.scaleConfig!.max"
              type="number"
              class="input scale-input"
              min="1"
              max="10"
            />
          </div>
        </div>
        <div class="scale-labels">
          <input
            v-model="localQuestion.scaleConfig!.minLabel"
            type="text"
            class="input"
            placeholder="最低分标签"
          />
          <input
            v-model="localQuestion.scaleConfig!.maxLabel"
            type="text"
            class="input"
            placeholder="最高分标签"
          />
        </div>
      </div>
      <div
        v-if="localQuestion.type === 'matrix' && localQuestion.matrixConfig"
        class="form-group"
      >
        <label class="label">矩阵行（评价维度）</label>
        <div class="options-list">
          <div
            v-for="(row, index) in localQuestion.matrixConfig.rows"
            :key="row.id"
            class="option-item"
          >
            <span class="option-index">{{ index + 1 }}</span>
            <input
              :value="row.label"
              type="text"
              class="input option-input"
              @input="localQuestion.matrixConfig!.rows[index].label = ($event.target as HTMLInputElement).value"
            />
            <button class="btn-remove" @click="localQuestion.matrixConfig!.rows.splice(index, 1)">
              ×
            </button>
          </div>
          <button class="btn-add-option" @click="addMatrixRow">+ 添加行</button>
        </div>
      </div>

      <div
        v-if="localQuestion.type === 'matrix' && localQuestion.matrixConfig"
        class="form-group"
      >
        <label class="label">矩阵列（选项）</label>
        <div class="options-list">
          <div
            v-for="(col, index) in localQuestion.matrixConfig.columns"
            :key="col.id"
            class="option-item"
          >
            <span class="option-index">{{ index + 1 }}</span>
            <input
              :value="col.label"
              type="text"
              class="input option-input"
              @input="localQuestion.matrixConfig!.columns[index].label = ($event.target as HTMLInputElement).value"
            />
            <button
              class="btn-remove"
              @click="localQuestion.matrixConfig!.columns.splice(index, 1)"
            >
              ×
            </button>
          </div>
          <button class="btn-add-option" @click="addMatrixColumn">+ 添加列</button>
        </div>
      </div>
    </div>

    <div class="editor-actions">
      <button class="btn-cancel" @click="cancel">取消</button>
      <button class="btn-save" @click="submit">保存</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.question-editor {
  background: rgba($color-primary, 0.05);
  border: 2px solid rgba($color-primary, 0.2);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-sm;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
}

.input {
  padding: $spacing-sm $spacing-md;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-md;
  font-size: 0.9375rem;
  transition: all $transition-fast;

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
  }
}

.form-row {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.validation-header {
  display: flex;
  align-items: center;
}

.validation-grid {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 1fr);
  gap: $spacing-sm;

  .validation-message {
    grid-column: 1 / -1;
  }
}

.logic-config {
  padding: $spacing-md;
  background: rgba($color-primary, 0.04);
  border-radius: $radius-md;
}

.logic-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.logic-condition {
  display: grid;
  grid-template-columns: minmax(160px, 1.4fr) minmax(100px, 0.8fr) minmax(100px, 1fr) auto;
  gap: $spacing-sm;
  align-items: center;
}

.logic-action {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr));
  gap: $spacing-sm;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  font-size: 0.9375rem;
  color: $text-primary;

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: $color-primary;
    cursor: pointer;
  }
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.option-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.option-index {
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
}

.option-input {
  flex: 1;
}

.btn-remove {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-muted;
  font-size: 1.25rem;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: rgba($color-danger, 0.1);
    color: $color-danger;
  }
}

.btn-add-option {
  padding: $spacing-sm;
  color: $color-primary;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: rgba($color-primary, 0.1);
  }
}

.scale-config {
  display: flex;
  gap: $spacing-lg;
}

.scale-field {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  span {
    font-size: 0.875rem;
    color: $text-secondary;
  }
}

.scale-input {
  width: 80px;
  text-align: center;
}

.scale-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
  margin-top: $spacing-sm;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.btn-cancel {
  padding: $spacing-sm $spacing-lg;
  color: $text-secondary;
  font-weight: 500;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.btn-save {
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
</style>
