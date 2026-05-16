import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Survey, Question, SurveyResponse } from '@/types/survey'
import { SurveyStatus as Status } from '@/types/survey'

const STORAGE_KEY = 'smart-survey-list'
const RESPONSES_KEY = 'smart-survey-responses'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T
}

function isSurveyExpired(survey: Survey): boolean {
  if (!survey.settings.closeDate) return false
  const closeTime = new Date(survey.settings.closeDate).getTime()
  return Number.isFinite(closeTime) && Date.now() > closeTime
}

function cloneQuestionsForDuplicate(questions: Question[]): Question[] {
  const questionIdMap = new Map<string, string>()

  questions.forEach((question) => {
    questionIdMap.set(question.id, generateId())
  })

  return questions.map((question) => {
    const cloned = cloneData(question)
    cloned.id = questionIdMap.get(question.id) || generateId()

    if (cloned.options) {
      cloned.options = cloned.options.map((option) => ({
        ...option,
        id: generateId()
      }))
    }

    if (cloned.matrixConfig) {
      cloned.matrixConfig = {
        rows: cloned.matrixConfig.rows.map((row) => ({
          ...row,
          id: generateId()
        })),
        columns: cloned.matrixConfig.columns.map((column) => ({
          ...column,
          id: generateId()
        }))
      }
    }

    if (cloned.logic) {
      cloned.logic = {
        ...cloned.logic,
        conditions: cloned.logic.conditions.map((condition) => ({
          ...condition,
          questionId: questionIdMap.get(condition.questionId) || condition.questionId
        })),
        targetQuestionId: cloned.logic.targetQuestionId
          ? questionIdMap.get(cloned.logic.targetQuestionId) || cloned.logic.targetQuestionId
          : undefined
      }
    }

    return cloned
  })
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useSurveyStore = defineStore('survey', () => {
  // State
  const surveys = ref<Survey[]>(loadFromStorage(STORAGE_KEY, []))
  const currentSurvey = ref<Survey | null>(null)
  const responses = ref<SurveyResponse[]>(loadFromStorage(RESPONSES_KEY, []))

  // Getters
  const draftSurveys = computed(() =>
    surveys.value.filter((s) => s.status === Status.Draft)
  )

  const publishedSurveys = computed(() =>
    surveys.value.filter((s) => s.status === Status.Published)
  )

  const closedSurveys = computed(() =>
    surveys.value.filter((s) => s.status === Status.Closed)
  )

  const getSurveyById = computed(() => (id: string) =>
    surveys.value.find((s) => s.id === id)
  )

  const getResponsesBySurveyId = computed(
    () => (surveyId: string) =>
      responses.value.filter((r) => r.surveyId === surveyId)
  )

  // Actions
  function createSurvey(data: Partial<Survey> = {}): Survey {
    const now = new Date().toISOString()
    const clonedData = cloneData(data)
    const survey: Survey = {
      id: generateId(),
      title: clonedData.title || '未命名问卷',
      description: clonedData.description || '',
      questions: clonedData.questions || [],
      settings: clonedData.settings || {
        allowSave: true,
        showProgress: true,
        randomizeQuestions: false,
        randomizeOptions: false
      },
      status: Status.Draft,
      createdAt: now,
      updatedAt: now
    }
    surveys.value.push(survey)
    saveToStorage(STORAGE_KEY, surveys.value)
    return survey
  }

  function updateSurvey(id: string, data: Partial<Survey>): Survey | null {
    const index = surveys.value.findIndex((s) => s.id === id)
    if (index === -1) return null

    const clonedData = cloneData(data)
    surveys.value[index] = {
      ...surveys.value[index],
      ...clonedData,
      id: surveys.value[index].id,
      createdAt: surveys.value[index].createdAt,
      updatedAt: new Date().toISOString()
    }
    saveToStorage(STORAGE_KEY, surveys.value)

    if (currentSurvey.value?.id === id) {
      currentSurvey.value = surveys.value[index]
    }

    return surveys.value[index]
  }

  function deleteSurvey(id: string): boolean {
    const index = surveys.value.findIndex((s) => s.id === id)
    if (index === -1) return false

    surveys.value.splice(index, 1)
    saveToStorage(STORAGE_KEY, surveys.value)

    if (currentSurvey.value?.id === id) {
      currentSurvey.value = null
    }

    return true
  }

  function duplicateSurvey(id: string): Survey | null {
    const original = surveys.value.find((s) => s.id === id)
    if (!original) return null

    return createSurvey({
      description: original.description,
      questions: cloneQuestionsForDuplicate(original.questions),
      settings: cloneData(original.settings),
      title: `${original.title} (副本)`,
      status: Status.Draft
    })
  }

  function publishSurvey(id: string): Survey | null {
    return updateSurvey(id, { status: Status.Published })
  }

  function closeSurvey(id: string): Survey | null {
    return updateSurvey(id, { status: Status.Closed })
  }

  function addQuestion(surveyId: string, question: Partial<Question>): Question | null {
    const survey = surveys.value.find((s) => s.id === surveyId)
    if (!survey) return null

    const newQuestion: Question = {
      id: generateId(),
      type: question.type || 'radio',
      title: question.title || '新问题',
      description: question.description,
      required: question.required ?? false,
      options: question.options,
      logic: question.logic,
      validation: question.validation,
      scaleConfig: question.scaleConfig,
      matrixConfig: question.matrixConfig
    }

    survey.questions.push(newQuestion)
    saveToStorage(STORAGE_KEY, surveys.value)
    return newQuestion
  }

  function updateQuestion(
    surveyId: string,
    questionId: string,
    data: Partial<Question>
  ): Question | null {
    const survey = surveys.value.find((s) => s.id === surveyId)
    if (!survey) return null

    const qIndex = survey.questions.findIndex((q) => q.id === questionId)
    if (qIndex === -1) return null

    survey.questions[qIndex] = { ...survey.questions[qIndex], ...data }
    survey.updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEY, surveys.value)
    return survey.questions[qIndex]
  }

  function deleteQuestion(surveyId: string, questionId: string): boolean {
    const survey = surveys.value.find((s) => s.id === surveyId)
    if (!survey) return false

    const qIndex = survey.questions.findIndex((q) => q.id === questionId)
    if (qIndex === -1) return false

    survey.questions.splice(qIndex, 1)
    survey.updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEY, surveys.value)
    return true
  }

  function reorderQuestions(surveyId: string, questionIds: string[]): boolean {
    const survey = surveys.value.find((s) => s.id === surveyId)
    if (!survey) return false

    const questionMap = new Map(survey.questions.map((q) => [q.id, q]))
    survey.questions = questionIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Question => q !== undefined)

    survey.updatedAt = new Date().toISOString()
    saveToStorage(STORAGE_KEY, surveys.value)
    return true
  }

  function submitResponse(surveyId: string, answers: Record<string, unknown>): SurveyResponse | null {
    const survey = surveys.value.find((s) => s.id === surveyId)
    if (!survey) return null
    if (survey.status !== Status.Published || isSurveyExpired(survey)) return null

    const response: SurveyResponse = {
      id: generateId(),
      surveyId,
      answers: cloneData(answers),
      submittedAt: new Date().toISOString()
    }

    responses.value.push(response)
    saveToStorage(RESPONSES_KEY, responses.value)
    return response
  }

  function setCurrentSurvey(id: string | null): void {
    if (id === null) {
      currentSurvey.value = null
    } else {
      currentSurvey.value = surveys.value.find((s) => s.id === id) || null
    }
  }

  return {
    // State
    surveys,
    currentSurvey,
    responses,
    // Getters
    draftSurveys,
    publishedSurveys,
    closedSurveys,
    getSurveyById,
    getResponsesBySurveyId,
    // Actions
    createSurvey,
    updateSurvey,
    deleteSurvey,
    duplicateSurvey,
    publishSurvey,
    closeSurvey,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    submitResponse,
    setCurrentSurvey
  }
})
