<script setup lang="ts">
import { LockKeyhole, LogIn, Mail } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginAdmin } from '../../firebase/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'メールアドレスとパスワードを入力してください。'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    await loginAdmin(email.value.trim(), password.value)
    router.push('/admin')
  } catch {
    errorMessage.value = 'ログインに失敗しました。メールアドレスまたはパスワードをご確認ください。'
  } finally {
    isLoading.value = false
  }
}

const goToPortfolio = () => {
  router.push('/')
}
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(-45deg,#000000,rgb(61,22,41),rgb(36,20,63),#68648b)] bg-[length:400%_400%] px-6 py-12 text-white" style="animation: AdminLoginGradient 14s ease-in-out infinite;">
    <div class="pointer-events-none absolute inset-0 bg-black/45"></div>
    <div class="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(255,255,130)]/10 blur-3xl"></div>
    <div class="pointer-events-none absolute bottom-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[rgb(156,107,212)]/20 blur-3xl"></div>

    <section class="relative w-full max-w-[460px] rounded-[2rem] border border-white/15 bg-black/40 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-10">
      <div class="text-center">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-white/40">
          Portfolio Admin
        </p>
        <h1 class="text-4xl font-black tracking-[0.08em]">
          LOGIN
        </h1>
        <p class="mt-4 text-sm leading-7 text-white/50">
          管理者アカウントでログインしてください。
        </p>
      </div>

      <form class="mt-8 space-y-5" @submit.prevent="handleLogin">
        <label class="block">
          <span class="mb-2 block text-sm font-bold text-white/60">
            Email
          </span>
          <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 transition focus-within:border-white/40">
            <Mail :size="18" :stroke-width="2.4" class="shrink-0 text-white/45" aria-hidden="true" />
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              class="w-full bg-transparent text-white outline-none placeholder:text-white/25"
              placeholder="admin@example.com"
            />
          </div>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-bold text-white/60">
            Password
          </span>
          <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 transition focus-within:border-white/40">
            <LockKeyhole :size="18" :stroke-width="2.4" class="shrink-0 text-white/45" aria-hidden="true" />
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full bg-transparent text-white outline-none placeholder:text-white/25"
              placeholder="password"
            />
          </div>
        </label>

        <p v-if="errorMessage" class="rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold leading-6 text-red-200">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-black text-slate-950 shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[rgb(255,255,130)] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isLoading"
        >
          <LogIn :size="18" :stroke-width="2.4" aria-hidden="true" />
          {{ isLoading ? 'LOGIN中...' : 'LOGIN' }}
        </button>
      </form>

      <button
        type="button"
        class="mx-auto mt-7 block text-sm font-bold text-white/45 transition hover:text-white"
        @click="goToPortfolio"
      >
        Portfolioへ戻る
      </button>
    </section>
  </main>
</template>

<style scoped>
@keyframes AdminLoginGradient {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}
</style>