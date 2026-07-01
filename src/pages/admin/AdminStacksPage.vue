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
} from 'firebase/firestore';
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  compareStackGroups,
  stackGroupOrder,
  stackIconUrl,
  staticStackItems,
} from '../../data/stackItems';
import { db } from '../../firebase/firebase';
import { uploadImageToCloudinary } from '../../services/cloudinary';

type StackItem = {
  id: string;
  groupName: string;
  name: string;
  description: string;
  iconUrl: string;
  alt: string;
  order: number;
  isVisible: boolean;
  groupTitle?: string;
  imageClass?: string;
};

type StackForm = Omit<StackItem, 'id'>;

const router = useRouter();
const stacksCollection = collection(db, 'stacks');

const stackGroupOptions = stackGroupOrder.map((groupName) => ({
  groupName,
  groupTitle: `# ${groupName.toUpperCase()}`,
}));

const stacks = ref<StackItem[]>([]);
const editingId = ref<string | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isImportingLegacyStacks = ref(false);
const isEditorOpen = ref(false);
const errorMessage = ref('');
const selectedIconFile = ref<File | null>(null);
const iconPreviewUrl = ref('');

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
};

const form = ref<StackForm>({ ...initialForm });

const isEditing = computed(() => editingId.value !== null);

const sortedStacks = computed(() => {
  return [...stacks.value].sort((current, next) => {
    if (current.groupName === next.groupName) {
      return current.order - next.order;
    }

    return compareStackGroups(current.groupName, next.groupName);
  });
});

const groupedStacks = computed(() => {
  return stackGroupOptions
    .map((option) => ({
      ...option,
      items: sortedStacks.value.filter((item) => item.groupName === option.groupName),
    }))
    .filter((group) => group.items.length > 0);
});

const resetForm = () => {
  editingId.value = null;
  form.value = {
    ...initialForm,
    order: stacks.value.length + 1,
  };
  selectedIconFile.value = null;
  errorMessage.value = '';
};

const openAddStackEditor = () => {
  resetForm();
  isEditorOpen.value = true;
};

const closeStackEditor = () => {
  resetForm();
  isEditorOpen.value = false;
};

const revokeObjectUrl = (url: string) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

const getStackGroupTitle = (groupName: string) => {
  return (
    stackGroupOptions.find((option) => option.groupName === groupName)?.groupTitle ??
    `# ${groupName.toUpperCase()}`
  );
};

const setStackGroup = () => {
  form.value.groupTitle = getStackGroupTitle(form.value.groupName);
};

const previewIconUrl = computed(() => iconPreviewUrl.value || form.value.iconUrl.trim());

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    const message = 'message' in error ? String((error as { message: unknown }).message) : '';

    return message ? `${code}: ${message}` : code;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
};

const createStackSlug = (groupName: string, name: string) => {
  const slug = `${groupName}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `stack-${Date.now()}`;
};

const createFileFromLegacyIcon = async (fileName: string) => {
  const response = await fetch(stackIconUrl(fileName));

  if (!response.ok) {
    throw new Error(`Legacy stack icon fetch failed: ${fileName}`);
  }

  const blob = await response.blob();

  return new File([blob], fileName, {
    type: blob.type || 'image/png',
  });
};

const loadStacks = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const snapshot = await getDocs(stacksCollection);

    stacks.value = snapshot.docs.map((item) => {
      const data = item.data();

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
      };
    });
  } catch (error) {
    errorMessage.value = `技術スタックの取得に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isLoading.value = false;
  }
};

