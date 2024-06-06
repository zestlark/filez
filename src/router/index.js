import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditorView from '../views/EditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/global'
    },
    {
      path: '/:data',
      name: 'data',
      component: HomeView
    },
    {
      path: '/:data/:firstfolder',
      name: 'firstfolder',
      component: HomeView,
      children: [{
        path: ':secondfolder',
        name: 'secondfolder',
        component: HomeView
      }]
    },
    {
      path: '/editor',
      name: 'Editor',
      component: EditorView
    },
  ]
})

export default router
