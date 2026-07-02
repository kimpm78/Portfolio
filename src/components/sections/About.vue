<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore'
import { ArrowRight } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { aboutImageUrl, type AboutProfileData, type AboutStoryCard } from '../../data/aboutProfile'
import { db } from '../../firebase/firebase'
import AboutStoryPanel from '../about/AboutStoryPanel.vue'

const isStoryOpen = ref(false)
const aboutSectionRef = ref<HTMLElement | null>(null)
const isAboutVisible = ref(false)
const aboutProfile = ref<AboutProfileData | null>(null)
const isLoadingAbout = ref(true)
let aboutObserver: IntersectionObserver | null = null

const aboutDocRef = doc(db, 'about', 'profile')

const isStoryCard = (card: unknown): card is AboutStoryCard => {
  if (!card || typeof card !== 'object') {
    return false
  }

  const candidate = card as AboutStoryCard
  return typeof candidate.number === 'string' && typeof candidate.title === 'string' && typeof candidate.body === 'string'
}

const mapAboutProfile = (data: Record<string, unknown>): AboutProfileData | null => {
  if (data.isVisible === false) {
    return null
  }

  const deskImage = String(data.deskImage ?? '')

  if (!deskImage) {
    return null
  }

  return {
    headlineLine1: String(data.headlineLine1 ?? ''),
    headlineHighlight: String(data.headlineHighlight ?? ''),
    introLead: String(data.introLead ?? ''),
    quote: String(data.quote ?? ''),
    introBody: String(data.introBody ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    buttonText: String(data.buttonText ?? '詳細を見る'),
    deskImage,
    storyIntro: String(data.storyIntro ?? ''),
    storyCards: Array.isArray(data.storyCards) ? data.storyCards.filter(isStoryCard) : [],
    archiveTitle: String(data.archiveTitle ?? ''),
    archivePeriod: String(data.archivePeriod ?? ''),
    pastImages: Array.isArray(data.pastImages)
      ? data.pastImages
        .filter((image): image is { src: string; alt: string } => {
          return Boolean(image) && typeof image === 'object' && typeof image.src === 'string' && typeof image.alt === 'string'
        })
      : [],
    isVisible: true,
  }
}

const loadAboutProfile = async () => {
  try {
    isLoadingAbout.value = true
    const snapshot = await getDoc(aboutDocRef)

    aboutProfile.value = snapshot.exists() ? mapAboutProfile(snapshot.data()) : null
  } catch (error) {
    console.error(error)
    aboutProfile.value = null
  } finally {
    isLoadingAbout.value = false
  }
}

const deskImageUrl = computed(() => aboutProfile.value ? aboutImageUrl(aboutProfile.value.deskImage) : '')

const pastImages = computed(() => {
  return aboutProfile.value?.pastImages.map((image) => ({
    ...image,
    src: aboutImageUrl(image.src),
  })) ?? []
})

const titleAnimationStyle = computed(() => ({
  animation: isAboutVisible.value ? 'about_fade_up 600ms ease forwards' : 'none',
}))

const descriptionAnimationStyle = computed(() => ({
  animation: isAboutVisible.value ? 'about_fade_up 600ms 300ms ease forwards' : 'none',
}))

onMounted(() => {
  loadAboutProfile()

  if (!aboutSectionRef.value) {
    return
  }

  aboutObserver = new IntersectionObserver(
    ([entry]) => {
      isAboutVisible.value = entry?.isIntersecting ?? false
    },
    {
      threshold: 0.45,
    },
  )

  aboutObserver.observe(aboutSectionRef.value)
})

onBeforeUnmount(() => {
  aboutObserver?.disconnect()
})
</script>

<template>
  <section id="About" ref="aboutSectionRef" class="min-h-screen bg-[rgb(27,29,32)] text-white">
    <div
      v-if="aboutProfile"
      class="relative mx-auto box-border flex min-h-[calc(100vh-140px)] max-w-[1410px] flex-col justify-center px-[25px] py-[70px] max-[960px]:min-h-screen max-[960px]:w-full max-[960px]:items-center max-[960px]:overflow-x-hidden max-[960px]:px-6 max-[480px]:px-[18px]"
    >
      <div
        class="absolute top-[70px] z-0 h-[calc(100%-70px)] min-h-[530px] w-[500px] bg-[length:900px_auto] bg-[position:22%_0%] bg-no-repeat opacity-50 brightness-[0.8] max-[960px]:top-[70px] max-[960px]:h-[calc(100%-70px)] max-[960px]:min-h-0 max-[960px]:w-screen max-[960px]:bg-[length:960px_auto]"
        :style="{ backgroundImage: `url(${deskImageUrl})`, backgroundAttachment: 'fixed' }"
      ></div>

      <div
        class="z-10 ml-[200px] text-center text-white opacity-0 transition duration-[600ms] max-[960px]:ml-0 max-[960px]:w-full"
        :style="titleAnimationStyle"
      >
        <h1
          class="select-none bg-[linear-gradient(90deg,rgb(208,209,142)_0%,rgb(255,255,255)_25%,rgb(167,183,255)_50%,rgb(255,255,255)_75%,rgb(252,255,49)_100%)] bg-[length:1000%_100%] bg-clip-text text-left text-5xl font-medium leading-tight text-transparent max-[480px]:text-4xl max-[480px]:leading-tight"
          style="animation: text_gradient 8s linear infinite alternate;"
        >
          {{ aboutProfile.headlineLine1 }}<br />
          <span class="text-6xl font-black max-[480px]:text-5xl">{{ aboutProfile.headlineHighlight }}</span>
        </h1>
      </div>

      <div
        class="z-10 ml-auto mr-[100px] mt-[90px] max-w-[580px] text-base font-medium leading-[1.9rem] opacity-0 transition duration-[600ms] max-[960px]:mx-0 max-[960px]:mt-[50px] max-[960px]:w-full max-[960px]:max-w-[580px] max-[480px]:text-[0.95rem] max-[480px]:leading-[1.75rem]"
        :style="descriptionAnimationStyle"
      >
        <p class="max-[960px]:break-normal">
          {{ aboutProfile.introLead }}
        </p>
        <p class="ml-2 text-sm text-[rgb(255,149,149)] max-[480px]:ml-0">
          <span class="font-['Noto_Sans_JP']">“</span>
          {{ aboutProfile.quote }}
          <span class="font-['Noto_Sans_JP']">”</span>
        </p>
        <p class="whitespace-pre-line max-[960px]:break-normal">
          {{ aboutProfile.introBody }}
        </p>

        <ul class="mt-[15px] flex items-center text-sm font-light leading-none max-[960px]:flex-wrap max-[960px]:gap-2">
          <li
            v-for="(tag, index) in aboutProfile.tags"
            :key="tag"
            class="whitespace-nowrap rounded-[7px] bg-[rgba(55,55,67,0.7)] px-[15px] py-2 transition-transform duration-300 hover:scale-110 max-[960px]:m-0"
            :class="index === 0 ? 'ml-0 mr-2' : 'mx-2'"
          >
            {{ tag }}
          </li>
        </ul>

        <button
          type="button"
          class="group mt-10 inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/15 bg-black/30 px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[rgb(255,255,130)] hover:bg-black/60 hover:shadow-[0_14px_36px_rgba(0,0,0,0.38)]"
          @click="isStoryOpen = true"
        >
          <span class="relative z-10">{{ aboutProfile.buttonText }}</span>
          <span class="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition duration-300 group-hover:translate-x-1 group-hover:bg-[rgb(255,255,130)] group-hover:text-black">
            <ArrowRight :size="14" :stroke-width="2.5" />
          </span>
        </button>
      </div>
    </div>

    <AboutStoryPanel
      v-if="aboutProfile"
      :is-open="isStoryOpen"
      :past-images="pastImages"
      :story-intro="aboutProfile.storyIntro"
      :story-cards="aboutProfile.storyCards"
      :archive-title="aboutProfile.archiveTitle"
      :archive-period="aboutProfile.archivePeriod"
      @close="isStoryOpen = false"
    />

    <div v-else class="flex min-h-[520px] items-center justify-center px-6 text-center text-sm font-light text-white/45">
      {{ isLoadingAbout ? '読み込み中...' : '登録されたプロフィールがありません。' }}
    </div>
  </section>
</template>

<style>
@keyframes about_fade_up {
  0% {
    transform: translateY(30px);
    opacity: 0;
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes text_gradient {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 100% 50%;
  }
}
</style>
