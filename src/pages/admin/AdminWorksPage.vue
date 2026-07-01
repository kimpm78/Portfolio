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
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Link,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { staticWorkProjects, workImageUrl } from '../../data/workProjects';
import { db } from '../../firebase/firebase';
import { uploadImageToCloudinary } from '../../services/cloudinary';

type WorkLink = {
  label: string;
  url: string;
};

type WorkProject = {
  id: string;
  title: string;
  subTitle: string;
  description: string;
  moreDescription: string;
  imageUrl: string;
  imageUrls: string[];
  imageAlt: string;
  tags: string[];
  links: WorkLink[];
  isMobileImage: boolean;
  isVisible: boolean;
  order: number;
};

type WorkProjectForm = Omit<WorkProject, 'id' | 'tags' | 'links' | 'imageUrls'> & {
  tagsText: string;
  githubUrl: string;
  figmaUrl: string;
  demoUrl: string;
  galleryImageUrl1: string;
  galleryImageUrl2: string;
  galleryImageUrl3: string;
  galleryImageUrl4: string;
};

const router = useRouter();
const worksCollection = collection(db, 'works');

const works = ref<WorkProject[]>([]);
const editingId = ref<string | null>(null);
const maxGalleryImages = 4;
const isLoading = ref(false);
const isSaving = ref(false);
const isImportingLegacyWorks = ref(false);
const isEditorOpen = ref(false);
const errorMessage = ref('');
const selectedMainImageFile = ref<File | null>(null);
const selectedGalleryFiles = ref<File[]>([]);
const tagInput = ref('');

const initialForm: WorkProjectForm = {
  title: '',
  subTitle: '',
  description: '',
  moreDescription: '',
  imageUrl: '',
  imageAlt: '',
  tagsText: '',
  isMobileImage: false,
  githubUrl: '',
  figmaUrl: '',
  demoUrl: '',
  galleryImageUrl1: '',
  galleryImageUrl2: '',
  galleryImageUrl3: '',
  galleryImageUrl4: '',
  isVisible: true,
  order: 1,
};

const form = ref<WorkProjectForm>({ ...initialForm });

const isEditing = computed(() => editingId.value !== null);

const sortedWorks = computed(() => {
  return [...works.value].sort((current, next) => current.order - next.order);
});

const resetForm = () => {
  editingId.value = null;
  form.value = {
    ...initialForm,
    order: works.value.length + 1,
  };
  selectedMainImageFile.value = null;
  selectedGalleryFiles.value = [];
  tagInput.value = '';
  errorMessage.value = '';
};

const openAddWorkEditor = () => {
  resetForm();
  isEditorOpen.value = true;
};

const closeWorkEditor = () => {
  resetForm();
  isEditorOpen.value = false;
};

const parseTags = (tagsText: string) => {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};
const currentTags = computed(() => parseTags(form.value.tagsText));

const setTags = (tags: string[]) => {
  form.value.tagsText = tags.join(', ');
};

const addTag = () => {
  const newTag = tagInput.value.trim();

  if (!newTag) {
    return;
  }

  const tags = currentTags.value;

  if (tags.includes(newTag)) {
    tagInput.value = '';
    return;
  }

  setTags([...tags, newTag]);
  tagInput.value = '';
};

const removeTag = (tag: string) => {
  setTags(currentTags.value.filter((currentTag) => currentTag !== tag));
};

const createGalleryImageUrls = () => {
  return [
    form.value.galleryImageUrl1.trim(),
    form.value.galleryImageUrl2.trim(),
    form.value.galleryImageUrl3.trim(),
    form.value.galleryImageUrl4.trim(),
  ].filter(Boolean);
};

const setGalleryImageUrls = (imageUrls: string[]) => {
  const limitedImageUrls = imageUrls.slice(0, maxGalleryImages);

  form.value.galleryImageUrl1 = limitedImageUrls[0] ?? '';
  form.value.galleryImageUrl2 = limitedImageUrls[1] ?? '';
  form.value.galleryImageUrl3 = limitedImageUrls[2] ?? '';
  form.value.galleryImageUrl4 = limitedImageUrls[3] ?? '';
};

