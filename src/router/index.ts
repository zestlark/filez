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
      path: '/:data/:pathMatch(.*)*',
      name: 'fileExplorer',
      component: HomeView
    },
    {
      path: '/filter/:type',
      name: 'fileFilter',
      component: HomeView
    },
    {
      path: '/editor',
      name: 'Editor',
      component: EditorView
    },
  ]
})

export default router
