<script setup lang="ts">
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Plus, RotateCcw, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type WindowMode = 'default' | 'past' | 'mobile' | 'visual'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    imageSrc: string
    imageAlt: string
    mode?: WindowMode
    hasPrev?: boolean
    hasNext?: boolean
    allowMobile?: boolean
  }>(),
  {
    mode: 'default',
    hasPrev: false,
    hasNext: false,
    allowMobile: false,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'prev'): void
  (event: 'next'): void
}>()

const zoomLevel = ref(1)
const minZoomLevel = 0.5
const maxZoomLevel = 2.5
const mobileWindowBreakpoint = 640
const isActualSize = ref(false)
const scrollAreaRef = ref<HTMLDivElement | null>(null)
const imageNaturalSize = ref({ width: 0, height: 0 })
const viewportSize = ref({
  width: typeof window === 'undefined' ? 1024 : window.innerWidth,
  height: typeof window === 'undefined' ? 768 : window.innerHeight,
})
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragScrollLeft = 0
let dragScrollTop = 0
let savedScrollY = 0
let previousBodyOverflow = ''
let previousBodyPosition = ''
let previousBodyTop = ''
let previousBodyWidth = ''
let previousBodyPaddingRight = ''
let isPageScrollLocked = false

const isMobileWindow = computed(() => viewportSize.value.width <= mobileWindowBreakpoint)
const isWindowActive = computed(() => props.isOpen && (props.allowMobile || !isMobileWindow.value))

const fitBounds = computed(() => {
  const { width, height } = viewportSize.value
  const isMobileViewport = width <= 640
  const modeMaxWidth = props.mode === 'past' ? 680 : props.mode === 'mobile' ? 360 : 980
  const mobileModeMaxWidth = props.mode === 'mobile' ? 320 : Number.POSITIVE_INFINITY

  return {
    width: Math.max(
      160,
      isMobileViewport
        ? Math.min(mobileModeMaxWidth, width - 48)
        : Math.min(modeMaxWidth, width - 120),
    ),
    height: Math.max(160, height - (isMobileViewport ? 140 : 170)),
  }
})

const fitImageSize = computed(() => {
  const { width, height } = imageNaturalSize.value

  if (width <= 0 || height <= 0) {
    return null
  }

  const bounds = fitBounds.value
  const fitScale = props.mode === 'visual' && isMobileWindow.value
    ? Math.min(1, bounds.width / width)
    : Math.min(1, bounds.width / width, bounds.height / height)

  return {
    width: Math.round(width * fitScale),
    height: Math.round(height * fitScale),
  }
})

const imageDisplaySize = computed(() => {
  const { width, height } = imageNaturalSize.value

  if (width <= 0 || height <= 0) {
    return null
  }

  if (isActualSize.value) {
    return { width, height }
  }

  const fitSize = fitImageSize.value

  if (!fitSize) {
    return null
  }

  const fitScale = fitSize.width / width
  const displayScale = fitScale * zoomLevel.value

  return {
    width: Math.round(width * displayScale),
    height: Math.round(height * displayScale),
  }
})

const windowStyle = computed(() => {
  const { width, height } = viewportSize.value
  const isMobileViewport = width <= 640
  const viewportGap = isMobileViewport ? 24 : 48
  const imagePadding = isMobileViewport ? 24 : 48
  const chromeHeight = isMobileViewport ? 44 : 80
  const modeMaxWidth = isActualSize.value
    ? width - viewportGap
    : props.mode === 'past'
      ? 860
      : props.mode === 'mobile'
        ? 560
        : 1180
  const modeMinWidth = props.mode === 'past' ? 420 : props.mode === 'mobile' ? 360 : 640
  const maxWindowWidth = Math.max(280, Math.min(modeMaxWidth, width - viewportGap))
  const maxWindowHeight = Math.max(280, height - viewportGap)
  const targetImageSize = imageDisplaySize.value || fitImageSize.value

  if (!targetImageSize) {
    return {
      width: `${maxWindowWidth}px`,
      height: `${maxWindowHeight}px`,
    }
  }

  return {
    width: `${Math.min(maxWindowWidth, Math.max(modeMinWidth, targetImageSize.width + imagePadding))}px`,
    height: `${Math.min(maxWindowHeight, Math.max(280, targetImageSize.height + imagePadding + chromeHeight))}px`,
  }
})

