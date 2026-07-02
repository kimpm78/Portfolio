<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const sections = [
  { id: 'Intro', label: 'INTRO' },
  { id: 'About', label: 'ABOUT' },
  { id: 'Stacks', label: 'STACKS' },
  { id: 'Works', label: 'WORKS' },
  { id: 'DesignGraphic', label: 'DESIGN & GRAPHIC' },
  { id: 'Contact', label: 'CONTACT' },
]

const activeSectionId = ref('Intro')
const sectionIds = sections.map((section) => section.id)
const hashScrollTimeoutIds: number[] = []
const hashScrollRetryDelays = [120, 450, 900]

const setActiveSection = (id: string) => {
  if (!sectionIds.includes(id)) {
    return
  }

  activeSectionId.value = id
}

const clearHashScrollTimeouts = () => {
  hashScrollTimeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId)
  })
  hashScrollTimeoutIds.length = 0
}

const getSectionTop = (id: string) => {
  const target = document.getElementById(id)

  if (!target) {
    return null
  }

  return target.getBoundingClientRect().top + window.scrollY
}

const scrollToSectionPosition = (id: string, behavior: ScrollBehavior = 'smooth') => {
  const targetTop = getSectionTop(id)

  if (targetTop === null) {
    return
  }

  window.scrollTo({
    top: targetTop,
    behavior,
  })
}

const scrollToSection = (id: string) => {
  if (!sectionIds.includes(id)) {
    return
  }

  clearHashScrollTimeouts()
  setActiveSection(id)
  window.history.pushState(null, '', `#${id}`)
  scrollToSectionPosition(id)
}

const syncHashSection = () => {
  const hashSectionId = window.location.hash.replace('#', '')

  if (!sectionIds.includes(hashSectionId)) {
    return false
  }

  clearHashScrollTimeouts()
  setActiveSection(hashSectionId)

  window.requestAnimationFrame(() => {
    scrollToSectionPosition(hashSectionId, 'auto')
  })

  hashScrollRetryDelays.forEach((delay) => {
    const timeoutId = window.setTimeout(() => {
      setActiveSection(hashSectionId)
      scrollToSectionPosition(hashSectionId, 'auto')
    }, delay)

    hashScrollTimeoutIds.push(timeoutId)
  })

  return true
}

const syncCurrentSection = () => {
  const hasHashSection = syncHashSection()

  if (!hasHashSection) {
    handleScroll()
  }
}

const handleScroll = () => {
  const viewportFocusY = window.innerHeight * 0.42
  const currentSection = sections.find((section) => {
    const target = document.getElementById(section.id)

    if (!target) {
      return false
    }

    const rect = target.getBoundingClientRect()

    return rect.top <= viewportFocusY && rect.bottom > viewportFocusY
  })

  if (currentSection) {
    setActiveSection(currentSection.id)
  }
}

onMounted(() => {
  syncCurrentSection()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('hashchange', syncHashSection)
  window.addEventListener('portfolio-section-layout-ready', syncCurrentSection)
})

onBeforeUnmount(() => {
  clearHashScrollTimeouts()
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('hashchange', syncHashSection)
  window.removeEventListener('portfolio-section-layout-ready', syncCurrentSection)
})
</script>

<template>
  <nav class="fixed right-[17px] top-1/2 z-[9998] hidden -translate-y-1/2 md:block">
    <ul>
      <li
        v-for="section in sections"
        :key="section.id"
        class="group relative my-[7px] h-[16px] w-[16px] cursor-pointer"
        @click="scrollToSection(section.id)"
      >
        <span
          class="absolute right-[23px] top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.65rem] font-light text-[rgb(212,212,212)] opacity-0 transition duration-200 group-hover:opacity-100"
          :class="activeSectionId === section.id ? 'group-hover:text-[0.75rem] group-hover:font-medium group-hover:text-white' : ''"
        >
          {{ section.label }}
        </span>

        <span
          class="absolute left-1/2 top-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 transition-all duration-200 group-hover:h-2.5 group-hover:w-2.5 group-hover:bg-white"
          :class="activeSectionId === section.id ? 'h-3 w-3 bg-white' : ''"
        ></span>
      </li>
    </ul>
  </nav>
</template>
