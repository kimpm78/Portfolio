<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next';
import { onBeforeUnmount, ref } from 'vue';

const navItems = [
  { id: 'Intro', label: 'INTRO' },
  { id: 'About', label: 'ABOUT' },
  { id: 'Stacks', label: 'STACKS' },
  { id: 'Works', label: 'WORKS' },
  { id: 'DesignGraphic', label: 'DESIGN & GRAPHIC' },
  { id: 'Contact', label: 'CONTACT' },
];

const isMenuOpen = ref(false);
let scrollAnimationFrameId: number | null = null;

const logoUrl = new URL('../../img/prime_logo.svg', import.meta.url).href;
const baseUrl = import.meta.env.BASE_URL;

const easeInOutCubic = (progress: number) => {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const cancelCurrentScroll = () => {
  if (scrollAnimationFrameId === null) {
    return;
  }

  window.cancelAnimationFrame(scrollAnimationFrameId);
  scrollAnimationFrameId = null;
};

const smoothScrollTo = (targetPosition: number) => {
  cancelCurrentScroll();

  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  const duration = 650;
  const startTime = window.performance.now();

  const animateScroll = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * easedProgress);

    if (progress < 1) {
      scrollAnimationFrameId = window.requestAnimationFrame(animateScroll);
      return;
    }

    scrollAnimationFrameId = null;
  };

  scrollAnimationFrameId = window.requestAnimationFrame(animateScroll);
};

const scrollToSection = (id: string) => {
  const targetElement = document.getElementById(id);

  if (!targetElement) {
    return;
  }

  const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;

  window.history.pushState(null, '', `#${id}`);

  smoothScrollTo(targetPosition);

  isMenuOpen.value = false;
};

const scrollToHome = () => {
  window.history.pushState(null, '', baseUrl);
  smoothScrollTo(0);
  isMenuOpen.value = false;
};

onBeforeUnmount(() => {
  cancelCurrentScroll();
});
</script>

<template>
  <header class="fixed left-0 top-0 z-[9999] h-[70px] w-full box-border">
    <div
      class="relative z-[9999] mx-auto flex h-full w-full items-center justify-between box-border px-[50px] text-white font-medium max-[1280px]:px-5 max-[680px]:block max-[680px]:px-0"
    >
      <button
        type="button"
        class="relative ml-[13px] hidden h-[70px] w-10 cursor-pointer transition duration-200 max-[680px]:block"
        aria-label="メニューを開閉する"
        @click="isMenuOpen = !isMenuOpen"
      >
        <Menu
          :size="30"
          :stroke-width="2.4"
          aria-hidden="true"
          class="absolute left-0 top-1/2 -translate-y-1/2 text-white transition duration-200"
          :class="isMenuOpen ? 'opacity-0' : 'opacity-100'"
        />
        <X
          :size="26"
          :stroke-width="2.4"
          aria-hidden="true"
          class="absolute left-1 top-1/2 -translate-y-1/2 text-white transition duration-200"
          :class="isMenuOpen ? 'opacity-100' : 'opacity-0'"
        />
      </button>

      <nav
        class="flex h-full items-center pl-[10px] max-[680px]:absolute max-[680px]:left-1/2 max-[680px]:top-1/2 max-[680px]:h-auto max-[680px]:-translate-x-1/2 max-[680px]:-translate-y-1/2 max-[680px]:p-0"
      >
        <a :href="baseUrl" aria-label="Prime Portfolio" @click.prevent="scrollToHome">
          <img
            :src="logoUrl"
            alt="prime_portfolio_logo"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            class="h-[30px] w-auto cursor-pointer transition duration-300 max-[680px]:h-8"
          />
        </a>
      </nav>

      <nav class="flex h-full items-center max-[680px]:hidden">
        <ul class="flex gap-x-4">
          <li
            v-for="item in navItems"
            :key="item.id"
            class="relative cursor-pointer overflow-hidden px-[10px] py-[6px] transition-colors duration-200 before:absolute before:left-1/2 before:top-1/2 before:-z-[1] before:h-full before:w-0 before:-translate-x-1/2 before:-translate-y-1/2 before:border-b-[2.8px] before:border-white before:box-border before:transition-all before:duration-150 hover:before:w-[calc(100%-17px)]"
          >
            <a :href="`#${item.id}`" @click.prevent="scrollToSection(item.id)">
              {{ item.label }}
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <nav
      class="fixed top-0 z-[9990] flex h-screen w-screen items-center justify-center bg-black/95 transition-[left] duration-300 min-[681px]:hidden"
      :class="isMenuOpen ? 'left-0' : '-left-[100vw]'"
    >
      <ul class="flex -translate-y-4 flex-col items-center gap-10 text-white">
        <li v-for="item in navItems" :key="item.id" class="text-[1.2rem] font-medium">
          <a :href="`#${item.id}`" @click.prevent="scrollToSection(item.id)">
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>
