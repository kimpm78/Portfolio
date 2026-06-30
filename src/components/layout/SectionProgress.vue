<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const defaultSection = { id: 'Intro' }
const sections = [
  defaultSection,
  { id: 'About' },
  { id: 'Stacks' },
  { id: 'Works' },
  { id: 'DesignGraphic' },
  { id: 'Contact' },
]

const scrollProgress = ref(0)
const activeSectionId = ref('Intro')
let animationFrameId: number | null = null

const activeSectionIndex = computed(() => {
  return Math.max(0, sections.findIndex((section) => section.id === activeSectionId.value))
})

const updateProgress = () => {
  animationFrameId = null

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = scrollableHeight > 0
    ? Math.min(Math.max(window.scrollY / scrollableHeight, 0), 1)
    : 0

  const focusY = window.innerHeight * 0.42
  const currentSection = sections.find((section) => {
    const target = document.getElementById(section.id)

    if (!target) {
      return false
    }

    const rect = target.getBoundingClientRect()

    return rect.top <= focusY && rect.bottom > focusY
  })

  if (currentSection) {
    activeSectionId.value = currentSection.id
  }
}

const requestProgressUpdate = () => {
  if (animationFrameId !== null) {
    return
  }

  animationFrameId = window.requestAnimationFrame(updateProgress)
}

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', requestProgressUpdate, { passive: true })
  window.addEventListener('resize', requestProgressUpdate)
  window.addEventListener('portfolio-section-layout-ready', requestProgressUpdate)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  window.removeEventListener('scroll', requestProgressUpdate)
  window.removeEventListener('resize', requestProgressUpdate)
  window.removeEventListener('portfolio-section-layout-ready', requestProgressUpdate)
})
</script>

<template>
  <div class="pointer-events-none fixed left-0 top-0 z-[10002] w-full">
    <div class="h-[3px] w-full bg-white/10">
      <div
        class="h-full bg-[linear-gradient(90deg,rgb(255,255,130),#ffffff)] shadow-[0_0_18px_rgba(255,255,130,0.7)] transition-[width] duration-150"
        :style="{ width: `${scrollProgress * 100}%` }"
      ></div>
    </div>

    <div class="relative h-0">
      <span
        v-for="(section, index) in sections"
        :key="section.id"
        class="absolute top-0 h-[7px] w-px -translate-x-1/2 bg-white/25 transition"
        :class="index <= activeSectionIndex ? 'bg-[rgb(255,255,130)]/80' : ''"
        :style="{ left: `${sections.length === 1 ? 0 : (index / (sections.length - 1)) * 100}%` }"
      ></span>
    </div>
  </div>
</template>
