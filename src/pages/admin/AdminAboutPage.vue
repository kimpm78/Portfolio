<script setup lang="ts">
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ArrowLeft, GripVertical, Pencil, Plus, Save, Upload, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { aboutImageUrl, staticAboutProfile, type AboutPastImage, type AboutProfileData, type AboutStoryCard } from '../../data/aboutProfile'
import { db } from '../../firebase/firebase'
import { uploadImageToCloudinary } from '../../services/cloudinary'

type AboutForm = {
  headlineLine1: string
  headlineHighlight: string
  introLead: string
  quote: string
  introBody: string
  tagsText: string
  buttonText: string
  deskImage: string
  storyIntro: string
  storyCard1Number: string
  storyCard1Title: string
  storyCard1Body: string
  storyCard2Number: string
  storyCard2Title: string
  storyCard2Body: string
  storyCard3Number: string
  storyCard3Title: string
  storyCard3Body: string
  archiveTitle: string
  archivePeriod: string
  pastImagesText: string
  isVisible: boolean
}

const router = useRouter()
const aboutDocRef = doc(db, 'about', 'profile')

const aboutProfile = ref<AboutProfileData | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isImportingLegacyAbout = ref(false)
const isEditorOpen = ref(false)
const errorMessage = ref('')
const selectedDeskImageFile = ref<File | null>(null)
const selectedPastImageFiles = ref<File[]>([])
const tagInput = ref('')
const pastImageAltInput = ref('')
const pastImageUrlInput = ref('')
const draggingPastImageIndex = ref<number | null>(null)

const pastImagesToText = (images: AboutPastImage[]) => {
  return images.map((image) => `${image.alt}|${image.src}`).join('\n')
}

const initialForm: AboutForm = {
  headlineLine1: '',
  headlineHighlight: '',
  introLead: '',
  quote: '',
  introBody: '',
  tagsText: '',
  buttonText: '詳細を見る',
  deskImage: '',
  storyIntro: '',
  storyCard1Number: '01',
  storyCard1Title: '',
  storyCard1Body: '',
  storyCard2Number: '02',
  storyCard2Title: '',
  storyCard2Body: '',
  storyCard3Number: '03',
  storyCard3Title: '',
  storyCard3Body: '',
  archiveTitle: '',
  archivePeriod: '',
  pastImagesText: '',
  isVisible: true,
}

const form = ref<AboutForm>({ ...initialForm })
const hasProfile = computed(() => aboutProfile.value !== null)

const parseTags = (tagsText: string) => {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const currentTags = computed(() => parseTags(form.value.tagsText))

const setTags = (tags: string[]) => {
  form.value.tagsText = tags.join(', ')
}

const addTag = () => {
  const newTag = tagInput.value.trim()

  if (!newTag) {
    return
  }

  const tags = currentTags.value

  if (tags.includes(newTag)) {
    tagInput.value = ''
    return
  }

  setTags([...tags, newTag])
  tagInput.value = ''
}

const removeTag = (tag: string) => {
  setTags(currentTags.value.filter((currentTag) => currentTag !== tag))
}

const createStoryCards = (): AboutStoryCard[] => {
  return [
    {
      number: form.value.storyCard1Number.trim() || '01',
      title: form.value.storyCard1Title.trim(),
      body: form.value.storyCard1Body.trim(),
    },
    {
      number: form.value.storyCard2Number.trim() || '02',
      title: form.value.storyCard2Title.trim(),
      body: form.value.storyCard2Body.trim(),
    },
    {
      number: form.value.storyCard3Number.trim() || '03',
      title: form.value.storyCard3Title.trim(),
      body: form.value.storyCard3Body.trim(),
    },
  ].filter((card) => card.title || card.body)
}

const getStoryCard = (cards: AboutStoryCard[], index: number, fallbackNumber: string) => {
  return cards[index] ?? {
    number: fallbackNumber,
    title: '',
    body: '',
  }
}

const parsePastImages = (pastImagesText: string): AboutPastImage[] => {
  return pastImagesText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [alt, ...srcParts] = line.split('|')
      const src = srcParts.join('|').trim()

      return {
        alt: alt?.trim() || `project_${index + 1}`,
        src,
      }
    })
    .filter((image) => image.src)
}