const imageStyle = computed(() => {
  if (!imageDisplaySize.value) {
    return {}
  }

  return {
    width: `${imageDisplaySize.value.width}px`,
    height: `${imageDisplaySize.value.height}px`,
    maxWidth: 'none',
    maxHeight: 'none',
  }
})

const imageStageStyle = computed(() => {
  if (!imageDisplaySize.value) {
    return {}
  }

  return {
    width: `${imageDisplaySize.value.width}px`,
    height: `${imageDisplaySize.value.height}px`,
  }
})

const isScrollableImage = computed(() => {
  const scrollArea = scrollAreaRef.value

  if (!scrollArea) {
    return isActualSize.value || zoomLevel.value > 1
  }

  return scrollArea.scrollWidth > scrollArea.clientWidth || scrollArea.scrollHeight > scrollArea.clientHeight
})

const canZoomOut = computed(() => !isActualSize.value && zoomLevel.value > minZoomLevel)
const canZoomIn = computed(() => !isActualSize.value && zoomLevel.value < maxZoomLevel)

const zoomIn = () => {
  zoomLevel.value = Math.min(Number((zoomLevel.value + 0.25).toFixed(2)), maxZoomLevel)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(Number((zoomLevel.value - 0.25).toFixed(2)), minZoomLevel)
}

const resetZoom = () => {
  zoomLevel.value = 1
  isActualSize.value = false
}

const toggleActualSize = () => {
  isActualSize.value = !isActualSize.value
  zoomLevel.value = 1
}

