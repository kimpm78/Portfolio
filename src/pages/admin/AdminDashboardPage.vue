<script setup lang="ts">
import { Image, Layers, LogOut, Palette, Wrench } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { logoutAdmin } from '../../firebase/auth'

type AdminMenuItem = {
  title: string
  description: string
  path: string
  icon: typeof Palette
}

const router = useRouter()

const adminMenus: AdminMenuItem[] = [
  {
    title: 'ABOUT 管理',
    description: 'プロフィール文、ストーリー、過去作品アーカイブを管理します。',
    path: '/admin/about',
    icon: Image,
  },
  {
    title: 'STACKS 管理',
    description: '技術スタックのカテゴリ、アイコン、説明文を管理します。',
    path: '/admin/stacks',
    icon: Wrench,
  },
  {
    title: 'WORKS 管理',
    description: '開発プロジェクトのタイトル、説明、画像、リンク、表示順を管理します。',
    path: '/admin/works',
    icon: Layers,
  },
  {
    title: 'DESIGN & GRAPHIC 管理',
    description: 'デザイン作品の画像、ロゴ、配色、説明、表示状態を管理します。',
    path: '/admin/design-graphic',
    icon: Palette,
  }
]

const goToPage = (path: string) => {
  router.push(path)
}

const handleLogout = async () => {
  await logoutAdmin()
  router.push('/admin/login')
}
</script>

<template>
  <main class="min-h-screen bg-[rgb(27,29,32)] px-6 py-8 text-white">
    <div class="mx-auto max-w-6xl">
      <header class="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8">
        <div>
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-white/35">
            Portfolio Admin
          </p>
          <h1 class="text-3xl font-black md:text-5xl">
            DASHBOARD
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            ポートフォリオに表示するプロジェクト、デザイン作品、技術スタックなどを管理します。
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
          @click="handleLogout"
        >
          <LogOut :size="18" :stroke-width="2.4" aria-hidden="true" />
          Logout
        </button>
      </header>

      <section class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="menu in adminMenus"
          :key="menu.path"
          type="button"
          class="group rounded-[2rem] border border-white/10 bg-black/30 p-6 text-left shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[rgb(255,255,130)]/40 hover:bg-white/[0.06]"
          @click="goToPage(menu.path)"
        >
          <span class="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 transition group-hover:bg-[rgb(255,255,130)]">
            <component :is="menu.icon" :size="23" :stroke-width="2.4" aria-hidden="true" />
          </span>

          <h2 class="text-xl font-black">
            {{ menu.title }}
          </h2>
          <p class="mt-4 min-h-[72px] text-sm leading-6 text-white/50">
            {{ menu.description }}
          </p>

          <p class="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(255,255,130)]/70">
            Edit Content →
          </p>
        </button>
      </section>
    </div>
  </main>
</template>