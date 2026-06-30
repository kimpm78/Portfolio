<script setup lang="ts">
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { compareStackGroups, stackIconUrl, staticStackItems } from '../../data/stackItems'
import { db } from '../../firebase/firebase'
import { uploadImageToCloudinary } from '../../services/cloudinary'

type StackItem = {
  id: string
  groupName: string
  name: string
  description: string
  iconUrl: string
  alt: string
  order: number
  isVisible: boolean
  groupTitle?: string
  imageClass?: string
}

type StackForm = Omit<StackItem, 'id'>

const router = useRouter()
const stacksCollection = collection(db, 'stacks')

const stacks = ref<StackItem[]>([])
const editingId = ref<string | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isImportingLegacyStacks = ref(false)
const errorMessage = ref('')
const selectedIconFile = ref<File | null>(null)

const initialForm: StackForm = {
  groupName: 'Frontend',
  groupTitle: '# FRONTEND',
  name: '',
  description: '',
  iconUrl: '',
  alt: '',
  order: 1,
  isVisible: true,
  imageClass: '',
}

const form = ref<StackForm>({ ...initialForm })

const isEditing = computed(() => editingId.value !== null)

const sortedStacks = computed(() => {
  return [...stacks.value].sort((current, next) => {
    if (current.groupName === next.groupName) {
      return current.order - next.order
    }

    return compareStackGroups(current.groupName, next.groupName)
  })
})

