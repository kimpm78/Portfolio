<script setup lang="ts">
import { Home, Image, LayoutDashboard, LogOut, Palette, Wrench } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { logoutAdmin } from '../../firebase/auth'

type AdminNavItem = {
  label: string
  path: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const route = useRoute()
const router = useRouter()

const navItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Works',
    path: '/admin/works',
    icon: Home,
  },
  {
    label: 'Design & Graphic',
    path: '/admin/design-graphic',
    icon: Palette,
  },
  {
    label: 'About',
    path: '/admin/about',
    icon: Image,
  },
  {
    label: 'Stacks',
    path: '/admin/stacks',
    icon: Wrench,
  }
]

const currentPageTitle = computed(() => {
  const currentItem = navItems.find((item) => {
    return item.exact ? route.path === item.path : route.path.startsWith(item.path)
  })

  return currentItem?.label ?? 'Admin'
})

const isActive = (item: AdminNavItem) => {
  return item.exact ? route.path === item.path : route.path.startsWith(item.path)
}

const goToPortfolio = () => {
  router.push('/')
}

const handleLogout = async () => {
  await logoutAdmin()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-[rgb(27,29,32)] text-white">
    <aside class="fixed left-0 top-0 z-30 hidden h-screen w-[280px] border-r border-white/10 bg-black/35 px-5 py-6 backdrop-blur-xl lg:block">
      <div class="border-b border-white/10 pb-6">
        <p class="text-xs font-bold uppercase tracking-[0.35em] text-white/35">
          Portfolio
        </p>
        <h1 class="mt-2 text-2xl font-black">
          ADMIN
        </h1>
      </div>

      <nav class="mt-7 space-y-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition"
          :class="isActive(item) ? 'bg-white text-slate-950' : 'text-white/55 hover:bg-white/10 hover:text-white'"
        >
          <component :is="item.icon" :size="18" :stroke-width="2.4" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="absolute bottom-6 left-5 right-5 space-y-2">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/55 transition hover:bg-white/10 hover:text-white"
          @click="goToPortfolio"
        >
          <Home :size="18" :stroke-width="2.4" aria-hidden="true" />
          Portfolioへ戻る
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/10"
          @click="handleLogout"
        >
          <LogOut :size="18" :stroke-width="2.4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>

    <header class="sticky top-0 z-20 border-b border-white/10 bg-[rgb(27,29,32)]/90 px-5 py-4 backdrop-blur lg:ml-[280px]">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.28em] text-white/35">
            Admin Page
          </p>
          <h2 class="mt-1 text-xl font-black">
            {{ currentPageTitle }}
          </h2>
        </div>

        <div class="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            class="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60"
            @click="goToPortfolio"
          >
            Portfolio
          </button>
          <button
            type="button"
            class="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>

      <nav class="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <RouterLink
          v-for="item in navItems"
          :key="`${item.path}-mobile`"
          :to="item.path"
          class="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition"
          :class="isActive(item) ? 'bg-white text-slate-950' : 'bg-white/10 text-white/55'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="lg:ml-[280px]">
      <RouterView />
    </main>
  </div>
</template>