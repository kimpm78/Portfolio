<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { createStackGroups, stackIconUrl, type StackItemData } from '../../data/stackItems'
import { db } from '../../firebase/firebase'

const stackSection = {
  eyebrow: 'Stacks',
  title: 'TECH STACK',
  description: 'PCではアイコンにマウスを合わせると詳細を表示し、スマートフォンでは説明を常時表示します。',
}

const stacksCollection = collection(db, 'stacks')
const stackItems = ref<StackItemData[]>([])
const isLoadingStacks = ref(true)

const stackGroups = computed(() => createStackGroups(stackItems.value))

const mapFirestoreStack = (data: Record<string, unknown>): StackItemData | null => {
  const iconUrl = String(data.iconUrl ?? '')
  const name = String(data.name ?? '')

  if (!iconUrl || !name) {
    return null
  }

  return {
    groupName: String(data.groupName ?? ''),
    groupTitle: String(data.groupTitle ?? `# ${String(data.groupName ?? '').toUpperCase()}`),
    name,
    description: String(data.description ?? ''),
    icon: iconUrl,
    alt: String(data.alt ?? name),
    order: Number(data.order ?? 999),
    imageClass: typeof data.imageClass === 'string' ? data.imageClass : undefined,
  }
}

const loadStacks = async () => {
  try {
    isLoadingStacks.value = true
    const snapshot = await getDocs(stacksCollection)
    const firestoreStacks = snapshot.docs
      .map((item) => item.data())
      .filter((data) => data.isVisible !== false)
      .map((data) => mapFirestoreStack(data))
      .filter((item): item is StackItemData => item !== null)

    stackItems.value = firestoreStacks
  } catch (error) {
    console.error(error)
    stackItems.value = []
  } finally {
    isLoadingStacks.value = false
  }
}

onMounted(() => {
  loadStacks()
})
</script>

<template>
  <section id="Stacks" class="relative overflow-hidden bg-[rgb(27,29,32)] px-6 py-24 text-white">
    <div class="absolute left-1/2 top-0 h-80 w-[70vw] -translate-x-1/2 rounded-full bg-[rgb(156,107,212)]/10 blur-3xl"></div>
    <div class="absolute bottom-0 left-1/2 h-80 w-[70vw] -translate-x-1/2 rounded-full bg-[rgb(255,255,123)]/5 blur-3xl"></div>
    <div class="absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-black/20 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-black/20 to-transparent"></div>

    <div class="relative mx-auto max-w-7xl">
      <div class="text-center">
        <p class="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-white/45">
          {{ stackSection.eyebrow }}
        </p>
        <h2 class="text-4xl font-black text-[rgb(156,107,212)] md:text-6xl">
          {{ stackSection.title }}
        </h2>
        <p class="mx-auto mt-4 max-w-[520px] text-sm font-light leading-7 text-white/55">
          {{ stackSection.description }}
        </p>
      </div>

      <div v-if="stackGroups.length > 0" class="mt-16 space-y-14">
        <section
          v-for="group in stackGroups"
          :id="group.id"
          :key="group.id"
        >
          <div class="mb-6 flex items-center gap-4">
            <span class="rounded-full border border-[rgb(156,107,212)]/35 bg-black/35 px-5 py-2 text-sm font-black text-[rgb(255,255,123)] shadow-[0_0_18px_rgba(0,0,0,0.35)]">
              {{ group.title }}
            </span>
            <div class="h-px flex-1 bg-gradient-to-r from-[rgb(156,107,212)]/35 to-transparent"></div>
          </div>

          <ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <li
              v-for="item in group.items"
              :key="item.name"
              class="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[rgb(156,107,212)]/45 hover:bg-white/[0.07] md:min-h-44"
            >
              <div class="flex min-h-28 flex-col items-center justify-center text-center transition duration-300 md:h-full md:min-h-0 md:group-hover:opacity-10">
                <img
                  :src="stackIconUrl(item.icon)"
                  :alt="item.alt"
                  loading="lazy"
                  decoding="async"
                  :class="['h-14 w-auto object-contain', item.imageClass]"
                />
                <p class="mt-4 text-lg font-black">
                  {{ item.name }}
                </p>
              </div>

              <div class="mt-5 block rounded-2xl border border-white/10 bg-[rgb(36,38,44)]/95 p-5 transition duration-300 md:absolute md:inset-0 md:mt-0 md:flex md:translate-y-4 md:flex-col md:justify-center md:border-0 md:p-6 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <p class="text-lg font-black text-[rgb(255,255,123)]">
                  {{ item.name }}
                </p>
                <p class="mt-3 text-sm font-light leading-7 text-white/70">
                  {{ item.description }}
                </p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div v-else class="mx-auto mt-14 max-w-[600px] border border-white/10 bg-black/20 px-6 py-12 text-center text-sm font-light text-white/45">
        {{ isLoadingStacks ? '読み込み中...' : '登録された技術スタックがありません。' }}
      </div>
    </div>
  </section>
</template>