const resetForm = () => {
  editingId.value = null
  form.value = {
    ...initialForm,
    order: stacks.value.length + 1,
  }
  selectedIconFile.value = null
  errorMessage.value = ''
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

const createStackSlug = (groupName: string, name: string) => {
  const slug = `${groupName}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `stack-${Date.now()}`
}

const createFileFromLegacyIcon = async (fileName: string) => {
  const response = await fetch(stackIconUrl(fileName))

  if (!response.ok) {
    throw new Error(`Legacy stack icon fetch failed: ${fileName}`)
  }

  const blob = await response.blob()

  return new File([blob], fileName, {
    type: blob.type || 'image/png',
  })
}

const loadStacks = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const snapshot = await getDocs(stacksCollection)

    stacks.value = snapshot.docs.map((item) => {
      const data = item.data()

      return {
        id: item.id,
        groupName: String(data.groupName ?? ''),
        name: String(data.name ?? ''),
        description: String(data.description ?? ''),
        iconUrl: String(data.iconUrl ?? ''),
        alt: String(data.alt ?? ''),
        order: Number(data.order ?? 999),
        isVisible: data.isVisible !== false,
        groupTitle: String(data.groupTitle ?? ''),
        imageClass: String(data.imageClass ?? ''),
      }
    })
  } catch (error) {
    errorMessage.value = `技術スタックの取得に失敗しました: ${getErrorMessage(error)}`
  } finally {
    isLoading.value = false
  }
}

const importLegacyStacks = async () => {
  const confirmed = window.confirm('既存の技術スタックデータをCloudinaryへアップロードし、Firestoreへ登録しますか？')

  if (!confirmed) {
    return
  }

  try {
    isImportingLegacyStacks.value = true
    errorMessage.value = ''

    for (const item of staticStackItems) {
      const file = await createFileFromLegacyIcon(item.icon)
      const result = await uploadImageToCloudinary(file, `portfolio/stacks/legacy/${item.groupName.toLowerCase()}`)
      const slug = createStackSlug(item.groupName, item.name)

      await setDoc(doc(db, 'stacks', slug), {
        groupName: item.groupName,
        groupTitle: item.groupTitle,
        name: item.name,
        description: item.description,
        iconUrl: result.url,
        alt: item.alt,
        order: item.order,
        imageClass: item.imageClass ?? '',
        isVisible: true,
        source: 'legacy-static',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
    }

    await loadStacks()
    resetForm()
  } catch (error) {
    console.error(error)
    errorMessage.value = `既存データの登録に失敗しました: ${getErrorMessage(error)}`
  } finally {
    isImportingLegacyStacks.value = false
  }
}

const setIconFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedIconFile.value = target.files?.[0] ?? null
}

const uploadSelectedIcon = async () => {
  if (!selectedIconFile.value) {
    return form.value.iconUrl
  }

  const result = await uploadImageToCloudinary(selectedIconFile.value, 'portfolio/stacks')
  form.value.iconUrl = result.url
  selectedIconFile.value = null
  return result.url
}

const validateForm = () => {
  if (!form.value.groupName.trim()) {
    return 'グループ名を入力してください。'
  }

  if (!form.value.name.trim()) {
    return '技術名を入力してください。'
  }

  if (!form.value.description.trim()) {
    return '説明文を入力してください。'
  }

  if (!form.value.iconUrl && !selectedIconFile.value) {
    return 'アイコン画像を設定してください。'
  }

  return ''
}

const saveStack = async () => {
  const validationMessage = validateForm()

  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  try {
    isSaving.value = true
    errorMessage.value = ''

    const iconUrl = await uploadSelectedIcon()
    const payload = {
      groupName: form.value.groupName.trim(),
      groupTitle: form.value.groupTitle?.trim() || `# ${form.value.groupName.trim().toUpperCase()}`,
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      iconUrl,
      alt: form.value.alt.trim() || form.value.name.trim(),
      order: Number(form.value.order || 1),
      isVisible: form.value.isVisible,
      imageClass: form.value.imageClass?.trim() || '',
      updatedAt: serverTimestamp(),
    }

    if (editingId.value) {
      await updateDoc(doc(db, 'stacks', editingId.value), payload)
    } else {
      await addDoc(stacksCollection, {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }

    await loadStacks()
  } catch (error) {
    console.error(error)
    errorMessage.value = `保存に失敗しました: ${getErrorMessage(error)}`
  } finally {
    isSaving.value = false
  }
}

const editStack = (item: StackItem) => {
  editingId.value = item.id
  form.value = {
    groupName: item.groupName,
    groupTitle: item.groupTitle || `# ${item.groupName.toUpperCase()}`,
    name: item.name,
    description: item.description,
    iconUrl: item.iconUrl,
    alt: item.alt,
    order: item.order,
    isVisible: item.isVisible,
    imageClass: item.imageClass ?? '',
  }
  selectedIconFile.value = null
  errorMessage.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const toggleVisibility = async (item: StackItem) => {
  try {
    await updateDoc(doc(db, 'stacks', item.id), {
      isVisible: !item.isVisible,
      updatedAt: serverTimestamp(),
    })
    await loadStacks()
  } catch (error) {
    errorMessage.value = `表示状態の更新に失敗しました: ${getErrorMessage(error)}`
  }
}

const deleteStack = async (id: string) => {
  const confirmed = window.confirm('この技術スタックを削除しますか？')

  if (!confirmed) {
    return
  }

  try {
    await deleteDoc(doc(db, 'stacks', id))
    await loadStacks()

    if (editingId.value === id) {
      resetForm()
    }
  } catch (error) {
    errorMessage.value = `削除に失敗しました: ${getErrorMessage(error)}`
  }
}

const goBack = () => {
  router.push('/admin')
}

onMounted(() => {
  loadStacks()
  resetForm()
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
            管理画面へ戻る
          </button>
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-white/35">
            ポートフォリオ管理
          </p>
          <h1 class="text-3xl font-black md:text-5xl">
            STACKS 管理
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            技術スタックのグループ、アイコン、説明文、表示順を管理します。アイコンはCloudinaryにアップロードし、URLをFirestoreに保存します。
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isImportingLegacyStacks || isSaving"
          @click="importLegacyStacks"
        >
          <Upload :size="17" :stroke-width="2.4" aria-hidden="true" />
          {{ isImportingLegacyStacks ? '既存データ登録中...' : '既存データを登録' }}
        </button>
      </header>

      <p v-if="errorMessage" class="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
        {{ errorMessage }}
      </p>

      <section class="mt-8 grid gap-8 xl:grid-cols-[460px_1fr]">
        <form class="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]" @submit.prevent="saveStack">
          <div class="mb-6 flex items-center justify-between gap-4">
            <h2 class="text-xl font-black">
              {{ isEditing ? '技術を編集' : '技術を追加' }}
            </h2>
            <button
              v-if="isEditing"
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:text-white"
              @click="resetForm"
            >
              <X :size="15" :stroke-width="2.4" aria-hidden="true" />
              キャンセル
            </button>
          </div>

          <div class="space-y-5">
            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">グループ名</span>
              <input
                v-model="form.groupName"
                type="text"
                placeholder="例：Frontend / Backend / Database / Tool"
                class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">グループ表示名</span>
              <input
                v-model="form.groupTitle"
                type="text"
                placeholder="# FRONTEND"
                class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">技術名</span>
              <input v-model="form.name" type="text" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">説明文</span>
              <textarea v-model="form.description" rows="4" class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"></textarea>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">画像の代替テキスト</span>
              <input v-model="form.alt" type="text" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">アイコン画像</span>
              <input type="file" accept="image/*,.svg" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950" @change="setIconFile" />
              <p v-if="selectedIconFile" class="mt-2 text-xs text-white/35">
                選択中: {{ selectedIconFile.name }}
              </p>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">アイコンURL</span>
              <input v-model="form.iconUrl" type="text" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40" />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-bold text-white/60">画像クラス</span>
              <input
                v-model="form.imageClass"
                type="text"
                placeholder="例：h-12"
                class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
              />
            </label>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">表示順</span>
                <input v-model.number="form.order" type="number" min="1" class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40" />
              </label>

              <label class="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/70">
                公開する
                <input v-model="form.isVisible" type="checkbox" class="h-5 w-5" />
              </label>
            </div>
          </div>

          <button
            type="submit"
            class="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-[rgb(255,255,130)] disabled:opacity-50"
            :disabled="isSaving"
          >
            <Save v-if="isEditing" :size="18" :stroke-width="2.4" aria-hidden="true" />
            <Plus v-else :size="18" :stroke-width="2.4" aria-hidden="true" />
            {{ isSaving ? '保存中...' : isEditing ? '更新する' : '追加する' }}
          </button>
        </form>

        <section>
          <div class="mb-5 flex items-center justify-between gap-4">
            <h2 class="text-xl font-black">
              登録済み技術
            </h2>
            <button type="button" class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:text-white" @click="loadStacks">
              <Upload :size="16" :stroke-width="2.4" aria-hidden="true" />
              再読み込み
            </button>
          </div>

          <p v-if="isLoading" class="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/50">
            読み込み中...
          </p>

          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="item in sortedStacks"
              :key="item.id"
              class="rounded-[2rem] border border-white/10 bg-black/30 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-3">
                    <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.alt" class="max-h-full max-w-full object-contain" />
                  </span>
                  <div>
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(255,255,130)]/70">
                      {{ item.groupName }} / #{{ item.order }}
                    </p>
                    <h3 class="mt-1 text-xl font-black">
                      {{ item.name }}
                    </h3>
                  </div>
                </div>

                <span class="shrink-0 rounded-full px-3 py-1.5 text-xs font-black" :class="item.isVisible ? 'bg-emerald-300 text-emerald-950' : 'bg-white/15 text-white/50'">
                  {{ item.isVisible ? '公開' : '非公開' }}
                </span>
              </div>

              <p class="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-white/55">
                {{ item.description }}
              </p>

              <div class="mt-5 flex gap-2">
                <button type="button" class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]" @click="editStack(item)">
                  <Pencil :size="16" :stroke-width="2.4" aria-hidden="true" />
                  編集
                </button>
                <button type="button" class="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-white/60 transition hover:text-white" @click="toggleVisibility(item)">
                  <Eye v-if="item.isVisible" :size="16" :stroke-width="2.4" aria-hidden="true" />
                  <EyeOff v-else :size="16" :stroke-width="2.4" aria-hidden="true" />
                </button>
                <button type="button" class="inline-flex items-center justify-center rounded-full border border-red-300/20 px-4 py-2 text-red-200 transition hover:bg-red-500/10" @click="deleteStack(item.id)">
                  <Trash2 :size="16" :stroke-width="2.4" aria-hidden="true" />
                </button>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
