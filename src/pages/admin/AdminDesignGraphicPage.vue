<script setup lang="ts">
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { designGraphicImageUrl, staticDesignGraphicWorks } from '../../data/designGraphicWorks';
import { db } from '../../firebase/firebase';
import { uploadImageToCloudinary } from '../../services/cloudinary';

type DesignGraphicWork = {
  id: string;
  title: string;
  category: string;
  period: string;
  description: string;
  imageUrl: string;
  logoUrl: string;
  alt: string;
  colors: string[];
  isFeatured: boolean;
  isVisible: boolean;
  order: number;
};

type DesignGraphicForm = Omit<DesignGraphicWork, 'id' | 'colors'> & {
  colorsText: string;
};

const router = useRouter();
const designGraphicsCollection = collection(db, 'designGraphics');

const designGraphics = ref<DesignGraphicWork[]>([]);
const editingId = ref<string | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isImportingLegacyDesignGraphics = ref(false);
const isEditorOpen = ref(false);
const errorMessage = ref('');
const selectedImageFile = ref<File | null>(null);
const selectedLogoFile = ref<File | null>(null);
const imagePreviewUrl = ref('');
const logoPreviewUrl = ref('');
const colorInput = ref('');

const initialForm: DesignGraphicForm = {
  title: '',
  category: '',
  period: '',
  description: '',
  imageUrl: '',
  logoUrl: '',
  alt: '',
  colorsText: '',
  isFeatured: false,
  isVisible: true,
  order: 1,
};

const form = ref<DesignGraphicForm>({ ...initialForm });

const isEditing = computed(() => editingId.value !== null);

const sortedDesignGraphics = computed(() => {
  return [...designGraphics.value].sort((current, next) => current.order - next.order);
});

const resetForm = () => {
  editingId.value = null;
  form.value = {
    ...initialForm,
    order: designGraphics.value.length + 1,
  };
  selectedImageFile.value = null;
  selectedLogoFile.value = null;
  colorInput.value = '';
  errorMessage.value = '';
};

const openAddDesignGraphicEditor = () => {
  resetForm();
  isEditorOpen.value = true;
};

const closeDesignGraphicEditor = () => {
  resetForm();
  isEditorOpen.value = false;
};

const revokeObjectUrl = (url: string) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

const parseColors = (colorsText: string) => {
  return colorsText
    .split(',')
    .map((color) => color.trim())
    .filter(Boolean);
};

const currentColors = computed(() => parseColors(form.value.colorsText));

const previewDesignImage = computed(() => imagePreviewUrl.value || form.value.imageUrl.trim());
const previewDesignLogo = computed(() => logoPreviewUrl.value || form.value.logoUrl.trim());

const setColors = (colors: string[]) => {
  form.value.colorsText = colors.join(', ');
};

const addColor = () => {
  const newColor = colorInput.value.trim();

  if (!newColor) {
    return;
  }

  const colors = currentColors.value;

  if (colors.includes(newColor)) {
    colorInput.value = '';
    return;
  }

  setColors([...colors, newColor]);
  colorInput.value = '';
};

const removeColor = (color: string) => {
  setColors(currentColors.value.filter((currentColor) => currentColor !== color));
};

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

const createDesignGraphicSlug = (title: string, index: number) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `design-graphic-${index + 1}`;
};

const createFileFromLegacyImage = async (fileName: string) => {
  const response = await fetch(designGraphicImageUrl(fileName));

  if (!response.ok) {
    throw new Error(`Legacy design graphic image fetch failed: ${fileName}`);
  }

  const blob = await response.blob();
  const fileNameParts = fileName.split('/');
  const originalName = fileNameParts[fileNameParts.length - 1] || fileName;
  const mimeExtension = blob.type === 'image/svg+xml' ? 'svg' : blob.type.split('/')[1];
  const extension = mimeExtension || originalName.split('.').pop() || 'png';
  const safeName = originalName.replace(/\.[^.]+$/, `.${extension}`);

  return new File([blob], safeName, {
    type: blob.type || 'image/png',
  });
};