const updateViewportSize = () => {
  viewportSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

const resetImageScroll = () => {
  const scrollArea = scrollAreaRef.value

  if (!scrollArea) {
    return
  }

  scrollArea.scrollLeft = 0
  scrollArea.scrollTop = 0
}

const handleImageLoad = (event: Event) => {
  const image = event.target as HTMLImageElement

  imageNaturalSize.value = {
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}

const startImageDrag = (event: MouseEvent) => {
  const scrollArea = scrollAreaRef.value

  if (!scrollArea || !isScrollableImage.value) {
    return
  }

  isDragging.value = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragScrollLeft = scrollArea.scrollLeft
  dragScrollTop = scrollArea.scrollTop
}

const moveImageDrag = (event: MouseEvent) => {
  const scrollArea = scrollAreaRef.value

  if (!isDragging.value || !scrollArea) {
    return
  }

  event.preventDefault()
  scrollArea.scrollLeft = dragScrollLeft - (event.clientX - dragStartX)
  scrollArea.scrollTop = dragScrollTop - (event.clientY - dragStartY)
}

const endImageDrag = () => {
  isDragging.value = false
}

const lockPageScroll = () => {
  if (isPageScrollLocked) {
    return
  }
  savedScrollY = window.scrollY
  previousBodyOverflow = document.body.style.overflow
  previousBodyPosition = document.body.style.position
  previousBodyTop = document.body.style.top
  previousBodyWidth = document.body.style.width
  previousBodyPaddingRight = document.body.style.paddingRight

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${savedScrollY}px`
  document.body.style.width = '100%'

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }

  isPageScrollLocked = true
}

const unlockPageScroll = () => {
  if (!isPageScrollLocked) {
    return
  }
  document.body.style.overflow = previousBodyOverflow
  document.body.style.position = previousBodyPosition
  document.body.style.top = previousBodyTop
  document.body.style.width = previousBodyWidth
  document.body.style.paddingRight = previousBodyPaddingRight

  window.scrollTo(0, savedScrollY)
  isPageScrollLocked = false
}

const closeWindow = () => {
  resetZoom()
  emit('close')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isWindowActive.value) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    endImageDrag()
    closeWindow()
    return
  }

  if ((event.key === '+' || event.key === '=') && canZoomIn.value) {
    event.preventDefault()
    event.stopPropagation()
    zoomIn()
    return
  }

  if (event.key === '-' && canZoomOut.value) {
    event.preventDefault()
    event.stopPropagation()
    zoomOut()
    return
  }

  if (event.key === '0') {
    event.preventDefault()
    event.stopPropagation()
    resetZoom()
    return
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault()
    event.stopPropagation()
    toggleActualSize()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    event.stopPropagation()

    if (props.hasPrev) {
      emit('prev')
    }

    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    event.stopPropagation()

    if (props.hasNext) {
      emit('next')
    }
  }
}

watch(
  () => props.imageSrc,
  () => {
    endImageDrag()
    resetZoom()
    nextTick(resetImageScroll)
  },
)

watch(
  () => isWindowActive.value,
  (isActive) => {
    if (isActive) {
      lockPageScroll()
      return
    }

    unlockPageScroll()
    resetZoom()
  },
  { immediate: true },
)

watch(
  () => [props.isOpen, isMobileWindow.value] as const,
  ([isOpen, isMobile]) => {
    if (isOpen && isMobile && !props.allowMobile) {
      emit('close')
    }
  },
  { immediate: true },
)

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('mousemove', moveImageDrag)
  window.addEventListener('mouseup', endImageDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportSize)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('mousemove', moveImageDrag)
  window.removeEventListener('mouseup', endImageDrag)
  endImageDrag()

  if (isWindowActive.value) {
    unlockPageScroll()
  }
})
</script>

<template>
  <div
    class="fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 px-6 py-6 backdrop-blur-sm transition-opacity duration-300 max-[640px]:px-3 max-[640px]:py-3"
    :class="isWindowActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
    @click="closeWindow"
  >
    <div
      class="relative flex min-h-[280px] scale-95 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#24242c]/95 opacity-0 shadow-[0_30px_90px_rgba(0,0,0,0.65)] ring-1 ring-white/5 backdrop-blur transition-[opacity,transform] duration-300 max-[640px]:rounded-xl"
      :class="[
        isWindowActive ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
      ]"
      :style="windowStyle"
      @click.stop
    >
      <div class="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(90deg,rgba(82,63,102,0.96),rgba(46,45,58,0.96))] px-4">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded-full bg-[#ff5f57]"></span>
            <span class="h-3 w-3 rounded-full bg-[#ffbd2e]"></span>
            <span class="h-3 w-3 rounded-full bg-[#28c840]"></span>
          </div>

          <div class="flex min-w-0 items-center gap-2 text-white/70">
            <Maximize2 :size="13" :stroke-width="2" class="shrink-0" />
            <p class="truncate text-xs font-light tracking-[0.08em]">
              {{ imageAlt }}
            </p>
          </div>
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-1 rounded-lg bg-black/20 px-1.5 py-1 max-[640px]:hidden">
          <button
            type="button"
            :aria-label="isActualSize ? '画面に合わせる' : '実寸で表示'"
            class="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition duration-200 hover:bg-white/10 hover:text-white"
            @click="toggleActualSize"
          >
            <Minimize2 v-if="isActualSize" :size="14" :stroke-width="2.3" />
            <Maximize2 v-else :size="14" :stroke-width="2.3" />
          </button>
          <button
            type="button"
            aria-label="縮小"
            class="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition duration-200 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
            :disabled="!canZoomOut"
            @click="zoomOut"
          >
            <Minus :size="14" :stroke-width="2.3" />
          </button>
          <span class="min-w-12 text-center text-[0.68rem] font-light text-white/55">
            {{ isActualSize ? '100%' : `${Math.round(zoomLevel * 100)}%` }}
          </span>
          <button
            type="button"
            aria-label="拡大"
            class="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition duration-200 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
            :disabled="!canZoomIn"
            @click="zoomIn"
          >
            <Plus :size="14" :stroke-width="2.3" />
          </button>
          <button
            type="button"
            aria-label="表示倍率をリセット"
            class="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition duration-200 hover:bg-white/10 hover:text-white"
            @click="resetZoom"
          >
            <RotateCcw :size="13" :stroke-width="2.3" />
          </button>
        </div>

        <button
          type="button"
          aria-label="クローズボタン"
          class="relative -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition duration-200 hover:bg-white/10 hover:text-white"
          @click="closeWindow"
        >
          <X :size="17" :stroke-width="2.4" />
        </button>
      </div>

      <button
        v-if="hasPrev"
        type="button"
        aria-label="前の画像"
        class="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur transition duration-200 hover:-translate-x-0.5 hover:border-white/30 hover:bg-black/75 hover:text-white max-[640px]:left-2 max-[640px]:h-10 max-[640px]:w-10"
        @click="emit('prev')"
      >
        <ChevronLeft :size="26" :stroke-width="2.2" />
      </button>

      <button
        v-if="hasNext"
        type="button"
        aria-label="次の画像"
        class="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur transition duration-200 hover:translate-x-0.5 hover:border-white/30 hover:bg-black/75 hover:text-white max-[640px]:right-2 max-[640px]:h-10 max-[640px]:w-10"
        @click="emit('next')"
      >
        <ChevronRight :size="26" :stroke-width="2.2" />
      </button>

      <div
        ref="scrollAreaRef"
        class="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.055),rgba(20,20,26,0.95)_58%)] p-6 max-[640px]:p-3"
        :class="isDragging ? 'cursor-grabbing' : (isScrollableImage ? 'cursor-grab' : '')"
        @mousedown="startImageDrag"
        @wheel.stop
        @touchmove.stop
      >
        <div
          class="flex min-h-full min-w-full items-center justify-center"
          :class="isActualSize ? 'p-8' : ''"
          :style="imageStageStyle"
        >
          <img
            :src="imageSrc"
            :alt="imageAlt"
            class="pointer-events-none block select-none rounded-md object-contain shadow-[0_18px_55px_rgba(0,0,0,0.45)] transition-[width,height] duration-200"
            :style="imageStyle"
            :class="[
              !imageDisplaySize && mode === 'past' ? 'max-h-[calc(100vh-170px)] max-w-[min(680px,calc(100vw-120px))] max-[640px]:max-h-[calc(100vh-140px)] max-[640px]:max-w-[calc(100vw-48px)]' : '',
              !imageDisplaySize && mode === 'mobile' ? 'max-h-[calc(100vh-170px)] w-auto max-w-[min(360px,calc(100vw-120px))] max-[640px]:max-h-[calc(100vh-140px)] max-[640px]:max-w-[min(320px,calc(100vw-48px))]' : '',
              !imageDisplaySize && mode === 'visual' ? 'max-h-[calc(100vh-170px)] max-w-[min(980px,calc(100vw-120px))] max-[640px]:max-h-[calc(100vh-140px)] max-[640px]:max-w-[calc(100vw-48px)]' : '',
              !imageDisplaySize && mode === 'default' ? 'max-h-[calc(100vh-170px)] max-w-[min(980px,calc(100vw-120px))] max-[640px]:max-h-[calc(100vh-140px)] max-[640px]:max-w-[calc(100vw-48px)]' : '',
            ]"
            @load="handleImageLoad"
          />
        </div>
      </div>

      <div class="flex h-9 shrink-0 items-center justify-between border-t border-white/10 bg-black/20 px-4 text-[0.68rem] font-light tracking-[0.12em] text-white/40 max-[640px]:hidden">
        <span>DRAG TO MOVE / ESC CLOSE / F FIT·100% / + - 0 ZOOM</span>
        <span v-if="hasPrev || hasNext">← / → TO NAVIGATE</span>
      </div>
    </div>
  </div>
</template>