const currentPastImages = computed(() => parsePastImages(form.value.pastImagesText))

const setPastImages = (images: AboutPastImage[]) => {
  form.value.pastImagesText = pastImagesToText(images)
}

const addPastImageUrl = () => {
  const src = pastImageUrlInput.value.trim()

  if (!src) {
    return
  }

  const alt = pastImageAltInput.value.trim() || `project_${currentPastImages.value.length + 1}`

  setPastImages([
    ...currentPastImages.value,
    {
      alt,
      src,
    },
  ])
  pastImageAltInput.value = ''
  pastImageUrlInput.value = ''
}

const removePastImage = (index: number) => {
  setPastImages(currentPastImages.value.filter((_, currentIndex) => currentIndex !== index))
}

const startPastImageDrag = (index: number) => {
  draggingPastImageIndex.value = index
}

const reorderPastImage = (targetIndex: number) => {
  const sourceIndex = draggingPastImageIndex.value

  if (sourceIndex === null || sourceIndex === targetIndex) {
    draggingPastImageIndex.value = null
    return
  }

  const images = [...currentPastImages.value]
  const [movedImage] = images.splice(sourceIndex, 1)

  if (!movedImage) {
    draggingPastImageIndex.value = null
    return
  }

  images.splice(targetIndex, 0, movedImage)
  setPastImages(images)
  draggingPastImageIndex.value = null
}

const endPastImageDrag = () => {
  draggingPastImageIndex.value = null
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    const message = 'message' in error ? String((error as { message: unknown }).message) : ''

    return message ? `${code}: ${message}` : code
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unknown error'
}

const createFileFromLegacyImage = async (fileName: string) => {
  const imageUrl = aboutImageUrl(fileName)
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(`Legacy about image fetch failed: ${fileName} (${response.status})`)
  }

  const blob = await response.blob()

  if (!blob.type.startsWith('image/')) {
    throw new Error(
      `Legacy about image is not an image file: ${fileName} (${blob.type || 'unknown type'})`,
    )
  }

  const fileNameParts = fileName.split('/')
  const originalName = fileNameParts[fileNameParts.length - 1] || fileName
  const extension = blob.type.split('/')[1] || originalName.split('.').pop() || 'webp'
  const safeName = originalName.replace(/\.[^.]+$/, `.${extension}`)

  return new File([blob], safeName, {
    type: blob.type,
  })
}

const setFormFromProfile = (profile: AboutProfileData) => {
  const storyCard1 = getStoryCard(profile.storyCards, 0, '01')
  const storyCard2 = getStoryCard(profile.storyCards, 1, '02')
  const storyCard3 = getStoryCard(profile.storyCards, 2, '03')

  form.value = {
    headlineLine1: profile.headlineLine1,
    headlineHighlight: profile.headlineHighlight,
    introLead: profile.introLead,
    quote: profile.quote,
    introBody: profile.introBody,
    tagsText: profile.tags.join(', '),
    buttonText: profile.buttonText,
    deskImage: profile.deskImage,
    storyIntro: profile.storyIntro,
    storyCard1Number: storyCard1.number,
    storyCard1Title: storyCard1.title,
    storyCard1Body: storyCard1.body,
    storyCard2Number: storyCard2.number,
    storyCard2Title: storyCard2.title,
    storyCard2Body: storyCard2.body,
    storyCard3Number: storyCard3.number,
    storyCard3Title: storyCard3.title,
    storyCard3Body: storyCard3.body,
    archiveTitle: profile.archiveTitle,
    archivePeriod: profile.archivePeriod,
    pastImagesText: pastImagesToText(profile.pastImages),
    isVisible: profile.isVisible,
  }
  tagInput.value = ''
  pastImageAltInput.value = ''
  pastImageUrlInput.value = ''
}

