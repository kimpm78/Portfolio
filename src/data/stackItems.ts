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
    description: 'WEBアクセシビリティと標準準拠を遵守し、セマンティックタグを使用してマークアップすることができます。',
    icon: 'html5.png',
    alt: 'HTML5',
    order: 1,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'CSS3',
    description: 'positionおよびdisplayプロパティを適切に活用して、レスポンシブWebを適用することができます。',
    icon: 'css3.png',
    alt: 'CSS3',
    order: 2,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'JavaScript',
    description: '配列、条件分岐、メソッド、DOMを理解し、さまざまな状況に適用することができます。',
    icon: 'js.png',
    alt: 'JavaScript',
    order: 3,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'TypeScript',
    description: '型定義を活用し、コードの可読性と保守性を高めながら実装することができます。',
    icon: 'Typescript.png',
    alt: 'TypeScript',
    order: 4,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'React',
    description: 'フックやコンポーネント設計を理解し、再利用性の高いUIを構築することができます。',
    icon: 'reactjs.png',
    alt: 'React',
    order: 5,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'Next.js',
    description: 'SSRや静的サイト生成を活用し、効率的なWebアプリケーションを構築することができます。',
    icon: 'nextjs.png',
    alt: 'Next.js',
    order: 6,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'Sass',
    description: 'SCSSの文法とモジュール化を活用し、スタイルを整理しながら実装することができます。',
    icon: 'sass.png',
    alt: 'Sass',
    order: 7,
  },
  {
    groupName: 'Frontend',
    groupTitle: '# FRONTEND',
    name: 'jQuery',
    description: 'DOM操作やイベント処理を理解し、既存サイトの動きやUI制御に活用することができます。',
    icon: 'jquery.png',
    alt: 'jQuery',
    order: 8,
  },
  {
    groupName: 'Backend',
    groupTitle: '# BACKEND',
    name: 'Node.js',
    description: 'サーバーのAPIを構築し、DBと連携してCRUD機能を実行することができます。',
    icon: 'nodejs.png',
    alt: 'Node.js',
    order: 1,
  },
  {
    groupName: 'Backend',
    groupTitle: '# BACKEND',
    name: 'PHP',
    description: '基本的な構文とサーバーサイド処理を理解し、Webアプリケーション開発に活用することができます。',
    icon: 'php.png',
    alt: 'PHP',
    order: 2,
  },
  {
    groupName: 'Backend',
    groupTitle: '# BACKEND',
    name: 'Laravel',
    description: 'MVC構造を理解し、ルーティングやデータ連携を含む基本的な機能を実装することができます。',
    icon: 'laravel.png',
    alt: 'Laravel',
    order: 3,
  },
  {
    groupName: 'Database',
    groupTitle: '# DATABASE',
    name: 'MySQL',
    description: 'テーブル設計、クエリの実行、データの追加・更新・削除など、基本的なデータ管理を行うことができます。',
    icon: 'mysql.png',
    alt: 'MySQL',
    order: 1,
    imageClass: 'h-12',
  },
  {
    groupName: 'Database',
    groupTitle: '# DATABASE',
    name: 'PostgreSQL',
    description: 'リレーショナルデータベースの構造を理解し、プロジェクトに合わせたデータ設計と操作を行うことができます。',
    icon: 'postSQL.png',
    alt: 'PostgreSQL',
    order: 2,
    imageClass: 'h-12',
  },
  {
    groupName: 'Database',
    groupTitle: '# DATABASE',
    name: 'MongoDB',
    description: 'Mongooseを使用してスキーマを定義し、アプリケーションと連携したデータ処理を行うことができます。',
    icon: 'mongodb.png',
    alt: 'MongoDB',
    order: 3,
    imageClass: 'h-12',
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'VS Code',
    description: '主に使用しているコーディングツールで、コーディングを便利にする拡張機能をインストールして利用しています。',
    icon: 'vscode.png',
    alt: 'VisualStudio code',
    order: 1,
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'GitHub',
    description: 'リポジトリ管理やコード共有、バージョン管理の流れを理解して活用することができます。',
    icon: 'git.png',
    alt: 'GitHub',
    order: 2,
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'Postman',
    description: 'APIリクエストの確認やレスポンス検証を行い、開発中の動作確認に活用することができます。',
    icon: 'postman.png',
    alt: 'Postman',
    order: 3,
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'Figma',
    description: 'デスクトップやモバイルのUI/UXデザインを作成し、デザイン確認に活用することができます。',
    icon: 'figma.png',
    alt: 'Figma',
    order: 4,
    imageClass: 'h-12',
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'Adobe Illustrator',
    description: 'ベクター形式のデザイン要素やアイコン、グラフィック素材を制作することができます。',
    icon: 'illustrator.png',
    alt: 'Adobe Illustrator',
    order: 5,
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'Adobe Photoshop',
    description: 'マスク効果やレイヤーを活用し、さまざまなグラフィック要素を制作することができます。',
    icon: 'photoshop.png',
    alt: 'Adobe Photoshop',
    order: 6,
  },
  {
    groupName: 'Tool',
    groupTitle: '# USING_TOOL',
    name: 'JSON',
    description: 'オブジェクト構造を理解し、APIレスポンスや設定データとして活用することができます。',
    icon: 'json.png',
    alt: 'JSON',
    order: 7,
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
