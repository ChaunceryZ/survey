<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import type { Question } from '@/types/survey'
import * as echarts from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()

const surveyId = computed(() => route.params.id as string)
const survey = computed(() => store.getSurveyById(surveyId.value))
const responses = computed(() => store.getResponsesBySurveyId(surveyId.value))

const chartRefs = ref<Record<string, HTMLDivElement>>({})
const chartInstances: Record<string, echarts.ECharts> = {}

onMounted(() => {
  if (!survey.value) {
    router.push('/')
    return
  }
  nextTick(() => initCharts())
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(chartInstances).forEach((instance) => instance.dispose())
})

function setChartRef(questionId: string, el: unknown): void {
  if (el) {
    chartRefs.value[questionId] = el as HTMLDivElement
  }
}

function initCharts(): void {
  if (!survey.value || responses.value.length === 0) return

  survey.value.questions.forEach((q) => {
    const el = chartRefs.value[q.id]
    if (!el) return

    if (chartInstances[q.id]) {
      chartInstances[q.id].dispose()
    }

    const instance = echarts.init(el)
    chartInstances[q.id] = instance

    if (q.type === 'radio' || q.type === 'checkbox') {
      const stats = getQuestionStats(q)
      instance.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        color: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#10b981', '#f59e0b', '#ef4444'],
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '{b}\n{d}%' },
            data: stats.map((s) => ({ name: s.label, value: s.count }))
          }
        ]
      })
    } else if (q.type === 'scale') {
      const config = q.scaleConfig || { min: 1, max: 5 }
      const distribution: Record<number, number> = {}
      for (let i = config.min; i <= config.max; i++) distribution[i] = 0

      responses.value.forEach((r) => {
        const val = r.answers[q.id]
        if (typeof val === 'number' && val >= config.min && val <= config.max) {
          distribution[val]++
        }
      })

      instance.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: Object.keys(distribution),
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
        },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        series: [
          {
            type: 'bar',
            data: Object.values(distribution),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#6366f1' },
                { offset: 1, color: '#818cf8' }
              ]),
              borderRadius: [4, 4, 0, 0]
            },
            barWidth: '60%'
          }
        ]
      })
    }
  })
}

function handleResize(): void {
  Object.values(chartInstances).forEach((instance) => instance.resize())
}

const totalResponses = computed(() => responses.value.length)

const completionRate = computed(() => {
  if (!survey.value || totalResponses.value === 0) return 0
  const completed = responses.value.filter((r) => {
    return survey.value!.questions.every((q) =>
      q.required ? r.answers[q.id] !== undefined && r.answers[q.id] !== '' : true
    )
  }).length
  return Math.round((completed / totalResponses.value) * 100)
})

function getQuestionStats(
  question: Question
): { label: string; count: number; percentage: number }[] {
  if (totalResponses.value === 0) return []

  const answerCounts: Record<string, number> = {}

  if (question.options) {
    question.options.forEach((opt) => {
      answerCounts[opt.label] = 0
    })
  }

  responses.value.forEach((response) => {
    const answer = response.answers[question.id]
    if (answer === undefined || answer === null) return

    if (Array.isArray(answer)) {
      answer.forEach((val) => {
        const option = question.options?.find((o) => o.value === val)
        if (option) answerCounts[option.label]++
      })
    } else {
      const option = question.options?.find((o) => o.value === answer)
      if (option) answerCounts[option.label]++
    }
  })

  return Object.entries(answerCounts).map(([label, count]) => ({
    label,
    count,
    percentage: Math.round((count / totalResponses.value) * 100)
  }))
}

function getAverageScale(question: Question): number | null {
  if (question.type !== 'scale') return null

  const values = responses.value
    .map((r) => r.answers[question.id])
    .filter((v): v is number => typeof v === 'number')

  if (values.length === 0) return null

  return values.reduce((a, b) => a + b, 0) / values.length
}

function getMatrixRowSummary(question: Question, rowId: string): string {
  if (!question.matrixConfig) return '-'
  const counts: Record<string, number> = {}
  question.matrixConfig.columns.forEach((c) => (counts[c.label] = 0))

  responses.value.forEach((r) => {
    const answer = r.answers[question.id] as Record<string, string | number> | undefined
    if (!answer || answer[rowId] === undefined) return
    const col = question.matrixConfig!.columns.find((c) => String(c.id) === String(answer[rowId]))
    if (col) counts[col.label]++
  })

  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return max ? `${max[1]}人选择 "${max[0]}"` : '-'
}