const resetForm = () => {
  if (aboutProfile.value) {
    setFormFromProfile(aboutProfile.value)
  } else {
    const storyCard1 = getStoryCard(staticAboutProfile.storyCards, 0, '01')
    const storyCard2 = getStoryCard(staticAboutProfile.storyCards, 1, '02')
    const storyCard3 = getStoryCard(staticAboutProfile.storyCards, 2, '03')

    form.value = {
      headlineLine1: staticAboutProfile.headlineLine1,
      headlineHighlight: staticAboutProfile.headlineHighlight,
      introLead: staticAboutProfile.introLead,
      quote: staticAboutProfile.quote,
      introBody: staticAboutProfile.introBody,
      tagsText: staticAboutProfile.tags.join(', '),
      buttonText: staticAboutProfile.buttonText,
      deskImage: staticAboutProfile.deskImage,
      storyIntro: staticAboutProfile.storyIntro,
      storyCard1Number: storyCard1.number,
      storyCard1Title: storyCard1.title,
      storyCard1Body: storyCard1.body,
      storyCard2Number: storyCard2.number,
      storyCard2Title: storyCard2.title,
      storyCard2Body: storyCard2.body,
      storyCard3Number: storyCard3.number,
      storyCard3Title: storyCard3.title,
      storyCard3Body: storyCard3.body,
      archiveTitle: staticAboutProfile.archiveTitle,
      archivePeriod: staticAboutProfile.archivePeriod,
      pastImagesText: pastImagesToText(staticAboutProfile.pastImages),
      isVisible: staticAboutProfile.isVisible,
    }
  }

  selectedDeskImageFile.value = null
  selectedPastImageFiles.value = []
  tagInput.value = ''
  pastImageAltInput.value = ''
  pastImageUrlInput.value = ''
  errorMessage.value = ''
}

const openEditor = () => {
  resetForm()
  isEditorOpen.value = true
}

const closeEditor = () => {
  resetForm()
  isEditorOpen.value = false
}

const loadAbout = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const snapshot = await getDoc(aboutDocRef)

    if (!snapshot.exists()) {
      aboutProfile.value = null
      resetForm()
      return
    }

    const data = snapshot.data()
    aboutProfile.value = {
      headlineLine1: String(data.headlineLine1 ?? ''),
      headlineHighlight: String(data.headlineHighlight ?? ''),
      introLead: String(data.introLead ?? ''),
      quote: String(data.quote ?? ''),
      introBody: String(data.introBody ?? ''),
      tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      buttonText: String(data.buttonText ?? '詳細を見る'),
      deskImage: String(data.deskImage ?? ''),
      storyIntro: String(data.storyIntro ?? ''),
      storyCards: Array.isArray(data.storyCards) ? data.storyCards as AboutStoryCard[] : [],
      archiveTitle: String(data.archiveTitle ?? ''),
      archivePeriod: String(data.archivePeriod ?? ''),
      pastImages: Array.isArray(data.pastImages) ? data.pastImages as AboutPastImage[] : [],
      isVisible: data.isVisible !== false,
    }
    setFormFromProfile(aboutProfile.value)
  } catch (error) {
    console.error(error)
    errorMessage.value = `プロフィールの取得に失敗しました: ${getErrorMessage(error)}`
  } finally {
    isLoading.value = false
  }
}

const importLegacyAbout = async () => {
  const confirmed = window.confirm('既存のABOUTデータをCloudinaryへアップロードし、Firestoreへ登録しますか？')

  if (!confirmed) {
    return
  }

  try {
    isImportingLegacyAbout.value = true
    errorMessage.value = ''

    const deskFile = await createFileFromLegacyImage(staticAboutProfile.deskImage)
    const deskResult = await uploadImageToCloudinary(deskFile, 'portfolio/about/profile')
    const pastImages: AboutPastImage[] = []

    for (const image of staticAboutProfile.pastImages) {
      const imageFile = await createFileFromLegacyImage(image.src)
      const result = await uploadImageToCloudinary(imageFile, 'portfolio/about/archive')
      pastImages.push({
        alt: image.alt,
        src: result.url,
      })
    }

    await setDoc(aboutDocRef, {
      ...staticAboutProfile,
      deskImage: deskResult.url,
      pastImages,
      source: 'legacy-static',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })

    await loadAbout()
  } catch (error) {
    console.error(error)
    errorMessage.value = `既存データの登録に失敗しました: ${getErrorMessage(error)}`
  } finally {
    isImportingLegacyAbout.value = false
  }
}

const setDeskImageFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedDeskImageFile.value = target.files?.[0] ?? null
}

const setPastImageFiles = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedPastImageFiles.value = Array.from(target.files ?? [])
}

const uploadSelectedImages = async () => {
  let deskImage = form.value.deskImage
  const pastImages = parsePastImages(form.value.pastImagesText)

  if (selectedDeskImageFile.value) {
    const result = await uploadImageToCloudinary(selectedDeskImageFile.value, 'portfolio/about/profile')
    deskImage = result.url
    form.value.deskImage = result.url
  }

  if (selectedPastImageFiles.value.length > 0) {
    const uploadedImages = await Promise.all(
      selectedPastImageFiles.value.map(async (file, index) => {
        const result = await uploadImageToCloudinary(file, 'portfolio/about/archive')

        return {
          alt: file.name.replace(/\.[^.]+$/, '') || `project_${pastImages.length + index + 1}`,
          src: result.url,
        }
      }),
    )

    pastImages.push(...uploadedImages)
    form.value.pastImagesText = pastImagesToText(pastImages)
  }

  selectedDeskImageFile.value = null
  selectedPastImageFiles.value = []

  return {
    deskImage,
    pastImages,
  }
}

const validateForm = () => {
  if (!form.value.headlineLine1.trim() || !form.value.headlineHighlight.trim()) {
    return 'メインコピーを入力してください。'
  }

  if (!form.value.introBody.trim()) {
    return 'プロフィール本文を入力してください。'
  }

  if (!form.value.deskImage && !selectedDeskImageFile.value) {
    return '背景画像を設定してください。'
  }

  return ''
}