const importLegacyStacks = async () => {
  const confirmed = window.confirm(
    '既存の技術スタックデータをCloudinaryへアップロードし、Firestoreへ登録しますか？',
  );

  if (!confirmed) {
    return;
  }

  try {
    isImportingLegacyStacks.value = true;
    errorMessage.value = '';

    for (const item of staticStackItems) {
      const file = await createFileFromLegacyIcon(item.icon);
      const result = await uploadImageToCloudinary(
        file,
        `portfolio/stacks/legacy/${item.groupName.toLowerCase()}`,
      );
      const slug = createStackSlug(item.groupName, item.name);

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
      });
    }

    await loadStacks();
    resetForm();
  } catch (error) {
    console.error(error);
    errorMessage.value = `既存データの登録に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isImportingLegacyStacks.value = false;
  }
};

const setIconFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedIconFile.value = target.files?.[0] ?? null;
};

const uploadSelectedIcon = async () => {
  if (!selectedIconFile.value) {
    return form.value.iconUrl;
  }

  const result = await uploadImageToCloudinary(selectedIconFile.value, 'portfolio/stacks');
  form.value.iconUrl = result.url;
  selectedIconFile.value = null;
  return result.url;
};

const validateForm = () => {
  if (!form.value.groupName.trim()) {
    return 'グループ名を入力してください。';
  }

  if (!form.value.name.trim()) {
    return '技術名を入力してください。';
  }

  if (!form.value.description.trim()) {
    return '説明文を入力してください。';
  }

  if (!form.value.iconUrl && !selectedIconFile.value) {
    return 'アイコン画像を設定してください。';
  }

  return '';
};

const saveStack = async () => {
  const validationMessage = validateForm();

  if (validationMessage) {
    errorMessage.value = validationMessage;
    return;
  }

  try {
    isSaving.value = true;
    errorMessage.value = '';

    const iconUrl = await uploadSelectedIcon();
    const payload = {
      groupName: form.value.groupName.trim(),
      groupTitle: getStackGroupTitle(form.value.groupName.trim()),
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      iconUrl,
      alt: form.value.alt.trim() || form.value.name.trim(),
      order: Number(form.value.order || 1),
      isVisible: form.value.isVisible,
      imageClass: form.value.imageClass?.trim() || '',
      updatedAt: serverTimestamp(),
    };

    if (editingId.value) {
      await updateDoc(doc(db, 'stacks', editingId.value), payload);
    } else {
      await addDoc(stacksCollection, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    await loadStacks();
    closeStackEditor();
  } catch (error) {
    console.error(error);
    errorMessage.value = `保存に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isSaving.value = false;
  }
};

const editStack = (item: StackItem) => {
  editingId.value = item.id;
  form.value = {
    groupName: item.groupName,
    groupTitle: item.groupTitle || getStackGroupTitle(item.groupName),
    name: item.name,
    description: item.description,
    iconUrl: item.iconUrl,
    alt: item.alt,
    order: item.order,
    isVisible: item.isVisible,
    imageClass: item.imageClass ?? '',
  };
  selectedIconFile.value = null;
  errorMessage.value = '';
  isEditorOpen.value = true;
};

const toggleVisibility = async (item: StackItem) => {
  try {
    await updateDoc(doc(db, 'stacks', item.id), {
      isVisible: !item.isVisible,
      updatedAt: serverTimestamp(),
    });
    await loadStacks();
  } catch (error) {
    errorMessage.value = `表示状態の更新に失敗しました: ${getErrorMessage(error)}`;
  }
};

const deleteStack = async (id: string) => {
  const confirmed = window.confirm('この技術スタックを削除しますか？');

  if (!confirmed) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'stacks', id));
    await loadStacks();

    if (editingId.value === id) {
      closeStackEditor();
    }
  } catch (error) {
    errorMessage.value = `削除に失敗しました: ${getErrorMessage(error)}`;
  }
};

const goBack = () => {
  router.push('/admin');
};

watch(selectedIconFile, (file, previousFile) => {
  if (previousFile) {
    revokeObjectUrl(iconPreviewUrl.value);
  }

  iconPreviewUrl.value = file ? URL.createObjectURL(file) : '';
});

onBeforeUnmount(() => {
  revokeObjectUrl(iconPreviewUrl.value);
});

onMounted(() => {
  loadStacks();
  resetForm();
});
</script>

