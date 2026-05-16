import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('@/views/EditorView.vue')
    },
    {
      path: '/edit/:id',
      name: 'edit',
      component: () => import('@/views/EditorView.vue')
    },
    {
      path: '/preview/:id',
      name: 'preview',
      component: () => import('@/views/PreviewView.vue')
    },
    {
      path: '/fill/:id',
      name: 'fill',
      component: () => import('@/views/FillView.vue')
    },
    {
      path: '/thanks',
      name: 'thanks',
      component: () => import('@/views/ThanksView.vue')
    },
    {
      path: '/analysis/:id',
      name: 'analysis',
      component: () => import('@/views/AnalysisView.vue')
    }
  ]
})

export default router