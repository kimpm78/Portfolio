<script setup lang="ts">
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { ChevronLeft, ChevronRight, ExternalLink, Figma, Github, ZoomIn } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref } from 'vue'
import { type WorkLink, type WorkProjectData, workImageUrl } from '../../data/workProjects'
import { db } from '../../firebase/firebase'
import ImageWindow from '../common/ImageWindow.vue'

const worksSection = {
  eyebrow: 'Prime Project',
  title: 'WORKS',
}

const worksCollection = collection(db, 'works')
const activeProjectIndex = ref(0)
const slideDirection = ref<'prev' | 'next'>('next')
const projects = ref<WorkProjectData[]>([])
const activeImageIndexes = ref<number[]>([])
const expandedProjectIndexes = ref<number[]>([])
const previewImage = ref<{ src: string; alt: string; mode: 'default' | 'mobile' } | null>(null)
const isLoadingProjects = ref(true)

const isProjectLink = (link: unknown): link is WorkLink => {
  if (!link || typeof link !== 'object') {
    return false
  }

  const candidate = link as WorkLink
  return typeof candidate.label === 'string' && typeof candidate.url === 'string'
}

const mapFirestoreWork = (data: Record<string, unknown>): WorkProjectData | null => {
  const galleryImageUrls = Array.isArray(data.imageUrls) ? data.imageUrls.filter((url): url is string => typeof url === 'string' && Boolean(url)) : []
  const imageUrl = typeof data.imageUrl === 'string' && data.imageUrl ? data.imageUrl : galleryImageUrls[0]
  const images = imageUrl
    ? [imageUrl, ...galleryImageUrls.filter((url) => url !== imageUrl)].slice(0, 5)
    : galleryImageUrls.slice(0, 5)

  if (images.length === 0) {
    return null
  }

  return {
    title: String(data.title ?? ''),
    subTitle: String(data.subTitle ?? ''),
    description: String(data.description ?? ''),
    moreDescription: String(data.moreDescription ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    images: images as [string, ...string[]],
    imageAlt: String(data.imageAlt ?? data.title ?? ''),
    links: Array.isArray(data.links) ? data.links.filter(isProjectLink) : [],
    isMobileImage: Boolean(data.isMobileImage),
  }
}

const loadProjects = async () => {
  try {
    isLoadingProjects.value = true
    const worksQuery = query(worksCollection, orderBy('order', 'asc'))
    const snapshot = await getDocs(worksQuery)
    const firestoreProjects = snapshot.docs
      .map((item) => item.data())
      .filter((data) => data.isVisible !== false)
      .map((data) => mapFirestoreWork(data))
      .filter((project): project is WorkProjectData => project !== null)

    projects.value = firestoreProjects
    activeProjectIndex.value = firestoreProjects.length > 0 ? Math.min(activeProjectIndex.value, firestoreProjects.length - 1) : 0
    activeImageIndexes.value = firestoreProjects.map((_, index) => activeImageIndexes.value[index] ?? 0)
  } catch (error) {
    console.error(error)
    projects.value = []
    activeProjectIndex.value = 0
    activeImageIndexes.value = []
  } finally {
    isLoadingProjects.value = false
    nextTick(() => {
      window.dispatchEvent(new CustomEvent('portfolio-section-layout-ready'))
    })
  }
}

const activeProject = computed<WorkProjectData | null>(() => projects.value[activeProjectIndex.value] ?? projects.value[0] ?? null)
const activeImage = computed<string>(() => {
  if (!activeProject.value) {
    return ''
  }

  const imageIndex = activeImageIndexes.value[activeProjectIndex.value] ?? 0
  return activeProject.value.images[imageIndex] ?? activeProject.value.images[0]
})

const setProject = (index: number) => {
  if (index === activeProjectIndex.value) {
    return
  }

  slideDirection.value = index > activeProjectIndex.value ? 'next' : 'prev'
  activeProjectIndex.value = index
}

const showPrevProject = () => {
  if (projects.value.length === 0) {
    return
  }

  slideDirection.value = 'prev'
  activeProjectIndex.value = activeProjectIndex.value === 0 ? projects.value.length - 1 : activeProjectIndex.value - 1
}

const showNextProject = () => {
  if (projects.value.length === 0) {
    return
  }

  slideDirection.value = 'next'
  activeProjectIndex.value = activeProjectIndex.value === projects.value.length - 1 ? 0 : activeProjectIndex.value + 1
}

const setActiveImage = (imageIndex: number) => {
  activeImageIndexes.value[activeProjectIndex.value] = imageIndex
}

const toggleMore = (projectIndex: number) => {
  if (expandedProjectIndexes.value.includes(projectIndex)) {
    expandedProjectIndexes.value = expandedProjectIndexes.value.filter((index) => index !== projectIndex)
    return
  }

  expandedProjectIndexes.value = [...expandedProjectIndexes.value, projectIndex]
}

const isExpanded = (projectIndex: number) => expandedProjectIndexes.value.includes(projectIndex)

const openPreview = (fileName: string, alt: string, mode: 'default' | 'mobile' = 'default') => {
  if (typeof window !== 'undefined' && window.innerWidth <= 640) {
    return
  }

  previewImage.value = {
    src: workImageUrl(fileName),
    alt,
    mode,
  }
}

const closePreview = () => {
  previewImage.value = null
}

onMounted(() => {
  loadProjects()
})
</script>

<template>
  <section id="Works" class="relative overflow-hidden bg-[linear-gradient(rgb(27,29,33)_0%,rgb(24,25,31)_33%,rgb(18,18,21)_70%,rgb(29,31,36)_100%)] px-5 py-[90px] text-white">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-black/20 to-transparent"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-black/20 to-transparent"></div>

    <div class="relative mx-auto max-w-[1200px]">
      <div class="text-center">
        <p class="mb-2 text-xs font-light uppercase tracking-[0.35em] text-white/40">
          {{ worksSection.eyebrow }}
        </p>
        <h2 class="text-5xl font-black max-[480px]:text-4xl">
          {{ worksSection.title }}
        </h2>

        <ul v-if="projects.length > 0" class="mt-5 flex flex-wrap items-center justify-center gap-7 max-[900px]:mt-4 max-[900px]:gap-4 max-[480px]:gap-3">
          <li
            v-for="(_, projectIndex) in projects"
            :key="projectIndex"
            class="relative h-[10px] w-[10px] cursor-pointer rounded-full transition duration-300 before:absolute before:left-0 before:top-1/2 before:h-full before:w-full before:-translate-y-1/2 before:py-5 max-[480px]:h-2 max-[480px]:w-2"
            :class="activeProjectIndex === projectIndex ? 'scale-125 bg-white drop-shadow-[0_0_15px_rgba(255,255,255,0.85)]' : 'bg-[rgb(80,80,90)] hover:bg-[rgb(170,170,185)]'"
            @click="setProject(projectIndex)"
          ></li>
        </ul>
      </div>

      <div
        v-if="activeProject"
        class="relative mx-auto mt-[42px] flex w-full max-w-[1200px] items-center justify-center pb-4 max-[900px]:mt-[34px] max-[900px]:px-0 max-[900px]:pb-3"
      >
        <div class="pointer-events-none absolute bottom-0 h-5 w-[800px] rounded-full bg-black blur-[25px] max-[900px]:hidden"></div>

        <button
          type="button"
          aria-label="前のプロジェクト"
          class="mr-[100px] flex h-[100px] w-[100px] shrink-0 items-center justify-center text-white/30 transition duration-300 hover:text-white/80 max-[1280px]:mr-10 max-[900px]:hidden"
          @click="showPrevProject"
        >
          <ChevronLeft :size="78" :stroke-width="1.2" class="animate-[ItemNavPrev_1500ms_ease-in-out_infinite]" />
        </button>

        <div
          :key="activeProjectIndex"
          class="w-[600px] max-w-full"
          :class="slideDirection === 'next' ? 'animate-[WorksSlideNext_320ms_ease_both]' : 'animate-[WorksSlidePrev_320ms_ease_both]'"
        >
          <div class="flex flex-col">
            <div class="flex flex-wrap gap-2">
              <div class="relative w-full">
                <button
                  type="button"
                  class="group relative flex aspect-[16/8] w-full items-start justify-center overflow-hidden border border-white/[0.015] bg-[#2b2b33] shadow-[0_0_40px_rgba(0,0,0,0.5)] max-[900px]:aspect-[16/10]"
                  @click="openPreview(activeImage, activeProject.imageAlt, activeProject.isMobileImage ? 'mobile' : 'default')"
                >
                <img
                  :src="workImageUrl(activeImage)"
                  :alt="activeProject.imageAlt"
                  loading="lazy"
                  decoding="async"
                  :class="[
                    'w-full object-contain transition duration-300 group-hover:brightness-75',
                    activeProject.isMobileImage ? 'absolute left-1/2 h-auto w-[40%] -translate-x-1/2' : '',
                  ]"
                />
                <span class="absolute inset-0 bg-black/20 opacity-0 transition duration-200 group-hover:opacity-100"></span>
                <span class="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-bold text-white opacity-0 backdrop-blur transition duration-200 group-hover:opacity-100 max-[900px]:opacity-100 max-[640px]:hidden">
                  <ZoomIn :size="16" :stroke-width="2.2" />
                  <span class="max-[380px]:hidden">タップで拡大</span>
                </span>
              </button>

              <div class="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-[calc(100%-16px)] max-w-[560px] -translate-x-1/2 items-center justify-between max-[900px]:flex">
                <button type="button" aria-label="前のプロジェクト" class="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white/80 backdrop-blur transition hover:bg-black/70 max-[480px]:h-10 max-[480px]:w-10" @click="showPrevProject">
                  <ChevronLeft :size="36" :stroke-width="1.5" />
                </button>
                <button type="button" aria-label="次のプロジェクト" class="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white/80 backdrop-blur transition hover:bg-black/70 max-[480px]:h-10 max-[480px]:w-10" @click="showNextProject">
                  <ChevronRight :size="36" :stroke-width="1.5" />
                </button>
              </div>
            </div>

              <div class="flex w-full gap-2 max-[900px]:hidden">
                <button
                  v-for="(image, imageIndex) in activeProject.images"
                  :key="image"
                  type="button"
                  class="relative aspect-[16/8] w-[22%] overflow-hidden border bg-[#2b2b33] transition duration-200 hover:border-white/20"
                  :class="activeImageIndexes[activeProjectIndex] === imageIndex ? 'border-white/20' : 'border-white/[0.015]'"
                  @click="setActiveImage(imageIndex)"
                >
                  <img
                    :src="workImageUrl(image)"
                    :alt="`${activeProject.imageAlt}_${imageIndex + 1}`"
                    loading="lazy"
                    decoding="async"
                    class="w-full object-contain"
                    :class="activeImageIndexes[activeProjectIndex] === imageIndex ? 'brightness-60' : ''"
                  />
                </button>
              </div>

              <div class="hidden w-full gap-2 overflow-x-auto pb-1 max-[900px]:flex">
                <button
                  v-for="(image, imageIndex) in activeProject.images"
                  :key="`${image}-mobile`"
                  type="button"
                  class="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border bg-[#2b2b33] transition duration-200"
                  :class="activeImageIndexes[activeProjectIndex] === imageIndex ? 'border-white/50 brightness-75' : 'border-white/10'"
                  @click="setActiveImage(imageIndex)"
                >
                  <img
                    :src="workImageUrl(image)"
                    :alt="`${activeProject.imageAlt}_${imageIndex + 1}`"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-contain"
                  />
                </button>
              </div>
            </div>

            <div class="relative box-border w-full px-1 pt-5 md:min-h-[360px] max-[900px]:px-4 max-[900px]:md:min-h-0 max-[480px]:px-3">
              <h3 class="text-[1.7rem] font-bold max-[450px]:text-[1.4rem]">
                {{ activeProject.title }}
              </h3>
              <p class="text-sm font-light text-[#a4a4ff]">
                {{ activeProject.subTitle }}
              </p>

              <p class="mt-5 max-w-full break-words text-sm font-light leading-7 text-white/90 max-[900px]:text-base max-[450px]:text-sm">
                {{ activeProject.description }}
                <button
                  v-if="activeProject.moreDescription"
                  type="button"
                  class="ml-1 font-medium text-[rgb(255,253,135)] hover:underline"
                  @click="toggleMore(activeProjectIndex)"
                >
                  {{ isExpanded(activeProjectIndex) ? '閉じる' : 'もっと見る' }}
                </button>
              </p>

              <div v-if="activeProject.moreDescription && isExpanded(activeProjectIndex)" class="mt-5 max-w-full break-words text-sm font-light leading-7 text-white/80">
                <p class="mb-2 text-center font-medium tracking-[10px] text-white">~~~</p>
                <p>{{ activeProject.moreDescription }}</p>
              </div>

              <ul class="mt-5 flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 text-xs font-light max-[480px]:gap-x-2">
                <li
                  v-for="tag in activeProject.tags"
                  :key="tag"
                  class="max-w-full break-words rounded-[7px] bg-[rgba(55,55,67,0.7)] px-[15px] py-2 transition duration-300 hover:scale-110 max-[480px]:px-3"
                >
                  {{ tag }}
                </li>
              </ul>

              <div class="mt-10 flex max-w-full flex-wrap gap-[10px]">
                <a
                  v-for="link in activeProject.links"
                  :key="link.url"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[
                    'inline-flex h-[38px] items-center gap-2 whitespace-nowrap px-5 text-sm font-bold transition duration-150',
                    link.label.toLowerCase().includes('github')
                      ? 'bg-white text-black hover:bg-[rgb(155,155,155)]'
                      : 'bg-[rgb(42,42,110)] text-white hover:bg-[rgb(57,57,124)]',
                  ]"
                >
                  <Github v-if="link.label.toLowerCase().includes('github')" :size="17" :stroke-width="2.2" />
                  <Figma v-else-if="link.label.toLowerCase().includes('figma')" :size="17" :stroke-width="2.2" />
                  <ExternalLink v-else :size="16" :stroke-width="2.2" />
                  {{ link.label }}
                </a>
          </div>
        </div>
      </div>
        </div>

        <button
          type="button"
          aria-label="次のプロジェクト"
          class="ml-[100px] flex h-[100px] w-[100px] shrink-0 items-center justify-center text-white/30 transition duration-300 hover:text-white/80 max-[1280px]:ml-10 max-[900px]:hidden"
          @click="showNextProject"
        >
          <ChevronRight :size="78" :stroke-width="1.2" class="animate-[ItemNavNext_1500ms_ease-in-out_infinite]" />
        </button>

      </div>

      <div v-else class="mx-auto mt-14 max-w-[600px] border border-white/10 bg-black/20 px-6 py-12 text-center text-sm font-light text-white/45">
        {{ isLoadingProjects ? '読み込み中...' : '登録されたプロジェクトがありません。' }}
      </div>

    </div>

    <ImageWindow
      v-if="previewImage"
      :is-open="previewImage !== null"
      :image-src="previewImage.src"
      :image-alt="previewImage.alt"
      :mode="previewImage.mode"
      @close="closePreview"
    />
  </section>
</template>

<style scoped>
@keyframes WorksSlideNext {
  0% {
    opacity: 0;
    transform: translateX(34px) scale(0.985);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes WorksSlidePrev {
  0% {
    opacity: 0;
    transform: translateX(-34px) scale(0.985);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
