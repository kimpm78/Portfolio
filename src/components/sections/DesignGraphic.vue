<script setup lang="ts">
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Eye, Palette } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref } from 'vue'
import { designGraphicImageUrl, type DesignGraphicWorkData } from '../../data/designGraphicWorks'
import { db } from '../../firebase/firebase'
import ImageWindow from '../common/ImageWindow.vue'

const designGraphicSection = {
  eyebrow: 'Design & Graphic',
  title: 'DESIGN & GRAPHIC',
  description: 'ブランドイメージ、配色、ロゴ、ビジュアル制作を中心に整理したデザインアーカイブです。',
}

const designGraphicsCollection = collection(db, 'designGraphics')
const visualWorks = ref<DesignGraphicWorkData[]>([])
const isLoadingVisualWorks = ref(true)
const previewImage = ref<{ src: string; alt: string; mode: 'visual' } | null>(null)

const visibleVisualWorks = computed(() => {
  return [...visualWorks.value]
    .filter((work) => work.isVisible)
    .sort((current, next) => current.order - next.order)
})

const mapFirestoreDesignGraphic = (data: Record<string, unknown>): DesignGraphicWorkData | null => {
  const image = String(data.imageUrl ?? '')
  const title = String(data.title ?? '')

  if (!image || !title) {
    return null
  }

  return {
    title,
    category: String(data.category ?? ''),
    period: String(data.period ?? ''),
    description: String(data.description ?? ''),
    image,
    logo: String(data.logoUrl ?? ''),
    alt: String(data.alt ?? title),
    colors: Array.isArray(data.colors) ? data.colors.filter((color): color is string => typeof color === 'string') : [],
    isFeatured: Boolean(data.isFeatured),
    isVisible: data.isVisible !== false,
    order: Number(data.order ?? 999),
  }
}

const loadDesignGraphics = async () => {
  try {
    isLoadingVisualWorks.value = true
    const designGraphicQuery = query(designGraphicsCollection, orderBy('order', 'asc'))
    const snapshot = await getDocs(designGraphicQuery)
    const firestoreWorks = snapshot.docs
      .map((item) => item.data())
      .map((data) => mapFirestoreDesignGraphic(data))
      .filter((work): work is DesignGraphicWorkData => work !== null)

    visualWorks.value = firestoreWorks
  } catch (error) {
    console.error(error)
    visualWorks.value = []
  } finally {
    isLoadingVisualWorks.value = false
    nextTick(() => {
      window.dispatchEvent(new CustomEvent('portfolio-section-layout-ready'))
    })
  }
}

const openPreview = (fileName: string, alt: string) => {
  previewImage.value = {
    src: designGraphicImageUrl(fileName),
    alt,
    mode: 'visual',
  }
}

const closePreview = () => {
  previewImage.value = null
}

onMounted(() => {
  loadDesignGraphics()
})
</script>

<template>
  <section id="DesignGraphic" class="relative overflow-hidden bg-[linear-gradient(180deg,rgb(29,31,36)_0%,rgb(21,23,27)_55%,rgb(17,18,22)_100%)] px-5 py-[100px] text-white">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-black/20 to-transparent"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-black/20 to-transparent"></div>

    <div class="relative mx-auto max-w-[1200px]">
      <div class="flex items-end justify-between gap-8 max-[820px]:block">
        <div>
          <p class="mb-2 text-xs font-light uppercase tracking-[0.35em] text-white/40">
            {{ designGraphicSection.eyebrow }}
          </p>
          <h2 class="text-5xl font-black tracking-[0.02em] max-[480px]:text-4xl">
            {{ designGraphicSection.title }}
          </h2>
        </div>

        <div class="max-w-[470px] max-[820px]:mt-5">
          <p class="leading-8 text-white/50">
            {{ designGraphicSection.description }}
          </p>
          <div class="mt-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            <Palette :size="16" :stroke-width="2.2" aria-hidden="true" />
            <span>{{ visibleVisualWorks.length }} Visual Works</span>
          </div>
        </div>
      </div>

      <ul v-if="visibleVisualWorks.length > 0" class="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <li
          v-for="visual in visibleVisualWorks"
          :key="visual.title"
          class="group overflow-hidden rounded-lg border border-white/10 bg-[rgb(24,26,31)] shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[rgb(255,255,130)]/40 hover:shadow-[0_24px_65px_rgba(0,0,0,0.38)]"
          :class="visual.isFeatured ? 'md:col-span-2 xl:col-span-2' : ''"
        >
          <button type="button" class="flex h-full w-full flex-col text-left" @click="openPreview(visual.image, visual.alt)">
            <div
              class="relative flex w-full items-center justify-center overflow-hidden bg-[rgb(18,19,23)]"
              :class="visual.isFeatured ? 'aspect-[16/10]' : 'aspect-[4/5]'"
            >
              <img
                :src="designGraphicImageUrl(visual.image)"
                :alt="visual.alt"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.025] group-hover:brightness-90"
              />

              <div class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
                <span class="min-w-0 border border-white/10 bg-black/55 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/75 backdrop-blur">
                  {{ visual.category }}
                </span>
                <span class="shrink-0 border border-white/10 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold text-white/70 backdrop-blur">
                  {{ visual.period }}
                </span>
              </div>

              <span class="absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-white px-3 py-2 text-xs font-black tracking-[0.12em] text-slate-950 opacity-100 transition duration-200 md:opacity-0 md:group-hover:opacity-100">
                <Eye :size="14" :stroke-width="2.4" aria-hidden="true" />
                VIEW
              </span>
            </div>

            <div class="flex flex-1 flex-col p-5">
              <div class="mb-4 flex min-h-10 items-center justify-between gap-4">
                <img
                  v-if="visual.logo"
                  :src="designGraphicImageUrl(visual.logo)"
                  :alt="`${visual.title} logo`"
                  loading="lazy"
                  decoding="async"
                  class="min-w-0 max-h-10 max-w-40 object-contain"
                />
                <span v-else class="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                  Visual Identity
                </span>
              </div>

              <p class="text-2xl font-black leading-tight text-white">
                {{ visual.title }}
              </p>
              <p class="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
                {{ visual.description }}
              </p>

              <ul class="mt-auto flex flex-wrap gap-2 pt-5">
                <li
                  v-for="color in visual.colors"
                  :key="color"
                  class="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.68rem] font-bold text-white/60"
                  :title="color"
                >
                  <span class="h-3.5 w-3.5 shrink-0 border border-white/25" :style="{ backgroundColor: color }"></span>
                  <span>{{ color }}</span>
                </li>
              </ul>
            </div>
          </button>
        </li>
      </ul>

      <div v-else class="mx-auto mt-14 max-w-[600px] rounded-lg border border-white/10 bg-black/20 px-6 py-12 text-center text-sm font-light text-white/45">
        {{ isLoadingVisualWorks ? '読み込み中...' : '登録されたデザイン作品がありません。' }}
      </div>
    </div>

    <ImageWindow
      v-if="previewImage"
      :is-open="previewImage !== null"
      :image-src="previewImage.src"
      :image-alt="previewImage.alt"
      :mode="previewImage.mode"
      allow-mobile
      @close="closePreview"
    />
  </section>
</template>
