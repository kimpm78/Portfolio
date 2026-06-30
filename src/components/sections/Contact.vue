<script setup lang="ts">
import { Github } from 'lucide-vue-next'

const githubUrl = 'https://github.com/kimpm78'
const githubText = 'github.com/kimpm78'
</script>

<template>
  <section
    id="Contact"
    class="relative min-h-screen overflow-hidden bg-[linear-gradient(-45deg,#000000,rgb(61,22,41),rgb(36,20,63),#68648b)] bg-[length:400%_400%] px-6 py-24 text-white"
    style="animation: gradient 14s ease-in-out infinite;"
  >
    <div class="pointer-events-none absolute inset-0 bg-black/35"></div>
    <div class="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(255,255,130)]/10 blur-3xl"></div>
    <div class="pointer-events-none absolute bottom-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[rgb(156,107,212)]/20 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-black/25 to-transparent"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-black/25 to-transparent"></div>

    <div class="relative mx-auto flex min-h-[calc(100vh-12rem)] max-w-7xl flex-col items-center justify-center text-center">
      <p class="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-[rgb(255,255,130)] mix-blend-difference">
        Contact
      </p>
      <h2 class="text-5xl font-black tracking-[0.08em] text-white md:text-7xl">
        CONTACT
      </h2>

      <div class="mt-12 w-full max-w-2xl rounded-[2rem] border border-white/15 bg-black/35 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-md md:p-12">
        <p class="text-sm font-black uppercase tracking-[0.25em] text-[rgb(255,255,130)]">
          PROJECT PRIME
        </p>
        <p class="mt-5 leading-8 text-white/70">
          プロジェクトの実装が完了次第、順次アップロードしています。
        </p>

        <a
          :href="githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mx-auto mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-bold text-slate-950 shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[rgb(255,255,130)]"
        >
          <Github :size="24" :stroke-width="2.4" aria-hidden="true" />
          <span>GitHubを見る</span>
        </a>

        <p class="mt-5 text-sm font-semibold text-white/45">
          {{ githubText }}
        </p>
      </div>

      <p class="mt-12 text-xs font-semibold text-white/45 md:text-sm">
        Copyright ⓒ 2023 - 2026 PrimeProject All rights reserved.
      </p>
    </div>
  </section>
</template>

<style>
@keyframes gradient {
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