const loadDesignGraphics = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const designGraphicQuery = query(designGraphicsCollection, orderBy('order', 'asc'));
    const snapshot = await getDocs(designGraphicQuery);

    designGraphics.value = snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        title: String(data.title ?? ''),
        category: String(data.category ?? ''),
        period: String(data.period ?? ''),
        description: String(data.description ?? ''),
        imageUrl: String(data.imageUrl ?? ''),
        logoUrl: String(data.logoUrl ?? ''),
        alt: String(data.alt ?? ''),
        colors: Array.isArray(data.colors) ? data.colors : [],
        isFeatured: Boolean(data.isFeatured),
        isVisible: data.isVisible !== false,
        order: Number(data.order ?? 999),
      };
    });
  } catch {
    errorMessage.value = 'デザイン作品の取得に失敗しました。';
  } finally {
    isLoading.value = false;
  }
};

const uploadLegacyImage = async (image: string, folder: string) => {
  if (/^(https?:|data:|blob:)/.test(image)) {
    return image;
  }

  if (/\.svg$/i.test(image)) {
    return image;
  }

  const file = await createFileFromLegacyImage(image);
  const result = await uploadImageToCloudinary(file, folder);

  return result.url;
};

const importLegacyDesignGraphics = async () => {
  const confirmed = window.confirm(
    '既存のDESIGN & GRAPHICデータをCloudinaryへアップロードし、Firestoreへ登録しますか？',
  );

  if (!confirmed) {
    return;
  }

  try {
    isImportingLegacyDesignGraphics.value = true;
    errorMessage.value = '';

    for (const [index, work] of staticDesignGraphicWorks.entries()) {
      const slug = createDesignGraphicSlug(work.title, index);
      const imageUrl = await uploadLegacyImage(
        work.image,
        `portfolio/design-graphic/legacy/${slug}`,
      );
      const logoUrl = work.logo
        ? await uploadLegacyImage(work.logo, `portfolio/design-graphic/legacy/${slug}/logos`)
        : '';

      await setDoc(doc(db, 'designGraphics', slug), {
        title: work.title,
        category: work.category,
        period: work.period,
        description: work.description,
        imageUrl,
        logoUrl,
        alt: work.alt,
        colors: work.colors,
        isFeatured: work.isFeatured,
        isVisible: work.isVisible,
        order: work.order,
        source: 'legacy-static',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    await loadDesignGraphics();
    closeDesignGraphicEditor();
  } catch (error) {
    console.error(error);
    errorMessage.value = `既存データの登録に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isImportingLegacyDesignGraphics.value = false;
  }
};

const setImageFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedImageFile.value = target.files?.[0] ?? null;
};

const setLogoFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedLogoFile.value = target.files?.[0] ?? null;
};

const uploadSelectedFiles = async () => {
  let imageUrl = form.value.imageUrl;
  let logoUrl = form.value.logoUrl;

  if (selectedImageFile.value) {
    const result = await uploadImageToCloudinary(
      selectedImageFile.value,
      'portfolio/design-graphic',
    );
    imageUrl = result.url;
  }

  if (selectedLogoFile.value) {
    const result = await uploadImageToCloudinary(
      selectedLogoFile.value,
      'portfolio/design-graphic/logos',
    );
    logoUrl = result.url;
  }

  return {
    imageUrl,
    logoUrl,
  };
};

const validateForm = () => {
  if (!form.value.title.trim()) {
    return 'タイトルを入力してください。';
  }

  if (!form.value.category.trim()) {
    return 'カテゴリを入力してください。';
  }

  if (!form.value.description.trim()) {
    return '説明文を入力してください。';
  }

  if (!form.value.imageUrl && !selectedImageFile.value) {
    return 'メイン画像を設定してください。';
  }

  return '';
};

const saveDesignGraphic = async () => {
  const validationMessage = validateForm();

  if (validationMessage) {
    errorMessage.value = validationMessage;
    return;
  }

  try {
    isSaving.value = true;
    errorMessage.value = '';

    const uploadedFiles = await uploadSelectedFiles();
    const payload = {
      title: form.value.title.trim(),
      category: form.value.category.trim(),
      period: form.value.period.trim(),
      description: form.value.description.trim(),
      imageUrl: uploadedFiles.imageUrl,
      logoUrl: uploadedFiles.logoUrl,
      alt: form.value.alt.trim() || form.value.title.trim(),
      colors: parseColors(form.value.colorsText),
      isFeatured: form.value.isFeatured,
      isVisible: form.value.isVisible,
      order: Number(form.value.order || 1),
      updatedAt: serverTimestamp(),
    };

    if (editingId.value) {
      await updateDoc(doc(db, 'designGraphics', editingId.value), payload);
    } else {
      await addDoc(designGraphicsCollection, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    await loadDesignGraphics();
    resetForm();
  } catch (error) {
    console.error(error);
    errorMessage.value = `保存に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isSaving.value = false;
  }
};

const toggleVisibility = async (item: DesignGraphicWork) => {
  try {
    await updateDoc(doc(db, 'designGraphics', item.id), {
      isVisible: !item.isVisible,
      updatedAt: serverTimestamp(),
    });
    await loadDesignGraphics();
  } catch (error) {
    errorMessage.value = `表示状態の更新に失敗しました: ${getErrorMessage(error)}`;
  }
};

const editDesignGraphic = (item: DesignGraphicWork) => {
  editingId.value = item.id;
  form.value = {
    title: item.title,
    category: item.category,
    period: item.period,
    description: item.description,
    imageUrl: item.imageUrl,
    logoUrl: item.logoUrl,
    alt: item.alt,
    colorsText: item.colors.join(', '),
    isFeatured: item.isFeatured,
    isVisible: item.isVisible,
    order: item.order,
  };
  selectedImageFile.value = null;
  selectedLogoFile.value = null;
  colorInput.value = '';
  errorMessage.value = '';
  isEditorOpen.value = true;
};

const deleteDesignGraphic = async (id: string) => {
  const confirmed = window.confirm('このデザイン作品を削除しますか？');

  if (!confirmed) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'designGraphics', id));
    await loadDesignGraphics();

    if (editingId.value === id) {
      closeDesignGraphicEditor();
    }
  } catch (error) {
    errorMessage.value = `削除に失敗しました: ${getErrorMessage(error)}`;
  }
};