<template>
  <main class="min-h-screen bg-[rgb(27,29,32)] px-6 py-8 text-white">
    <div class="mx-auto max-w-7xl">
      <header
        class="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8"
      >
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
          <h1 class="text-3xl font-black md:text-5xl">STACKS 管理</h1>
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

      <p
        v-if="errorMessage"
        class="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200"
      >
        {{ errorMessage }}
      </p>

      <section class="mt-8">
        <div
          v-if="isEditorOpen"
          class="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto overflow-x-hidden px-4 py-8"
        >
          <button
            type="button"
            class="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="編集画面を閉じる"
            @click="closeStackEditor"
          ></button>

          <form
            class="relative z-10 w-full max-w-[1120px] min-w-0 rounded-[2rem] border border-white/10 bg-[rgb(27,29,32)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.6)] max-[520px]:px-4"
            @submit.prevent="saveStack"
          >
            <div
              class="sticky -top-6 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-white/10 bg-[rgb(27,29,32)] px-6 py-5 max-[520px]:-mx-4 max-[520px]:px-4"
            >
              <div>
                <p class="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                  STACKS EDITOR
                </p>
                <h2 class="text-xl font-black">
                  {{ isEditing ? '技術を編集' : '技術を追加' }}
                </h2>
              </div>
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                aria-label="編集画面を閉じる"
                @click="closeStackEditor"
              >
                <X :size="19" :stroke-width="2.4" aria-hidden="true" />
              </button>
            </div>

            <p
              v-if="errorMessage"
              class="mb-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200"
            >
              {{ errorMessage }}
            </p>

            <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <section
                class="rounded-2xl border border-white/10 bg-black/25 p-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2"
              >
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/35">
                      LIVE PREVIEW
                    </p>
                    <h3 class="mt-1 text-base font-black text-white">メイン表示プレビュー</h3>
                  </div>
                  <span
                    class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/45"
                  >
                    STACKS
                  </span>
                </div>

                <div class="rounded-2xl border border-white/10 bg-[rgb(24,26,31)] p-5">
                  <div class="flex items-start gap-4">
                    <span
                      class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-3"
                    >
                      <img
                        v-if="previewIconUrl"
                        :src="stackIconUrl(previewIconUrl)"
                        :alt="form.alt || form.name || 'STACK preview'"
                        class="max-h-full max-w-full object-contain"
                      />
                      <span v-else class="text-xs font-black text-white/25">ICON</span>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p
                        class="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(255,255,130)]/70"
                      >
                        {{ form.groupName }} / #{{ form.order || 1 }}
                      </p>
                      <h4 class="mt-1 break-words text-2xl font-black text-white">
                        {{ form.name || '技術名' }}
                      </h4>
                    </div>
                  </div>
                  <p class="mt-5 line-clamp-4 text-sm leading-6 text-white/55">
                    {{ form.description || '説明文を入力するとここに表示されます。' }}
                  </p>
                  <div class="mt-5 flex flex-wrap gap-2">
                    <span
                      class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/45"
                    >
                      {{ getStackGroupTitle(form.groupName) }}
                    </span>
                    <span
                      class="rounded-full px-3 py-1.5 text-xs font-black"
                      :class="
                        form.isVisible
                          ? 'bg-emerald-300 text-emerald-950'
                          : 'bg-white/15 text-white/50'
                      "
                    >
                      {{ form.isVisible ? '公開' : '非公開' }}
                    </span>
                  </div>
                </div>
              </section>

              <div class="space-y-5 lg:col-start-1 lg:row-start-1">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">カテゴリ</span>
                  <select
                    v-model="form.groupName"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                    @change="setStackGroup"
                  >
                    <option
                      v-for="option in stackGroupOptions"
                      :key="option.groupName"
                      :value="option.groupName"
                      class="bg-[rgb(27,29,32)] text-white"
                    >
                      {{ option.groupName }}
                    </option>
                  </select>
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    表示名: {{ getStackGroupTitle(form.groupName) }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">技術名</span>
                  <input
                    v-model="form.name"
                    type="text"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">説明文</span>
                  <textarea
                    v-model="form.description"
                    rows="4"
                    class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  ></textarea>
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">画像の代替テキスト</span>
                  <input
                    v-model="form.alt"
                    type="text"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  />
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">アイコン画像</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950"
                    @change="setIconFile"
                  />
                  <p v-if="selectedIconFile" class="mt-2 text-xs text-white/35">
                    選択中: {{ selectedIconFile.name }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">アイコンURL</span>
                  <input
                    v-model="form.iconUrl"
                    type="text"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  />
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
                    <input
                      v-model.number="form.order"
                      type="number"
                      min="1"
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white/40"
                    />
                  </label>

                  <label
                    class="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/70"
                  >
                    公開する
                    <input v-model="form.isVisible" type="checkbox" class="h-5 w-5" />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-[rgb(255,255,130)] disabled:opacity-50 lg:col-start-1 lg:row-start-2"
                :disabled="isSaving"
              >
                <Save v-if="isEditing" :size="18" :stroke-width="2.4" aria-hidden="true" />
                <Plus v-else :size="18" :stroke-width="2.4" aria-hidden="true" />
                {{ isSaving ? '保存中...' : isEditing ? '更新する' : '追加する' }}
              </button>
            </div>
          </form>
        </div>

        <section>
          <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 class="text-xl font-black">登録済み技術</h2>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                @click="openAddStackEditor"
              >
                <Plus :size="16" :stroke-width="2.4" aria-hidden="true" />
                追加する
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:text-white"
                @click="loadStacks"
              >
                <Upload :size="16" :stroke-width="2.4" aria-hidden="true" />
                再読み込み
              </button>
            </div>
          </div>

          <p
            v-if="isLoading"
            class="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/50"
          >
            読み込み中...
          </p>

          <p
            v-else-if="groupedStacks.length === 0"
            class="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/50"
          >
            登録された技術スタックがありません。
          </p>

          <div v-else class="space-y-8">
            <section
              v-for="group in groupedStacks"
              :key="group.groupName"
              class="rounded-[2rem] border border-white/10 bg-black/15 p-5"
            >
              <div
                class="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4"
              >
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                    {{ group.groupName }}
                  </p>
                  <h3 class="mt-1 text-2xl font-black text-white">
                    {{ group.groupTitle }}
                  </h3>
                </div>
                <span
                  class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/45"
                >
                  {{ group.items.length }} 件
                </span>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <article
                  v-for="item in group.items"
                  :key="item.id"
                  class="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-black/30 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="flex min-w-0 flex-1 items-center gap-4">
                      <span
                        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-3"
                      >
                        <img
                          v-if="item.iconUrl"
                          :src="item.iconUrl"
                          :alt="item.alt"
                          class="max-h-full max-w-full object-contain"
                        />
                      </span>
                      <div class="min-w-0">
                        <p
                          class="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(255,255,130)]/70"
                        >
                          #{{ item.order }}
                        </p>
                        <h4 class="mt-1 break-words text-xl font-black">
                          {{ item.name }}
                        </h4>
                      </div>
                    </div>

                    <span
                      class="shrink-0 rounded-full px-3 py-1.5 text-xs font-black"
                      :class="
                        item.isVisible
                          ? 'bg-emerald-300 text-emerald-950'
                          : 'bg-white/15 text-white/50'
                      "
                    >
                      {{ item.isVisible ? '公開' : '非公開' }}
                    </span>
                  </div>

                  <p class="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-white/55">
                    {{ item.description }}
                  </p>

                  <div class="mt-auto flex gap-2 pt-5">
                    <button
                      type="button"
                      class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                      @click="editStack(item)"
                    >
                      <Pencil :size="16" :stroke-width="2.4" aria-hidden="true" />
                      編集
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-white/60 transition hover:text-white"
                      @click="toggleVisibility(item)"
                    >
                      <Eye
                        v-if="item.isVisible"
                        :size="16"
                        :stroke-width="2.4"
                        aria-hidden="true"
                      />
                      <EyeOff v-else :size="16" :stroke-width="2.4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-full border border-red-300/20 px-4 py-2 text-red-200 transition hover:bg-red-500/10"
                      @click="deleteStack(item.id)"
                    >
                      <Trash2 :size="16" :stroke-width="2.4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
