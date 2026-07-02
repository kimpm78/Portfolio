export type StackItemData = {
  groupName: string
  groupTitle: string
  name: string
  description: string
  icon: string
  alt: string
  order: number
  imageClass?: string
}

export type StackGroupData = {
  id: string
  title: string
  items: StackItemData[]
}

export const stackGroupOrder = ['Frontend', 'Backend', 'Database', 'Tool']

export const compareStackGroups = (currentGroupName: string, nextGroupName: string) => {
  const currentIndex = stackGroupOrder.indexOf(currentGroupName)
  const nextIndex = stackGroupOrder.indexOf(nextGroupName)

  if (currentIndex === -1 && nextIndex === -1) {
    return currentGroupName.localeCompare(nextGroupName)
  }

  if (currentIndex === -1) {
    return 1
  }

  if (nextIndex === -1) {
    return -1
  }

  return currentIndex - nextIndex
}

export const stackIconUrl = (fileName: string) => {
  if (/^(https?:|data:|blob:)/.test(fileName)) {
    return fileName
  }

  return new URL(`../img/stack_icon/${fileName}`, import.meta.url).href
}

export const staticStackItems: StackItemData[] = [
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'HTML5',
    description: 'セマンティックな構造を意識し、保守しやすくアクセシビリティにも配慮したマークアップを行うことができます。',
    icon: 'html5.png',
    alt: 'HTML5',
    order: 1,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'CSS3',
    description: 'FlexboxやGrid、メディアクエリを活用し、PC・スマートフォンに対応したレスポンシブUIを実装することができます。',
    icon: 'css3.png',
    alt: 'CSS3',
    order: 2,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'JavaScript',
    description: 'DOM操作、イベント処理、非同期通信を理解し、画面制御やフォームバリデーションなどの実装に活用できます。',
    icon: 'js.png',
    alt: 'JavaScript',
    order: 3,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'TypeScript',
    description: '型定義を活用し、VueやReactでのコンポーネント実装において可読性と保守性を意識した開発ができます。',
    icon: 'Typescript.png',
    alt: 'TypeScript',
    order: 4,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'Vue 3',
    description: 'Composition APIやコンポーネント設計を活用し、ポートフォリオサイトや管理画面のUI実装に使用しています。',
    icon: 'vue.svg',
    alt: 'Vue 3',
    order: 5,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'React',
    description: 'Hooksやコンポーネント設計を活用し、ユーザー画面や管理画面など再利用性を意識したUIを構築できます。',
    icon: 'reactjs.png',
    alt: 'React',
    order: 6,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'Next.js',
    description: 'ルーティングや画面構成を理解し、ReactベースのWebアプリケーション開発やSPA構成の実装に活用できます。',
    icon: 'nextjs.png',
    alt: 'Next.js',
    order: 7,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'Sass',
    description: 'SCSSのネストや変数、共通化を活用し、保守しやすいスタイル設計とレスポンシブ対応を行うことができます。',
    icon: 'sass.png',
    alt: 'Sass',
    order: 8,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'jQuery',
    description: '既存サイトの改修において、DOM操作やイベント制御、UIアニメーションの調整に活用することができます。',
    icon: 'jquery.png',
    alt: 'jQuery',
    order: 9,
  },
  {
    groupName: 'Backend',
    groupTitle: '# BACKEND',
    name: 'Node.js',
    description: '開発環境構築やフロントエンドビルド環境の設定に活用し、VueやViteを用いた開発を進めることができます。',
    icon: 'nodejs.png',
    alt: 'Node.js',
    order: 1,
  },
  {
    groupName: 'Backend',
    groupTitle: '# BACKEND',
    name: 'PHP',
    description: 'WordPressのテンプレート改修やフォーム処理、Laravelでのサーバーサイド実装に活用することができます。',
    icon: 'php.png',
    alt: 'PHP',
    order: 2,
  },
  {
    groupName: 'Backend',
    groupTitle: '# BACKEND',
    name: 'Laravel',
    description: 'MVC構成を理解し、ルーティング、コントローラ、CRUD機能、API連携を含むWebアプリケーションを実装できます。',
    icon: 'laravel.png',
    alt: 'Laravel',
    order: 3,
  },
  {
    groupName: 'Database',
    groupTitle: '# DATABASE',
    name: 'MySQL',
    description: '会員登録やログイン機能などで使用するテーブル設計、CRUD処理、基本的なデータ管理を行うことができます。',
    icon: 'mysql.png',
    alt: 'MySQL',
    order: 1,
    imageClass: 'h-12',
  },
  {
    groupName: 'Database',
    groupTitle: '# DATABASE',
    name: 'PostgreSQL',
    description: 'ECサイトや注文管理システムにおける商品、注文、会員関連テーブルの設計とデータ操作を行うことができます。',
    icon: 'postSQL.png',
    alt: 'PostgreSQL',
    order: 2,
    imageClass: 'h-12',
  },
  {
    groupName: 'Database',
    groupTitle: '# DATABASE',
    name: 'MongoDB',
    description: 'NoSQLのデータ構造を理解し、APIレスポンス制御やアプリケーションと連携したデータ処理に活用できます。',
    icon: 'mongodb.png',
    alt: 'MongoDB',
    order: 3,
    imageClass: 'h-12',
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'VS Code',
    description: '主な開発エディタとして使用し、拡張機能やフォーマッターを活用して効率的にコーディングを行っています。',
    icon: 'vscode.png',
    alt: 'VisualStudio code',
    order: 1,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Vite',
    description: 'Vue 3 / TypeScript の開発環境として使用し、高速な開発サーバーとビルド環境の構築に活用しています。',
    icon: 'vite.svg',
    alt: 'Vite',
    order: 2,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Bun',
    description: 'パッケージ管理やスクリプト実行に使用し、フロントエンド開発環境の効率化に活用しています。',
    icon: 'bun.svg',
    alt: 'Bun',
    order: 3,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Firebase',
    description: 'AuthenticationとFirestoreを利用し、管理者ログインやコンテンツデータの管理機能に活用しています。',
    icon: 'firebase.svg',
    alt: 'Firebase',
    order: 4,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Cloudinary',
    description: '画像アップロードや画像URL管理に使用し、ポートフォリオ内の画像管理機能に活用しています。',
    icon: 'cloudinary.svg',
    alt: 'Cloudinary',
    order: 5,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'GitHub',
    description: 'ソースコード管理、ブランチ運用、GitHub Pagesでの公開など、開発からデプロイまで活用しています。',
    icon: 'git.png',
    alt: 'GitHub',
    order: 6,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Postman',
    description: 'APIリクエストやレスポンスを確認し、認証、入力チェック、エラーハンドリングの動作検証に活用できます。',
    icon: 'postman.png',
    alt: 'Postman',
    order: 7,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Figma',
    description: '画面設計、遷移設計、レスポンシブUIの検討に使用し、実装前のデザイン確認や仕様整理に活用できます。',
    icon: 'figma.png',
    alt: 'Figma',
    order: 8,
    imageClass: 'h-12',
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Adobe Illustrator',
    description: 'アイコンやロゴ、ベクター素材の制作に使用し、デザイン要素の作成や調整を行うことができます。',
    icon: 'illustrator.png',
    alt: 'Adobe Illustrator',
    order: 9,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'Adobe Photoshop',
    description: '画像加工、バナー作成、モックアップ制作など、Webやグラフィック素材の作成に活用することができます。',
    icon: 'photoshop.png',
    alt: 'Adobe Photoshop',
    order: 10,
  },
  {
    groupName: 'Tool',
    groupTitle: '# DEVELOPMENT TOOLS',
    name: 'JSON',
    description: 'APIレスポンスや設定データの構造を理解し、フロントエンドでのデータ表示や管理機能に活用できます。',
    icon: 'json.png',
    alt: 'JSON',
    order: 11,
  },
]

export const createStackGroups = (items: StackItemData[]): StackGroupData[] => {
  const groupMap = new Map<string, StackGroupData>()

  for (const item of items) {
    if (!groupMap.has(item.groupName)) {
      groupMap.set(item.groupName, {
        id: `${item.groupName.toLowerCase()}Stack`,
        title: item.groupTitle,
        items: [],
      })
    }

    groupMap.get(item.groupName)?.items.push(item)
  }

  return Array.from(groupMap.values())
    .sort((current, next) => compareStackGroups(current.items[0]?.groupName ?? '', next.items[0]?.groupName ?? ''))
    .map((group) => ({
      ...group,
      items: [...group.items].sort((current, next) => current.order - next.order),
    }))
}