const createLinks = (): WorkLink[] => {
  return [
    { label: 'GitHub', url: form.value.githubUrl.trim() },
    { label: 'Figma', url: form.value.figmaUrl.trim() },
    { label: 'Demo', url: form.value.demoUrl.trim() },
  ].filter((link) => link.url);
};

const findLinkUrl = (links: WorkLink[], label: string) => {
  const normalizedLabel = label.toLowerCase();
  const link = links.find((item) => item.label.toLowerCase().includes(normalizedLabel));

  return link?.url ?? '';
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

const createWorkSlug = (title: string, index: number) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `work-${index + 1}`;
};

const createFileFromLegacyImage = async (fileName: string) => {
  const response = await fetch(workImageUrl(fileName));

  if (!response.ok) {
    throw new Error(`Legacy image fetch failed: ${fileName}`);
  }

  const blob = await response.blob();

  return new File([blob], fileName, {
    type: blob.type || 'image/png',
  });
};

const loadWorks = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const worksQuery = query(worksCollection, orderBy('order', 'asc'));
    const snapshot = await getDocs(worksQuery);

    works.value = snapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        title: String(data.title ?? ''),
        subTitle: String(data.subTitle ?? ''),
        description: String(data.description ?? ''),
        moreDescription: String(data.moreDescription ?? ''),
        imageUrl: String(data.imageUrl ?? ''),
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        imageAlt: String(data.imageAlt ?? ''),
        tags: Array.isArray(data.tags) ? data.tags : [],
        links: Array.isArray(data.links) ? data.links : [],
        isMobileImage: Boolean(data.isMobileImage),
        isVisible: data.isVisible !== false,
        order: Number(data.order ?? 999),
      };
    });
  } catch {
    errorMessage.value = 'プロジェクトの取得に失敗しました。';
  } finally {
    isLoading.value = false;
  }
};

