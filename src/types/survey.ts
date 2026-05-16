// ============================================================
// 问卷类型定义
// ============================================================

/** 问卷问题类型 */
export type QuestionType =
  | 'radio'    // 单选题
  | 'checkbox' // 多选题
  | 'input'    // 填空题（单行文本）
  | 'textarea' // 多行文本
  | 'scale'    // 评分题
  | 'matrix'   // 矩阵题
  | 'sort'     // 排序题

/** 问卷状态枚举 */
export enum SurveyStatus {
  Draft = 'draft',       // 草稿
  Published = 'published', // 已发布
  Closed = 'closed'      // 已关闭
}

/** 问卷选项 */
export interface QuestionOption {
  /** 选项唯一标识 */
  id: string
  /** 选项显示文本 */
  label: string
  /** 选项值 */
  value: string | number
}

/** 逻辑条件操作符 */
export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'

/** 逻辑条件 */
export interface LogicCondition {
  /** 关联的问题ID */
  questionId: string
  /** 操作符 */
  operator: LogicOperator
  /** 比较值 */
  value: string | number | string[]
}

/** 问卷逻辑动作 */
export type LogicAction = 'show' | 'hide' | 'jump'

/** 问题逻辑配置 */
export interface QuestionLogic {
  /** 条件列表（所有条件都满足时触发） */
  conditions: LogicCondition[]
  /** 触发动作 */
  action: LogicAction
  /** 跳转目标问题ID（仅 jump 动作时有效） */
  targetQuestionId?: string
}

/** 验证规则类型 */
export type ValidationType = 'required' | 'min_length' | 'max_length' | 'pattern' | 'range'

/** 验证规则 */
export interface ValidationRule {
  /** 验证类型 */
  type: ValidationType
  /** 验证值（根据 type 不同含义不同） */
  value?: string | number
  /** 验证失败提示信息 */
  message: string
}

/** 评分题配置 */
export interface ScaleConfig {
  /** 最小值 */
  min: number
  /** 最大值 */
  max: number
  /** 最小值标签（如"非常不满意"） */
  minLabel?: string
  /** 最大值标签（如"非常满意"） */
  maxLabel?: string
}

/** 矩阵题行配置 */
export interface MatrixRow {
  id: string
  label: string
}

/** 矩阵题列配置 */
export interface MatrixColumn {
  id: string
  label: string
}

/** 矩阵题配置 */
export interface MatrixConfig {
  /** 行列表 */
  rows: MatrixRow[]
  /** 列列表 */
  columns: MatrixColumn[]
}

/** 问卷问题 */
export interface Question {
  /** 问题唯一标识 */
  id: string
  /** 问题类型 */
  type: QuestionType
  /** 问题标题 */
  title: string
  /** 问题描述（可选） */
  description?: string
  /** 是否必答 */
  required: boolean
  /** 选项列表（选择题/排序题使用） */
  options?: QuestionOption[]
  /** 逻辑跳转配置 */
  logic?: QuestionLogic
  /** 自定义验证规则 */
  validation?: ValidationRule
  /** 评分题配置（仅 scale 类型使用） */
  scaleConfig?: ScaleConfig
  /** 矩阵题配置（仅 matrix 类型使用） */
  matrixConfig?: MatrixConfig
}

/** 问卷设置 */
export interface SurveySettings {
  /** 是否允许保存进度 */
  allowSave: boolean
  /** 是否显示进度条 */
  showProgress: boolean
  /** 是否随机排列题目 */
  randomizeQuestions: boolean
  /** 是否随机排列选项 */
  randomizeOptions: boolean
  /** 问卷关闭日期（可选） */
  closeDate?: string
}

/** 问卷主体 */
export interface Survey {
  /** 问卷唯一标识 */
  id: string
  /** 问卷标题 */
  title: string
  /** 问卷描述 */
  description: string
  /** 问题列表 */
  questions: Question[]
  /** 问卷设置 */
  settings: SurveySettings
  /** 问卷状态 */
  status: SurveyStatus
  /** 创建时间（ISO 8601 格式） */
  createdAt: string
  /** 更新时间（ISO 8601 格式） */
  updatedAt: string
}

/** 问卷回答 */
export interface SurveyResponse {
  /** 回答唯一标识 */
  id: string
  /** 所属问卷ID */
  surveyId: string
  /** 回答内容（问题ID -> 答案） */
  answers: Record<string, unknown>
  /** 提交时间（ISO 8601 格式） */
  submittedAt: string
}

/** 问题组件 Props（用于表单组件） */
export interface QuestionProps {
  /** 问题数据 */
  question: Question
  /** 回答值（v-model） */
  modelValue: unknown
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否显示错误 */
  showError?: boolean
  /** 错误信息 */
  errorMessage?: string
}

/** 问题组件 Emits */
export interface QuestionEmits {
  (e: 'update:modelValue', value: unknown): void
}
