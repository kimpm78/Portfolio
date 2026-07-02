<script setup lang="ts">
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ImageWindow from '../common/ImageWindow.vue'

type PastImage = {
  src: string
  alt: string
}

type StoryCard = {
  number: string
  title: string
  body: string
}

const props = defineProps<{
  isOpen: boolean
  pastImages: PastImage[]
  storyIntro: string
  storyCards: StoryCard[]
  archiveTitle: string
  archivePeriod: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const archiveListRef = ref<HTMLUListElement | null>(null)
const selectedImageIndex = ref<number | null>(null)

const selectedImage = computed(() => {
  if (selectedImageIndex.value === null) {
    return null
  }

  return props.pastImages[selectedImageIndex.value] ?? null
})

const isImageWindowOpen = computed(() => selectedImage.value !== null)

const openImageWindow = (index: number) => {
  selectedImageIndex.value = index
}

const scrollArchive = (direction: 'prev' | 'next') => {
  const archiveList = archiveListRef.value

  if (!archiveList) {
    return
  }

  archiveList.scrollBy({
    left: direction === 'next' ? 320 : -320,
    behavior: 'smooth',
  })
}

const closeImageWindow = () => {
  selectedImageIndex.value = null
}

const showPrevImage = () => {
  if (selectedImageIndex.value === null) {
    return
  }

  selectedImageIndex.value = Math.max(selectedImageIndex.value - 1, 0)
}

const showNextImage = () => {
  if (selectedImageIndex.value === null) {
    return
  }

  selectedImageIndex.value = Math.min(selectedImageIndex.value + 1, props.pastImages.length - 1)
}

const closePanel = () => {
  closeImageWindow()
  emit('close')
}

watch(
  () => props.isOpen,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="fixed top-0 z-[10000] h-screen w-full max-w-[800px] overflow-y-auto overscroll-contain transition-[right] duration-200"
    :class="isOpen ? 'right-0 pointer-events-auto' : '-right-full pointer-events-none'"
  >
    <div
      class="fixed left-0 -z-[2] h-screen w-[calc(100vw-12px)] bg-black/85 transition-opacity duration-200"
      :class="isOpen ? 'opacity-100' : 'opacity-0'"
      @click="closePanel"
    ></div>

    <button
      v-if="isOpen"
      type="button"
      aria-label="クローズボタン"
      class="fixed right-[30px] top-[30px] h-10 w-10 cursor-pointer rounded-full border border-[rgb(100,100,117)] opacity-100 transition duration-200 hover:border-[rgb(139,139,168)] hover:bg-black/30 max-[480px]:right-[10px] max-[480px]:top-[10px]"
      @click="closePanel"
    >
      <X
        :size="18"
        :stroke-width="2.4"
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white transition duration-200"
      />
    </button>

    <div class="box-border flex min-h-screen flex-col items-center bg-[rgb(36,38,44)] pb-[90px] pt-[60px] max-[480px]:pb-[100px] max-[480px]:pt-[90px]">
      <div class="mb-14 box-border w-full max-w-[700px] px-5 text-center">
        <p class="mb-4 text-xs font-light tracking-[0.45em] text-white/40">
          ABOUT ME
        </p>
        <h1 class="text-5xl font-black text-[rgb(255,255,123)] max-[480px]:text-4xl">
          MY_STORY
        </h1>
        <p class="mx-auto mt-5 max-w-[520px] text-sm font-light leading-7 text-white/60">
          {{ storyIntro }}
        </p>
      </div>

      <ol class="box-border grid w-full max-w-[700px] gap-4 px-5">
        <li
          v-for="card in storyCards"
          :key="card.number"
          class="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div class="mb-3 flex items-center gap-4">
            <span class="text-xs font-black tracking-[0.25em] text-[rgb(255,255,123)]">
              {{ card.number }}
            </span>
            <h2 class="text-lg font-bold text-white">
              {{ card.title }}
            </h2>
          </div>
          <p class="text-sm font-light leading-7 text-white/70">
            {{ card.body }}
          </p>
        </li>
      </ol>

      <div class="mt-16 box-border w-full max-w-[700px] px-5 text-center">
        <p class="text-xs font-light tracking-[0.45em] text-white/40">
          {{ archiveTitle }}
        </p>
      </div>

      <div class="relative mt-[30px] box-border w-full max-w-[700px] px-5">
        <button
          type="button"
          aria-label="前の作品"
          class="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition duration-200 hover:border-white/30 hover:bg-black/70 min-[481px]:flex"
          @click="scrollArchive('prev')"
        >
          <ChevronLeft :size="20" :stroke-width="2.4" />
        </button>

        <ul
          ref="archiveListRef"
          class="box-border flex w-full cursor-grab touch-pan-x select-none items-center gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4"
        >
          <li v-for="(image, index) in pastImages" :key="image.alt" class="group relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <img
              :src="image.src"
              :alt="image.alt"
              loading="lazy"
              decoding="async"
              class="h-[220px] cursor-pointer select-none transition duration-300 group-hover:scale-[1.03] group-hover:brightness-75 max-[480px]:pointer-events-none"
              @click="openImageWindow(index)"
            />
            <button
              type="button"
              class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-[0.25em] text-white opacity-0 transition duration-300 group-hover:opacity-100"
              tabindex="-1"
            >
              VIEW
            </button>
          </li>
        </ul>

        <button
          type="button"
          aria-label="次の作品"
          class="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition duration-200 hover:border-white/30 hover:bg-black/70 min-[481px]:flex"
          @click="scrollArchive('next')"
        >
          <ChevronRight :size="20" :stroke-width="2.4" />
        </button>
      </div>

      <p class="mb-[30px] text-center text-sm font-medium text-[rgb(179,179,179)]">
        [ {{ archivePeriod }} ]
      </p>
    </div>
    <ImageWindow
      v-if="selectedImage"
      :is-open="isImageWindowOpen"
      :image-src="selectedImage.src"
      :image-alt="selectedImage.alt"
      mode="past"
      :has-prev="selectedImageIndex !== null && selectedImageIndex > 0"
      :has-next="selectedImageIndex !== null && selectedImageIndex < pastImages.length - 1"
      @close="closeImageWindow"
      @prev="showPrevImage"
      @next="showNextImage"
    />
  </div>
</template>