const saveAbout = async () => {
  const validationMessage = validateForm()

  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  try {
    isSaving.value = true
    errorMessage.value = ''

    const uploadedImages = await uploadSelectedImages()
    const payload = {
      headlineLine1: form.value.headlineLine1.trim(),
      headlineHighlight: form.value.headlineHighlight.trim(),
      introLead: form.value.introLead.trim(),
      quote: form.value.quote.trim(),
      introBody: form.value.introBody.trim(),
      tags: parseTags(form.value.tagsText),
      buttonText: form.value.buttonText.trim() || '詳細を見る',
      deskImage: uploadedImages.deskImage,
      storyIntro: form.value.storyIntro.trim(),
      storyCards: createStoryCards(),
      archiveTitle: form.value.archiveTitle.trim(),
      archivePeriod: form.value.archivePeriod.trim(),
      pastImages: uploadedImages.pastImages,
      isVisible: form.value.isVisible,
      updatedAt: serverTimestamp(),
    }

    await setDoc(aboutDocRef, {
      ...payload,
      createdAt: serverTimestamp(),
    }, { merge: true })

    await loadAbout()
    isEditorOpen.value = false
  } catch (error) {
    console.error(error)
    errorMessage.value = `保存に失敗しました: ${getErrorMessage(error)}`
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.push('/admin')
}

onMounted(() => {
  loadAbout()
})
</script>

<template>
  <main class="min-h-screen bg-[rgb(27,29,32)] px-6 py-8 text-white">
    <div class="mx-auto max-w-7xl">
      <header class="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8">
        <div>
          <button
            type="button"
            class="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
            @click="goBack"
          >
            <ArrowLeft :size="18" :stroke-width="2.4" aria-hidden="true" />
            Dashboardへ戻る
          </button>
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-white/35">
            Portfolio Admin
          </p>
          <h1 class="text-3xl font-black md:text-5xl">
            ABOUT 管理
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            プロフィール文、ストーリー、過去作品アーカイブを管理します。画像はCloudinaryにアップロードし、URLをFirestoreに保存します。
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isImportingLegacyAbout || isSaving"
          @click="importLegacyAbout"
        >
          <Upload :size="17" :stroke-width="2.4" aria-hidden="true" />
          {{ isImportingLegacyAbout ? '既存データ登録中...' : '既存データを登録' }}
        </button>
      </header>

      <p v-if="errorMessage" class="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
        {{ errorMessage }}
      </p>

      <section class="mt-8">
        <div v-if="isEditorOpen" class="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto overflow-x-hidden px-4 py-8">
          <button type="button" class="fixed inset-0 bg-black/75 backdrop-blur-sm" aria-label="編集を閉じる" @click="closeEditor"></button>

          <form class="relative z-10 w-full max-w-[760px] min-w-0 rounded-[2rem] border border-white/10 bg-[rgb(27,29,32)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.6)] max-[520px]:px-4" @submit.prevent="saveAbout">
            <div class="sticky -top-6 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-white/10 bg-[rgb(27,29,32)] px-6 py-5">
              <div>
                <p class="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-white/35">
                  ABOUT PROFILE
                </p>
                <h2 class="text-xl font-black">
                  {{ hasProfile ? 'プロフィールを編集' : 'プロフィールを追加' }}
                </h2>
              </div>
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
                aria-label="編集を閉じる"
                @click="closeEditor"
              >
                <X :size="18" :stroke-width="2.4" aria-hidden="true" />
              </button>
            </div>

          <div class="space-y-6">
            <section class="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div class="mb-5">
                <p class="text-sm font-black text-white">メイン表示</p>
                <p class="mt-1 text-xs leading-5 text-white/35">ABOUTセクションの見出し、本文、背景画像を管理します。</p>
              </div>

              <div class="space-y-4">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">メインコピー 1行目</span>
                  <input v-model="form.headlineLine1" type="text" placeholder="例：新しい道を作り" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">メインコピー 強調文</span>
                  <input v-model="form.headlineHighlight" type="text" placeholder="例：いつもチャレンジする" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">導入文</span>
                  <input v-model="form.introLead" type="text" placeholder="本文前に表示する短いリード文" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">引用文</span>
                  <input v-model="form.quote" type="text" placeholder="強調して見せたい考え方やキーワード" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">プロフィール本文</span>
                  <textarea v-model="form.introBody" rows="6" placeholder="プロフィール本文を入力してください。" class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"></textarea>
                  <p class="mt-2 text-xs leading-5 text-white/35">改行はメイン画面にも反映されます。</p>
                </label>

                <div class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">タグ</span>
                  <div class="flex gap-2">
                    <input
                      v-model="tagInput"
                      type="text"
                      placeholder="例：#継続力がある"
                      class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                      @keydown.enter.prevent="addTag"
                    />
                    <button type="button" class="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]" @click="addTag">
                      追加
                    </button>
                  </div>
                  <ul v-if="currentTags.length" class="mt-3 flex flex-wrap gap-2">
                    <li v-for="tag in currentTags" :key="tag" class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/70">
                      <span>{{ tag }}</span>
                      <button type="button" class="text-white/35 transition hover:text-red-200" :aria-label="`${tag}を削除`" @click="removeTag(tag)">
                        <X :size="14" :stroke-width="2.4" aria-hidden="true" />
                      </button>
                    </li>
                  </ul>
                  <p v-else class="mt-3 text-xs leading-5 text-white/35">タグが未登録です。入力後、「追加」をクリックしてください。</p>
                </div>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">ボタンテキスト</span>
                  <input v-model="form.buttonText" type="text" placeholder="例：詳細を見る" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">背景画像</span>
                    <input type="file" accept="image/*" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950" @change="setDeskImageFile" />
                    <p v-if="selectedDeskImageFile" class="mt-2 text-xs text-white/35">選択中: {{ selectedDeskImageFile.name }}</p>
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">背景画像URL</span>
                    <input v-model="form.deskImage" type="text" placeholder="Cloudinaryアップロード後は自動で設定されます。" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                  </label>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div class="mb-5">
                <p class="text-sm font-black text-white">ストーリー</p>
                <p class="mt-1 text-xs leading-5 text-white/35">ABOUT詳細パネルに表示する3つのストーリーカードです。</p>
              </div>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">ストーリー導入文</span>
                <textarea v-model="form.storyIntro" rows="3" placeholder="ストーリー全体の導入文を入力してください。" class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"></textarea>
              </label>

              <div class="mt-4 grid gap-4">
                <div v-for="cardIndex in 3" :key="cardIndex" class="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p class="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/35">Story {{ cardIndex }}</p>
                  <div class="grid gap-3 md:grid-cols-[84px_1fr] xl:grid-cols-1">
                    <label class="block">
                      <span class="mb-2 block text-xs font-bold text-white/45">番号</span>
                      <input
                        v-if="cardIndex === 1"
                        v-model="form.storyCard1Number"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                      />
                      <input
                        v-else-if="cardIndex === 2"
                        v-model="form.storyCard2Number"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                      />
                      <input
                        v-else
                        v-model="form.storyCard3Number"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                      />
                    </label>
                    <label class="block">
                      <span class="mb-2 block text-xs font-bold text-white/45">タイトル</span>
                      <input
                        v-if="cardIndex === 1"
                        v-model="form.storyCard1Title"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                      />
                      <input
                        v-else-if="cardIndex === 2"
                        v-model="form.storyCard2Title"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                      />
                      <input
                        v-else
                        v-model="form.storyCard3Title"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                      />
                    </label>
                  </div>
                  <label class="mt-3 block">
                    <span class="mb-2 block text-xs font-bold text-white/45">本文</span>
                    <textarea
                      v-if="cardIndex === 1"
                      v-model="form.storyCard1Body"
                      rows="4"
                      class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                    ></textarea>
                    <textarea
                      v-else-if="cardIndex === 2"
                      v-model="form.storyCard2Body"
                      rows="4"
                      class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                    ></textarea>
                    <textarea
                      v-else
                      v-model="form.storyCard3Body"
                      rows="4"
                      class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                    ></textarea>
                  </label>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div class="mb-5">
                <p class="text-sm font-black text-white">アーカイブ</p>
                <p class="mt-1 text-xs leading-5 text-white/35">過去作品の画像一覧を管理します。ファイル選択またはURL追加が使えます。</p>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">アーカイブタイトル</span>
                  <input v-model="form.archiveTitle" type="text" placeholder="例：DESIGN ARCHIVE" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">アーカイブ期間</span>
                  <input v-model="form.archivePeriod" type="text" placeholder="例：2015 - 2016 作品" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                </label>
              </div>

              <label class="mt-4 block">
                <span class="mb-2 block text-sm font-bold text-white/60">過去作品画像</span>
                <input type="file" accept="image/*" multiple class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950" @change="setPastImageFiles" />
                <p v-if="selectedPastImageFiles.length > 0" class="mt-2 text-xs text-white/35">選択中: {{ selectedPastImageFiles.length }}枚</p>
              </label>

              <div class="mt-4 grid gap-3">
                <span class="block text-sm font-bold text-white/60">過去作品画像URL</span>
                <input v-model="pastImageAltInput" type="text" placeholder="alt 例：project_1" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40" />
                <div class="flex gap-2">
                  <input
                    v-model="pastImageUrlInput"
                    type="url"
                    placeholder="https://res.cloudinary.com/..."
                    class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    @keydown.enter.prevent="addPastImageUrl"
                  />
                  <button type="button" class="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]" @click="addPastImageUrl">
                    追加
                  </button>
                </div>
              </div>

              <ul v-if="currentPastImages.length" class="mt-4 grid gap-2">
                <li
                  v-for="(image, index) in currentPastImages"
                  :key="`${image.src}-${index}`"
                  draggable="true"
                  class="flex min-w-0 items-center gap-3 rounded-xl bg-white/5 p-2 transition"
                  :class="draggingPastImageIndex === index ? 'border border-white/30 bg-white/10 opacity-70' : 'border border-transparent'"
                  @dragstart="startPastImageDrag(index)"
                  @dragover.prevent
                  @drop.prevent="reorderPastImage(index)"
                  @dragend="endPastImageDrag"
                >
                  <span class="shrink-0 cursor-grab text-white/30 active:cursor-grabbing">
                    <GripVertical :size="18" :stroke-width="2.2" aria-hidden="true" />
                  </span>
                  <img :src="aboutImageUrl(image.src)" :alt="image.alt" class="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-bold text-white/75">{{ image.alt }}</p>
                    <p class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/35">{{ image.src }}</p>
                  </div>
                  <button type="button" class="shrink-0 rounded-full border border-red-300/20 p-2 text-red-200 transition hover:bg-red-500/10" :aria-label="`${image.alt}を削除`" @click="removePastImage(index)">
                    <X :size="15" :stroke-width="2.4" aria-hidden="true" />
                  </button>
                </li>
              </ul>
              <p v-else class="mt-3 text-xs leading-5 text-white/35">アーカイブ画像が未登録です。</p>
            </section>

            <section class="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <label class="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/70">
                公開する
                <input v-model="form.isVisible" type="checkbox" class="h-5 w-5" />
              </label>
              <p class="mt-2 text-xs leading-5 text-white/35">OFFにするとFirestoreには残したままABOUTセクションでは非表示扱いにできます。</p>
            </section>
          </div>

            <button
              type="submit"
              class="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-[rgb(255,255,130)] disabled:opacity-50"
              :disabled="isSaving"
            >
              <Save v-if="hasProfile" :size="18" :stroke-width="2.4" aria-hidden="true" />
              <Plus v-else :size="18" :stroke-width="2.4" aria-hidden="true" />
              {{ isSaving ? '保存中...' : hasProfile ? '更新する' : '追加する' }}
            </button>
          </form>
        </div>

        <section>
          <div class="mb-5 flex items-center justify-between gap-4">
            <h2 class="text-xl font-black">
              登録済みプロフィール
            </h2>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <button type="button" class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]" @click="openEditor">
                <Pencil v-if="hasProfile" :size="16" :stroke-width="2.4" aria-hidden="true" />
                <Plus v-else :size="16" :stroke-width="2.4" aria-hidden="true" />
                {{ hasProfile ? '編集する' : '追加する' }}
              </button>
              <button type="button" class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:text-white" @click="loadAbout">
                <Upload :size="16" :stroke-width="2.4" aria-hidden="true" />
                再読み込み
              </button>
            </div>
          </div>

          <p v-if="isLoading" class="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/50">
            読み込み中...
          </p>

          <article v-else-if="aboutProfile" class="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <div class="relative h-72 bg-black/40">
              <img :src="aboutImageUrl(aboutProfile.deskImage)" :alt="aboutProfile.headlineHighlight" class="h-full w-full object-cover opacity-70" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent"></div>
              <span class="absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-black" :class="aboutProfile.isVisible ? 'bg-emerald-300 text-emerald-950' : 'bg-white/15 text-white/50'">
                {{ aboutProfile.isVisible ? '公開' : '非公開' }}
              </span>
              <div class="absolute bottom-5 left-5 right-5">
                <p class="text-lg font-bold text-white/70">
                  {{ aboutProfile.headlineLine1 }}
                </p>
                <h3 class="mt-1 text-3xl font-black">
                  {{ aboutProfile.headlineHighlight }}
                </h3>
              </div>
            </div>

            <div class="p-6">
              <p class="whitespace-pre-line text-sm leading-7 text-white/60">
                {{ aboutProfile.introBody }}
              </p>
              <ul class="mt-5 flex flex-wrap gap-2">
                <li v-for="tag in aboutProfile.tags" :key="tag" class="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60">
                  {{ tag }}
                </li>
              </ul>
              <p class="mt-5 text-sm font-bold text-[rgb(255,255,130)]/75">
                ストーリーカード {{ aboutProfile.storyCards.length }}件 / アーカイブ画像 {{ aboutProfile.pastImages.length }}枚
              </p>
            </div>
          </article>

          <p v-else class="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/50">
            登録されたプロフィールがありません。
          </p>
        </section>
      </section>
    </div>
  </main>
</template>
