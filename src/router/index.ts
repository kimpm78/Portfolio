import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from '../firebase/auth'
import HomePage from '../pages/HomePage.vue'
import AdminLoginPage from '../pages/admin/AdminLoginPage.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminWorksPage from '../pages/admin/AdminWorksPage.vue'
import AdminDesignGraphicPage from '../pages/admin/AdminDesignGraphicPage.vue'
import AdminStacksPage from '../pages/admin/AdminStacksPage.vue'
import AdminAboutPage from '../pages/admin/AdminAboutPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/admin/login',
      component: AdminLoginPage,
    },
    {
      path: '/admin',
      component: AdminDashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/works',
      component: AdminWorksPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/design-graphic',
      component: AdminDesignGraphicPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/stacks',
      component: AdminStacksPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/about',
      component: AdminAboutPage,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) {
    return true
  }

  const user = await getCurrentUser()

  if (!user) {
    return '/admin/login'
  }

  return true
})

router.afterEach((to) => {
  document.title = to.path.startsWith('/admin')
    ? 'Admin | Prime'
    : 'Prime PORTFOLIO'
})

export default router
