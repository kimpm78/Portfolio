export type WorkLink = {
  label: string
  url: string
}

export type WorkProjectData = {
  order?: number
  title: string
  subTitle: string
  description: string
  moreDescription?: string
  tags: string[]
  images: [string, ...string[]]
  imageAlt: string
  links: WorkLink[]
  isMobileImage?: boolean
}

export const workImageUrl = (fileName: string) => {
  if (/^(https?:|data:|blob:)/.test(fileName)) {
    return fileName
  }

  return new URL(`../img/project_img/optimized/${fileName}`, import.meta.url).href
}

export const staticWorkProjects: [WorkProjectData, ...WorkProjectData[]] = [
  {
    order: 2,
    title: 'Cloudia Market',
    subTitle: '個人プロジェクト',
    description:
      'フロントエンドとバックエンドを使用して構築したマーケットサイトです。メインページでは商品一覧や商品詳細を確認でき、管理者ページでは商品の登録・編集・削除などの商品管理ができます。',
    moreDescription:
      'ユーザー向けの画面と管理者向けの画面を分けて構成し、商品データを管理しながら実際のECサービスに近い操作感を目指して実装しました。',
    tags: ['#React', '#JavaScript', '#CSS', '#Java', '#Docker'],
    images: [
      'https://res.cloudinary.com/dopdjsitj/image/upload/v1782456258/portfolio/works/legacy/cloudia-market/bkqex7km0oxr0xupmtqy.png',
      'https://res.cloudinary.com/dopdjsitj/image/upload/v1782456258/portfolio/works/legacy/cloudia-market/dlda72tuqopgeugeicw3.png',
    ],
    imageAlt: 'cloudia_market_img',
    isMobileImage: true,
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/kimpm78/Cloudia_Market_Project',
      },
    ],
  },
  {
    order: 3,
    title: 'KAZARU',
    subTitle: '個人プロジェクト',
    description:
      'Photoshop、Illustrator、Figmaを用いて制作したECサイトデザインです。アメリカのトレンドデザインやハイブランドのデザインを参考にし、モノトーンを基調とした、ユーザーが見やすいデザインを意識して制作しました。',
    moreDescription:
      '純粋なデザインツールのみを使用して作成しました。当初からWebサイトがどのように作られているのかに興味があり、趣味としてこのプロジェクトを始めました。制作期間は長くありませんでしたが、次回はより時間をかけて、フロントエンド技術も取り入れながら実際に動作するWebサイトとして制作したいと考えています。',
    tags: ['#PhotoShop', '#Illustrator', '#Figma', '#Web Design', '#prototype'],
    images: ['0_1.webp', '0_2.webp', '0_3.webp', '0_4.webp'],
    imageAlt: 'kazaru_project_img',
    links: [
      {
        label: 'Figma',
        url: 'https://www.figma.com/proto/p7l1SzGViynO4pRs7CaQUB/KAZARU_Fashion-project?node-id=67-1281&starting-point-node-id=67%3A1281&mode=design&t=xrGEJYbMRro033Pn-1',
      },
    ],
  },
  {
    order: 4,
    title: 'L.E.O.T',
    subTitle: '個人プロジェクト',
    description:
      'L.E.O.Tは「Locate Estate Of Tomorrow」の略で、未来の理想的な住まいを見つけるという意味を込めた不動産サイトです。',
    moreDescription:
      'オレンジをメインカラーにし、初めてReact.jsを使用して制作しました。コンポーネント分割やページ構成を意識しながら、Reactの基礎理解を深めることを目的に取り組みました。デザイン面では、物件情報を見やすく整理し、ユーザーが必要な情報にスムーズにアクセスできる構成を目指しました。また、アニメーションを取り入れることで、画面全体に動きを加え、不動産サイトとしての高級感や信頼感を演出しました。',
    tags: ['#React.js', '#JavaScript', '#Styled-Components', '#レスポンシブ対応'],
    images: ['3_0.webp', '3_1.webp', '3_2.webp'],
    imageAlt: 'leot_project_img',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/kimpm78/realEstate_site',
      },
      {
        label: 'Figma',
        url: 'https://www.figma.com/file/VIR3xt97KJUrKEI0njAZBS/L.E.O.T?type=design&node-id=2%3A174&mode=design&t=kETMZpjlLnUMie2U-1',
      },
    ],
  },
  {
    order: 5,
    title: 'TOSS（ver.jp）',
    subTitle: '個人プロジェクト',
    description:
      'TOSSの金融サービスを参考に、日本向けのWebサイトとして再構成した個人プロジェクトです。TOSS社のメインカラーを参考にし、シンプルで信頼感のあるUI・UXを意識して制作しました。必要な情報だけを分かりやすく整理し、ユーザーが直感的に操作できる構成を目指しました。',
    tags: ['#PhotoShop', '#Illustrator', '#Figma', '#Web Design', '#金融システムデザイン'],
    images: ['1_0.webp', '1_1.webp', '1_2.webp', '1_3.webp'],
    imageAlt: 'toss_project_img',
    isMobileImage: true,
    links: [
      {
        label: 'Figma',
        url: 'https://www.figma.com/proto/ae7g5SYcEz6Nh5uNzo7EHF/Toss_JP_ver?node-id=89-1312&starting-point-node-id=89%3A1312&mode=design&t=kc8yPU15scb1fiHJ-1',
      },
    ],
  },
  {
    order: 6,
    title: 'Fox Tech',
    subTitle: '個人プロジェクト',
    description:
      'Fox techは、パソコンやPC周辺機器に関する商品情報を紹介するブログサイトです。Figmaを用いて要件定義やUI設計を行い、Viteを使用して約1週間で実装しました。',
    moreDescription:
      'カード型レイアウトを中心に、商品情報を見やすく整理し、ユーザーが特徴を比較しやすい構成を意識して制作しました。また、レスポンシブ対応やコンポーネント設計にも取り組み、短期間でのフロントエンド開発の流れを学ぶことができました。',
    tags: ['#TypeScript', '#bootstrap', '#CSS', '#vite', '#blog Page'],
    images: ['5_0.webp', '5_2.webp', '5_3.webp', '5_4.webp'],
    imageAlt: 'fox_tech_img',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/kimpm78/fox_tech',
      },
      {
        label: 'Figma',
        url: 'https://www.figma.com/file/18YzHVIkv8DUBnl7ik3Pvm/Tech-Blog?type=design&node-id=6%3A2&mode=design&t=ViB0T7MczerKmyXR-1',
      },
    ],
  },
  {
    order: 7,
    title: 'PrimeKim',
    subTitle: '個人プロジェクト',
    description:
      'Next.jsとMongoDBを用いて開発したECサイトです。MongoDBを活用し、商品データの登録・取得・更新・削除などのCRUD機能を実装しました。',
    moreDescription:
      'Next.js 14を使用することで、フロントエンドとバックエンドの連携について理解を深めることを目的に制作しました。一部未完成のコンポーネントがあるため、機能追加やUI改善を継続的に進めています。',
    tags: ['#TypeScript', '#Next.js', '#MongoDB', '#TailWind_CSS', '#レスポンシブ対応'],
    images: ['2_0.webp', '2_1.webp', '2_2.webp'],
    imageAlt: 'prime_kim_img',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/kimpm78/Prime-monorepo',
      },
    ],
  },
  {
    order: 8,
    title: 'メシドア',
    subTitle: '個人プロジェクト',
    description:
      'フードデリバリーサービスを想定したWebアプリケーションです。料理の検索、店舗一覧、カート追加、注文履歴、プロフィール管理など、実際のデリバリーサイトをイメージしてUI/UXをリニューアルしました。',
    moreDescription:
      '既存プロジェクトをベースに、LP画面、ハンバーガーメニュー、店舗マップ、問い合わせフォーム、利用規約ページなどを追加し、より実用的なサービス画面に近づけています。',
    tags: ['#JavaScript', '#MUI', '#CSS', '#node', '#Delivery Page'],
    images: ['6_0.webp', '6_1.webp', '6_2.webp', '6_3.webp'],
    imageAlt: 'meshidoor_img',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/kimpm78/Next-Food-Door/tree/main',
      },
      {
        label: 'Figma',
        url: 'https://www.figma.com/file/lgFpSJDOtRwbqdAyV4MFe8/Next-Food-Door?type=design&node-id=2%3A146&mode=design&t=zhrq59x5ODqGN1Xj-1',
      },
    ],
  },
  {
    order: 9,
    title: 'Slack Clone Coding',
    subTitle: '個人プロジェクト',
    description:
      'Slackの公式ホームページを参考に、学習目的でクローンコーディングを行いました。既存サイトのレイアウトやマークアップ構造を分析し、自分なりにコンポーネント化して実装しました。UIの再現だけでなく、レスポンシブ対応やコンポーネント設計の理解を深めることを目的に制作しました。',
    tags: ['#TypeScript', '#Next.js', '#Tailwind_CSS', '#CloneCoding'],
    images: ['4_0.webp', '4_1.webp', '4_2.webp'],
    imageAlt: 'slack_clone_img',
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/kimpm78/slack_clone_coding',
      },
    ],
  },
]