const goBack = () => {
  router.push('/admin');
};

watch(selectedImageFile, (file, previousFile) => {
  if (previousFile) {
    revokeObjectUrl(imagePreviewUrl.value);
  }

  imagePreviewUrl.value = file ? URL.createObjectURL(file) : '';
});

watch(selectedLogoFile, (file, previousFile) => {
  if (previousFile) {
    revokeObjectUrl(logoPreviewUrl.value);
  }

  logoPreviewUrl.value = file ? URL.createObjectURL(file) : '';
});

onBeforeUnmount(() => {
  revokeObjectUrl(imagePreviewUrl.value);
  revokeObjectUrl(logoPreviewUrl.value);
});

onMounted(() => {
  loadDesignGraphics();
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
            Dashboardへ戻る
          </button>
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-white/35">
            Portfolio Admin
          </p>
          <h1 class="text-3xl font-black md:text-5xl">DESIGN & GRAPHIC 管理</h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            デザイン作品の画像、ロゴ、説明文、配色、表示順を管理します。画像はCloudinaryにアップロードし、URLをFirestoreに保存します。
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isImportingLegacyDesignGraphics || isSaving"
          @click="importLegacyDesignGraphics"
        >
          <Upload :size="17" :stroke-width="2.4" aria-hidden="true" />
          {{ isImportingLegacyDesignGraphics ? '既存データ登録中...' : '既存データを登録' }}
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
            @click="closeDesignGraphicEditor"
          ></button>

          <form
            class="relative z-10 w-full max-w-[1120px] min-w-0 rounded-[2rem] border border-white/10 bg-[rgb(27,29,32)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.6)] max-[520px]:px-4"
            @submit.prevent="saveDesignGraphic"
          >
            <div
              class="sticky -top-6 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-white/10 bg-[rgb(27,29,32)] px-6 py-5 max-[520px]:-mx-4 max-[520px]:px-4"
            >
              <div>
                <p class="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                  DESIGN EDITOR
                </p>
                <h2 class="text-xl font-black">
                  {{ isEditing ? '作品を編集' : '作品を追加' }}
                </h2>
              </div>
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                aria-label="編集画面を閉じる"
                @click="closeDesignGraphicEditor"
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
                    DESIGN
                  </span>
                </div>

                <div class="overflow-hidden rounded-lg border border-white/10 bg-[rgb(24,26,31)]">
                  <div
                    class="relative flex h-64 w-full items-center justify-center overflow-hidden bg-[rgb(18,19,23)] max-[520px]:h-52"
                  >
                    <img
                      v-if="previewDesignImage"
                      :src="designGraphicImageUrl(previewDesignImage)"
                      :alt="form.alt || form.title || 'DESIGN preview'"
                      class="h-full w-full object-contain p-3"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-sm font-bold text-white/30"
                    >
                      メイン画像を選択してください
                    </div>

                    <div
                      class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4"
                    >
                      <span
                        class="min-w-0 border border-white/10 bg-black/55 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/75 backdrop-blur"
                      >
                        {{ form.category || 'Category' }}
                      </span>
                      <span
                        class="shrink-0 border border-white/10 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold text-white/70 backdrop-blur"
                      >
                        {{ form.period || '期間' }}
                      </span>
                    </div>
                  </div>

                  <div class="p-4">
                    <div class="mb-3 flex min-h-9 items-center justify-between gap-4">
                      <img
                        v-if="previewDesignLogo"
                        :src="designGraphicImageUrl(previewDesignLogo)"
                        :alt="`${form.title || 'DESIGN'} logo`"
                        class="min-w-0 max-h-10 max-w-40 object-contain"
                      />
                      <span
                        v-else
                        class="text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >
                        Visual Identity
                      </span>
                      <span
                        v-if="form.isFeatured"
                        class="rounded-full bg-[rgb(255,255,130)] px-2 py-1 text-xs font-black text-slate-950"
                      >
                        注目
                      </span>
                    </div>

                    <h4 class="text-xl font-black leading-tight text-white">
                      {{ form.title || 'タイトル' }}
                    </h4>
                    <p class="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                      {{ form.description || '説明を入力するとここに表示されます。' }}
                    </p>

                    <ul v-if="currentColors.length" class="mt-4 flex flex-wrap gap-2">
                      <li
                        v-for="color in currentColors"
                        :key="`preview-${color}`"
                        class="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.68rem] font-bold text-white/60"
                      >
                        <span
                          class="h-3.5 w-3.5 shrink-0 border border-white/25"
                          :style="{ backgroundColor: color }"
                        ></span>
                        <span>{{ color }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <div class="space-y-5 lg:col-start-1 lg:row-start-1">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">タイトル</span>
                  <input
                    v-model="form.title"
                    type="text"
                    placeholder="例：KAZARU PROJECT"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                  />
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    一覧カードと拡大表示で使用する作品名です。
                  </p>
                </label>

                <div class="grid gap-4 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">カテゴリ</span>
                    <input
                      v-model="form.category"
                      type="text"
                      placeholder="例：Brand Design"
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                    <p class="mt-2 text-xs leading-5 text-white/35">作品の種類を短く入力します。</p>
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">期間</span>
                    <input
                      v-model="form.period"
                      type="text"
                      placeholder="例：2026"
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                    <p class="mt-2 text-xs leading-5 text-white/35">
                      制作年や制作期間を表示します。
                    </p>
                  </label>
                </div>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">説明</span>
                  <textarea
                    v-model="form.description"
                    rows="4"
                    placeholder="制作意図、担当範囲、ビジュアルの特徴を入力してください。"
                    class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                  ></textarea>
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    カードに表示される短めの説明文です。長すぎる場合は一覧で省略されます。
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">代替テキスト</span>
                  <input
                    v-model="form.alt"
                    type="text"
                    placeholder="未入力の場合はタイトルを使用します。"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                  />
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    画像が表示されない場合やアクセシビリティ用に使用します。
                  </p>
                </label>

                <div class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">配色</span>
                  <div class="flex gap-2">
                    <input
                      v-model="colorInput"
                      type="text"
                      placeholder="例：#000000"
                      class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                      @keydown.enter.prevent="addColor"
                    />
                    <button
                      type="button"
                      class="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                      @click="addColor"
                    >
                      追加
                    </button>
                  </div>

                  <ul v-if="currentColors.length" class="mt-3 flex flex-wrap gap-2">
                    <li
                      v-for="color in currentColors"
                      :key="color"
                      class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/70"
                    >
                      <span
                        class="h-3.5 w-3.5 rounded-full border border-white/30"
                        :style="{ backgroundColor: color }"
                      ></span>
                      <span>{{ color }}</span>
                      <button
                        type="button"
                        class="text-white/35 transition hover:text-red-200"
                        :aria-label="`${color}を削除`"
                        @click="removeColor(color)"
                      >
                        <X :size="14" :stroke-width="2.4" aria-hidden="true" />
                      </button>
                    </li>
                  </ul>

                  <p v-else class="mt-3 text-xs leading-5 text-white/35">
                    配色が未登録です。HEXカラーを入力後、「追加」をクリックしてください。
                  </p>
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    メイン画面のColors表示に使用します。ブランドカラーや背景色を3色前後で登録すると見やすくなります。
                  </p>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">メイン画像</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950"
                      @change="setImageFile"
                    />
                    <p v-if="selectedImageFile" class="mt-2 text-xs text-white/35">
                      選択中: {{ selectedImageFile.name }}
                    </p>
                    <p class="mt-2 text-xs leading-5 text-white/35">
                      一覧カードと拡大表示に使用するメインビジュアルです。
                    </p>
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">ロゴ画像</span>
                    <input
                      type="file"
                      accept="image/*,.svg"
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950"
                      @change="setLogoFile"
                    />
                    <p v-if="selectedLogoFile" class="mt-2 text-xs text-white/35">
                      選択中: {{ selectedLogoFile.name }}
                    </p>
                    <p class="mt-2 text-xs leading-5 text-white/35">
                      任意項目です。登録するとカード内にロゴを表示します。
                    </p>
                  </label>
                </div>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">メイン画像URL</span>
                  <input
                    v-model="form.imageUrl"
                    type="text"
                    placeholder="Cloudinaryアップロード後は自動で設定されます。"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                  />
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    既にCloudinaryなどの画像URLがある場合は直接入力できます。
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">ロゴURL</span>
                  <input
                    v-model="form.logoUrl"
                    type="text"
                    placeholder="任意。ロゴ画像URLを入力します。"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                  />
                  <p class="mt-2 text-xs leading-5 text-white/35">
                    空の場合はロゴなしの作品として表示されます。
                  </p>
                </label>

                <div class="grid gap-4 md:grid-cols-3">
                  <label class="block">
                    <span class="mb-2 block text-sm font-bold text-white/60">表示順</span>
                    <input
                      v-model.number="form.order"
                      type="number"
                      min="1"
                      class="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-white outline-none transition focus:border-white/40"
                    />
                    <p class="mt-2 text-xs leading-5 text-white/35">
                      数字が小さい作品から順番に表示されます。
                    </p>
                  </label>

                  <div class="md:mt-7">
                    <label
                      class="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white/70"
                    >
                      注目表示
                      <input v-model="form.isFeatured" type="checkbox" class="h-5 w-5" />
                    </label>
                    <p class="mt-2 text-xs leading-5 text-white/35">
                      ONにするとメイン画面で横幅を広く使って表示します。
                    </p>
                  </div>

                  <div class="md:mt-7">
                    <label
                      class="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white/70"
                    >
                      公開する
                      <input v-model="form.isVisible" type="checkbox" class="h-5 w-5" />
                    </label>
                    <p class="mt-2 text-xs leading-5 text-white/35">
                      OFFにするとFirestoreには残したままメイン画面では非表示になります。
                    </p>
                  </div>
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
            <h2 class="text-xl font-black">登録済み作品</h2>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                @click="openAddDesignGraphicEditor"
              >
                <Plus :size="16" :stroke-width="2.4" aria-hidden="true" />
                追加する
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:text-white"
                @click="loadDesignGraphics"
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

          <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="item in sortedDesignGraphics"
              :key="item.id"
              class="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
            >
              <div class="relative h-52 bg-black/40">
                <img
                  v-if="item.imageUrl"
                  :src="designGraphicImageUrl(item.imageUrl)"
                  :alt="item.alt"
                  class="h-full w-full object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="absolute left-5 top-5 flex gap-2">
                  <span
                    class="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur"
                  >
                    #{{ item.order }}
                  </span>
                  <span
                    class="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur"
                  >
                    {{ item.period || '期間未設定' }}
                  </span>
                </div>
                <span
                  class="absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-black"
                  :class="
                    item.isVisible ? 'bg-emerald-300 text-emerald-950' : 'bg-white/15 text-white/50'
                  "
                >
                  {{ item.isVisible ? '公開' : '非公開' }}
                </span>
                <div class="absolute bottom-5 left-5 right-5">
                  <img
                    v-if="item.logoUrl"
                    :src="designGraphicImageUrl(item.logoUrl)"
                    :alt="`${item.title} logo`"
                    class="mb-3 max-h-10 max-w-36 object-contain"
                  />
                  <h3 class="text-2xl font-black">
                    {{ item.title }}
                  </h3>
                </div>
              </div>

              <div class="flex flex-1 flex-col p-5">
                <div
                  class="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[rgb(255,255,130)]/80"
                >
                  <span>{{ item.category }}</span>
                  <span
                    v-if="item.isFeatured"
                    class="rounded-full bg-[rgb(255,255,130)] px-2 py-1 text-slate-950"
                    >注目</span
                  >
                </div>
                <p class="line-clamp-2 text-sm leading-6 text-white/55">
                  {{ item.description }}
                </p>
                <ul class="mt-4 flex flex-wrap gap-2">
                  <li
                    v-for="color in item.colors"
                    :key="`${item.id}-${color}`"
                    class="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60"
                  >
                    <span
                      class="h-3 w-3 rounded-full border border-white/30"
                      :style="{ backgroundColor: color }"
                    ></span>
                    {{ color }}
                  </li>
                </ul>

                <div class="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                    @click="editDesignGraphic(item)"
                  >
                    <Pencil :size="16" :stroke-width="2.4" aria-hidden="true" />
                    編集
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-white/60 transition hover:text-white"
                    @click="toggleVisibility(item)"
                  >
                    <Eye v-if="item.isVisible" :size="16" :stroke-width="2.4" aria-hidden="true" />
                    <EyeOff v-else :size="16" :stroke-width="2.4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-full border border-red-300/20 px-4 py-2 text-red-200 transition hover:bg-red-500/10"
                    @click="deleteDesignGraphic(item.id)"
                  >
                    <Trash2 :size="16" :stroke-width="2.4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