function exportData(): void {
  const data = {
    survey: survey.value,
    responses: responses.value,
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${survey.value?.title || 'survey'}-responses.json`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatAnswerForCSV(question: Question, answer: unknown): string {
  if (answer === undefined || answer === null) return ''

  if (question.type === 'checkbox' && Array.isArray(answer)) {
    return answer
      .map((v) => {
        const opt = question.options?.find((o) => o.value === v)
        return opt ? opt.label : String(v)
      })
      .join(';')
  }

  if (question.type === 'matrix' && typeof answer === 'object' && !Array.isArray(answer)) {
    const record = answer as Record<string, string | number>
    return Object.entries(record)
      .map(([rowId, colVal]) => {
        const row = question.matrixConfig?.rows.find((r) => r.id === rowId)
        const col = question.matrixConfig?.columns.find(
          (c) => String(c.id) === String(colVal)
        )
        return `${row?.label || rowId}:${col?.label || colVal}`
      })
      .join(';')
  }

  if (question.type === 'radio') {
    const opt = question.options?.find((o) => o.value === answer)
    return opt ? opt.label : String(answer)
  }

  if (question.type === 'sort' && Array.isArray(answer)) {
    return answer
      .map((v) => {
        const opt = question.options?.find((o) => o.value === v)
        return opt ? opt.label : String(v)
      })
      .join(' > ')
  }

  return String(answer)
}

function exportCSV(): void {
  if (!survey.value || responses.value.length === 0) return

  const headers = [
    '响应ID',
    '提交时间',
    ...survey.value.questions.map((q) => q.title)
  ]

  const rows = responses.value.map((response) => {
    return [
      response.id,
      new Date(response.submittedAt).toLocaleString('zh-CN'),
      ...survey.value!.questions.map((q) =>
        escapeCSV(formatAnswerForCSV(q, response.answers[q.id]))
      )
    ]
  })

  const csvContent = [headers.map(escapeCSV).join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  )

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${survey.value.title || 'survey'}-responses.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function goBack(): void {
  router.push('/')
}
</script>

<template>
  <div class="analysis-page">
    <header class="header">
      <div class="header-content">
        <button class="btn-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <h1>数据分析</h1>
        <div class="export-actions">
          <button class="btn-export" @click="exportData">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            JSON
          </button>
          <button class="btn-export btn-export--csv" @click="exportCSV">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            CSV
          </button>
        </div>
      </div>
    </header>

    <main v-if="survey" class="main">
      <div class="container">
        <div class="survey-header">
          <h2>{{ survey.title }}</h2>
          <p>{{ survey.description }}</p>
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-value">{{ totalResponses }}</div>
            <div class="stat-label">回收数量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ survey.questions.length }}</div>
            <div class="stat-label">题目数量</div>
          </div>
        </div>

        <div v-if="responses.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          <h3>暂无数据</h3>
          <p>还没有人填写此问卷</p>
        </div>

        <div v-else class="questions-analysis">
          <div
            v-for="(question, index) in survey.questions"
            :key="question.id"
            class="question-card"
          >
            <div class="question-header">
              <span class="question-number">Q{{ index + 1 }}</span>
              <span class="question-type">{{ question.type }}</span>
            </div>
            <h3 class="question-title">{{ question.title }}</h3>

            <template v-if="question.type === 'radio' || question.type === 'checkbox'">
              <div :ref="(el: unknown) => setChartRef(question.id, el)" class="chart-container" />
            </template>

            <template v-else-if="question.type === 'scale'">
              <div class="scale-stat">
                <div class="scale-value">{{ getAverageScale(question)?.toFixed(1) || '-' }}</div>
                <div class="scale-label">
                  平均分 ({{ question.scaleConfig?.min }} - {{ question.scaleConfig?.max }})
                </div>
              </div>
              <div :ref="(el: unknown) => setChartRef(question.id, el)" class="chart-container" />
            </template>

            <template v-else-if="question.type === 'matrix' && question.matrixConfig">
              <div class="matrix-stats">
                <div
                  v-for="row in question.matrixConfig.rows"
                  :key="row.id"
                  class="matrix-row-stat"
                >
                  <span class="matrix-row-label">{{ row.label }}</span>
                  <span class="matrix-row-value">{{ getMatrixRowSummary(question, row.id) }}</span>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="text-responses">
                <div
                  v-for="(response, i) in responses.slice(0, 3)"
                  :key="i"
                  class="text-response"
                >
                  {{ response.answers[question.id] || '(未回答)' }}
                </div>
                <p v-if="responses.length > 3" class="more-responses">
                  还有 {{ responses.length - 3 }} 条回答
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.analysis-page {
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
  max-width: 1000px;
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
  }
}

h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.export-actions {
  display: flex;
  gap: $spacing-sm;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $color-primary;
  color: $text-white;
  font-weight: 500;
  border-radius: $radius-md;
  transition: all $transition-fast;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: $color-primary-hover;
  }

  &--csv {
    background: $color-success;

    &:hover {
      background: darken($color-success, 10%);
    }
  }
}

.main {
  padding: $spacing-xl $spacing-md;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.survey-header {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-xl;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: $spacing-xs;
  }

  p {
    color: $text-secondary;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: $spacing-xs;
}

.stat-label {
  font-size: 0.875rem;
  color: $text-muted;
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  background: $bg-white;
  border-radius: $radius-xl;

  svg {
    width: 64px;
    height: 64px;
    margin: 0 auto $spacing-lg;
    color: $text-muted;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: $spacing-xs;
  }

  p {
    color: $text-muted;
  }
}

.questions-analysis {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.question-card {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
}

.question-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.question-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: $color-primary;
  background: rgba($color-primary, 0.1);
  padding: 2px 8px;
  border-radius: $radius-full;
}

.question-type {
  font-size: 0.75rem;
  color: $text-muted;
}

.question-title {
  font-size: 1rem;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: $spacing-lg;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin-top: $spacing-md;
}

.scale-stat {
  text-align: center;
  padding: $spacing-lg;
  background: rgba($color-primary, 0.05);
  border-radius: $radius-lg;
}

.scale-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: $color-primary;
}

.scale-label {
  font-size: 0.875rem;
  color: $text-muted;
  margin-top: $spacing-xs;
}

.matrix-stats {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.matrix-row-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
}

.matrix-row-label {
  font-size: 0.9375rem;
  color: $text-primary;
}

.matrix-row-value {
  font-size: 0.875rem;
  color: $text-secondary;
}

.text-responses {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.text-response {
  padding: $spacing-md;
  background: $bg-secondary;
  border-radius: $radius-md;
  font-size: 0.9375rem;
  color: $text-secondary;
}

.more-responses {
  font-size: 0.875rem;
  color: $text-muted;
  text-align: center;
  margin-top: $spacing-sm;
}
</style>