const importLegacyWorks = async () => {
  const confirmed = window.confirm(
    '既存のWORKSデータをCloudinaryへアップロードし、Firestoreへ登録しますか？',
  );

  if (!confirmed) {
    return;
  }

  try {
    isImportingLegacyWorks.value = true;
    errorMessage.value = '';

    for (const [index, project] of staticWorkProjects.entries()) {
      const slug = createWorkSlug(project.title, index);
      const uploadedImageUrls: string[] = [];

      for (const image of project.images) {
        if (/^(https?:|data:|blob:)/.test(image)) {
          uploadedImageUrls.push(image);
          continue;
        }

        const file = await createFileFromLegacyImage(image);
        const result = await uploadImageToCloudinary(file, `portfolio/works/legacy/${slug}`);
        uploadedImageUrls.push(result.url);
      }

      await setDoc(doc(db, 'works', slug), {
        title: project.title,
        subTitle: project.subTitle,
        description: project.description,
        moreDescription: project.moreDescription ?? '',
        imageUrl: uploadedImageUrls[0],
        imageUrls: uploadedImageUrls.slice(1, maxGalleryImages + 1),
        imageAlt: project.imageAlt,
        tags: project.tags,
        links: project.links,
        isMobileImage: Boolean(project.isMobileImage),
        isVisible: true,
        order: project.order ?? index + 1,
        source: 'legacy-static',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    await loadWorks();
    resetForm();
  } catch (error) {
    console.error(error);
    errorMessage.value = `既存データの登録に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isImportingLegacyWorks.value = false;
  }
};

const setMainImageFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedMainImageFile.value = target.files?.[0] ?? null;
};

const setGalleryFiles = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedGalleryFiles.value = Array.from(target.files ?? []).slice(0, maxGalleryImages);
};

const uploadSelectedImages = async () => {
  let imageUrl = form.value.imageUrl;
  const imageUrls = createGalleryImageUrls();

  if (selectedMainImageFile.value) {
    const result = await uploadImageToCloudinary(
      selectedMainImageFile.value,
      'portfolio/works/main',
    );
    imageUrl = result.url;
    form.value.imageUrl = result.url;
  }

  if (selectedGalleryFiles.value.length > 0) {
    const uploadedImageUrls = await Promise.all(
      selectedGalleryFiles.value.map(async (file) => {
        const result = await uploadImageToCloudinary(file, 'portfolio/works/gallery');
        return result.url;
      }),
    );

    imageUrls.push(...uploadedImageUrls);
  }

  imageUrls.splice(maxGalleryImages);
  setGalleryImageUrls(imageUrls);

  selectedMainImageFile.value = null;
  selectedGalleryFiles.value = [];

  return {
    imageUrl,
    imageUrls,
  };
};

const validateForm = () => {
  if (!form.value.title.trim()) {
    return 'タイトルを入力してください。';
  }

  if (!form.value.description.trim()) {
    return '説明文を入力してください。';
  }

  if (!form.value.imageUrl && !selectedMainImageFile.value) {
    return 'メイン画像を設定してください。';
  }

  if (createGalleryImageUrls().length + selectedGalleryFiles.value.length > maxGalleryImages) {
    return `ギャラリー画像は最大${maxGalleryImages}枚までです。`;
  }

  return '';
};

const saveWork = async () => {
  const validationMessage = validateForm();

  if (validationMessage) {
    errorMessage.value = validationMessage;
    return;
  }

  try {
    isSaving.value = true;
    errorMessage.value = '';

    const uploadedImages = await uploadSelectedImages();
    const payload = {
      title: form.value.title.trim(),
      subTitle: form.value.subTitle.trim(),
      description: form.value.description.trim(),
      moreDescription: form.value.moreDescription.trim(),
      imageUrl: uploadedImages.imageUrl,
      imageUrls: uploadedImages.imageUrls,
      imageAlt: form.value.imageAlt.trim() || form.value.title.trim(),
      tags: parseTags(form.value.tagsText),
      links: createLinks(),
      isMobileImage: form.value.isMobileImage,
      isVisible: form.value.isVisible,
      order: Number(form.value.order || 1),
      updatedAt: serverTimestamp(),
    };

    if (editingId.value) {
      await updateDoc(doc(db, 'works', editingId.value), payload);
    } else {
      await addDoc(worksCollection, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    await loadWorks();
    closeWorkEditor();
  } catch (error) {
    console.error(error);
    errorMessage.value = `保存に失敗しました: ${getErrorMessage(error)}`;
  } finally {
    isSaving.value = false;
  }
};

const editWork = (item: WorkProject) => {
  editingId.value = item.id;
  form.value = {
    title: item.title,
    subTitle: item.subTitle,
    description: item.description,
    moreDescription: item.moreDescription,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    tagsText: item.tags.join(', '),
    githubUrl: findLinkUrl(item.links, 'github'),
    figmaUrl: findLinkUrl(item.links, 'figma'),
    demoUrl: findLinkUrl(item.links, 'demo'),
    galleryImageUrl1: item.imageUrls[0] ?? '',
    galleryImageUrl2: item.imageUrls[1] ?? '',
    galleryImageUrl3: item.imageUrls[2] ?? '',
    galleryImageUrl4: item.imageUrls[3] ?? '',
    isMobileImage: item.isMobileImage,
    isVisible: item.isVisible,
    order: item.order,
  };
  selectedMainImageFile.value = null;
  selectedGalleryFiles.value = [];
  tagInput.value = '';
  errorMessage.value = '';
  isEditorOpen.value = true;
};

const toggleVisibility = async (item: WorkProject) => {
  try {
    await updateDoc(doc(db, 'works', item.id), {
      isVisible: !item.isVisible,
      updatedAt: serverTimestamp(),
    });
    await loadWorks();
  } catch {
    errorMessage.value = '表示状態の更新に失敗しました。';
  }
};

const deleteWork = async (id: string) => {
  const confirmed = window.confirm('このプロジェクトを削除しますか？');

  if (!confirmed) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'works', id));
    await loadWorks();

    if (editingId.value === id) {
      closeWorkEditor();
    }
  } catch {
    errorMessage.value = '削除に失敗しました。';
  }
};

const goBack = () => {
  router.push('/admin');
};

onMounted(() => {
  loadWorks();
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
          <h1 class="text-3xl font-black md:text-5xl">WORKS 管理</h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            開発プロジェクトの画像、説明、タグ、外部リンク、表示順を管理します。画像はCloudinaryにアップロードし、URLをFirestoreに保存します。
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isImportingLegacyWorks || isSaving"
          @click="importLegacyWorks"
        >
          <Upload :size="17" :stroke-width="2.4" aria-hidden="true" />
          {{ isImportingLegacyWorks ? '既存データ登録中...' : '既存データを登録' }}
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
            @click="closeWorkEditor"
          ></button>

          <form
            class="relative z-10 w-full max-w-[760px] min-w-0 rounded-[2rem] border border-white/10 bg-[rgb(27,29,32)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.6)] max-[520px]:px-4"
            @submit.prevent="saveWork"
          >
            <div
              class="sticky -top-6 z-20 -mx-6 mb-6 flex items-center justify-between gap-4 border-b border-white/10 bg-[rgb(27,29,32)] px-6 py-5 max-[520px]:-mx-4 max-[520px]:px-4"
            >
              <div>
                <p class="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                  WORKS EDITOR
                </p>
                <h2 class="text-xl font-black">
                  {{ isEditing ? 'プロジェクトを編集' : 'プロジェクトを追加' }}
                </h2>
              </div>
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                aria-label="編集画面を閉じる"
                @click="closeWorkEditor"
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

            <div class="space-y-5">
              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">プロジェクト名</span>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="例：ポートフォリオ管理システム"
                  class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">サブタイトル</span>
                <input
                  v-model="form.subTitle"
                  type="text"
                  placeholder="例：Vue 3 / Firebase によるポートフォリオ管理"
                  class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">概要</span>
                <textarea
                  v-model="form.description"
                  rows="4"
                  placeholder="一覧やカードに表示する短めの説明文を入力してください。"
                  class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                ></textarea>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">詳細説明</span>
                <textarea
                  v-model="form.moreDescription"
                  rows="5"
                  placeholder="モーダルや詳細表示で使用する補足説明を入力してください。担当範囲、工夫した点、実装内容などを記載します。"
                  class="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                ></textarea>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">画像の代替テキスト</span>
                <input
                  v-model="form.imageAlt"
                  type="text"
                  placeholder="未入力の場合はプロジェクト名を使用します。"
                  class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                />
              </label>

              <div class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">使用技術タグ</span>
                <div class="flex gap-2">
                  <input
                    v-model="tagInput"
                    type="text"
                    placeholder="例：Vue.js"
                    class="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    @keydown.enter.prevent="addTag"
                  />
                  <button
                    type="button"
                    class="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                    @click="addTag"
                  >
                    追加
                  </button>
                </div>

                <ul v-if="currentTags.length" class="mt-3 flex flex-wrap gap-2">
                  <li
                    v-for="tag in currentTags"
                    :key="tag"
                    class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/70"
                  >
                    <span>{{ tag }}</span>
                    <button
                      type="button"
                      class="text-white/35 transition hover:text-red-200"
                      :aria-label="`${tag}を削除`"
                      @click="removeTag(tag)"
                    >
                      <X :size="14" :stroke-width="2.4" aria-hidden="true" />
                    </button>
                  </li>
                </ul>

                <p v-else class="mt-3 text-xs leading-5 text-white/35">
                  タグが未登録です。入力後、「追加」をクリックしてください。
                </p>
              </div>
              <div class="block">
                <span class="mb-2 block text-sm font-bold text-white/60">関連リンク</span>
                <div class="grid gap-3">
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >GitHub</span
                    >
                    <input
                      v-model="form.githubUrl"
                      type="url"
                      placeholder="https://github.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >Figma</span
                    >
                    <input
                      v-model="form.figmaUrl"
                      type="url"
                      placeholder="https://figma.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >Demo</span
                    >
                    <input
                      v-model="form.demoUrl"
                      type="url"
                      placeholder="https://example.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                </div>
                <p class="mt-2 text-xs leading-5 text-white/35">
                  URLが空のリンクは保存されず、画面にも表示されません。
                </p>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">メイン画像</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950"
                    @change="setMainImageFile"
                  />
                  <p v-if="selectedMainImageFile" class="mt-2 text-xs text-white/35">
                    選択中: {{ selectedMainImageFile.name }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60"
                    >ギャラリー画像（最大：4枚）</span
                  >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-slate-950"
                    @change="setGalleryFiles"
                  />
                  <p v-if="selectedGalleryFiles.length" class="mt-2 text-xs text-white/35">
                    選択中: {{ selectedGalleryFiles.length }}枚
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
              </label>

              <div class="block">
                <span class="mb-2 block text-sm font-bold text-white/60"
                  >ギャラリー画像URL（最大：4枚）</span
                >
                <div class="grid gap-3">
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >Gallery 1</span
                    >
                    <input
                      v-model="form.galleryImageUrl1"
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >Gallery 2</span
                    >
                    <input
                      v-model="form.galleryImageUrl2"
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >Gallery 3</span
                    >
                    <input
                      v-model="form.galleryImageUrl3"
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                  <label class="block">
                    <span
                      class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-white/35"
                      >Gallery 4</span
                    >
                    <input
                      v-model="form.galleryImageUrl4"
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/40"
                    />
                  </label>
                </div>
                <p class="mt-2 text-xs leading-5 text-white/35">
                  空のURLは保存されません。アップロードした画像は空き枠へ追加されます。
                </p>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <label class="block">
                  <span class="mb-2 block text-sm font-bold text-white/60">表示順</span>
                  <input
                    v-model.number="form.order"
                    type="number"
                    min="1"
                    class="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-white outline-none transition focus:border-white/40"
                  />
                </label>

                <label
                  class="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white/70 md:mt-7"
                >
                  モバイル画像
                  <input v-model="form.isMobileImage" type="checkbox" class="h-5 w-5" />
                </label>

                <label
                  class="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white/70 md:mt-7"
                >
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
        </div>

        <section>
          <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 class="text-xl font-black">登録済みプロジェクト</h2>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                @click="openAddWorkEditor"
              >
                <Plus :size="16" :stroke-width="2.4" aria-hidden="true" />
                追加する
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:text-white"
                @click="loadWorks"
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
              v-for="item in sortedWorks"
              :key="item.id"
              class="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
            >
              <div class="relative h-52 bg-black/40">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.imageAlt"
                  class="h-full w-full object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent"></div>
                <div class="absolute left-5 top-5 flex gap-2">
                  <span
                    class="rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur"
                  >
                    #{{ item.order }}
                  </span>
                  <span
                    v-if="item.isMobileImage"
                    class="rounded-full bg-[rgb(255,255,130)] px-3 py-1.5 text-xs font-black text-slate-950"
                  >
                    モバイル
                  </span>
                  <span
                    v-if="item.imageUrls.length"
                    class="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur"
                  >
                    +{{ item.imageUrls.length }} ギャラリー
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
                  <p
                    class="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(255,255,130)]/80"
                  >
                    {{ item.subTitle || 'No subtitle' }}
                  </p>
                  <h3 class="mt-1 text-2xl font-black">
                    {{ item.title }}
                  </h3>
                </div>
              </div>

              <div class="flex flex-1 flex-col p-5">
                <p class="line-clamp-2 min-h-[48px] text-sm leading-6 text-white/55">
                  {{ item.description }}
                </p>

                <ul class="mt-4 flex flex-wrap gap-2">
                  <li
                    v-for="tag in item.tags"
                    :key="`${item.id}-${tag}`"
                    class="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60"
                  >
                    {{ tag }}
                  </li>
                </ul>

                <div
                  v-if="item.links.length"
                  class="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[rgb(255,255,130)]/80"
                >
                  <span
                    v-for="link in item.links"
                    :key="`${item.id}-${link.url}`"
                    class="inline-flex items-center gap-1.5"
                  >
                    <Link :size="13" :stroke-width="2.4" aria-hidden="true" />
                    {{ link.label }}
                  </span>
                </div>

                <div class="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-[rgb(255,255,130)]"
                    @click="editWork(item)"
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
                    @click="deleteWork(item.id)"
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
