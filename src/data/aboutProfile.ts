export type AboutPastImage = {
  src: string
  alt: string
}

export type AboutStoryCard = {
  number: string
  title: string
  body: string
}

export type AboutProfileData = {
  headlineLine1: string
  headlineHighlight: string
  introLead: string
  quote: string
  introBody: string
  tags: string[]
  buttonText: string
  deskImage: string
  storyIntro: string
  storyCards: AboutStoryCard[]
  archiveTitle: string
  archivePeriod: string
  pastImages: AboutPastImage[]
  isVisible: boolean
}

const aboutImageModules = import.meta.glob('../img/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const aboutImageUrl = (fileName: string) => {
  if (/^(https?:|data:|blob:)/.test(fileName)) {
    return fileName
  }

  const imageUrl = aboutImageModules[`../img/${fileName}`]

  if (!imageUrl) {
    throw new Error(`About image not found: ${fileName}`)
  }

  return imageUrl
}

export const staticAboutProfile: AboutProfileData = {
  headlineLine1: '新しい道を作り',
  headlineHighlight: 'いつもチャレンジする',
  introLead: 'フロントエンド開発に活かしている私の考え方は、',
  quote: '好奇心を持ち、計画的に行動すること',
  introBody:
    'これまでの経験を通じて、決してあきらめない姿勢を大切にし、常により良い成果を目指して取り組んできました。\nまた、常に顧客の視点を意識しながら、一つの技術や言語にとどまらず、新しい技術やトレンドを学び、実践を通して経験を積んでいます。',
  tags: ['#継続力がある', '#最後までやり切る', '#粘り強く取り組む'],
  buttonText: '詳細を見る',
  deskImage: 'optimized/desk01.webp',
  storyIntro: 'デザイン経験からフロントエンド開発へ。これまでの経験と、今後大切にしていきたい考え方。',
  storyCards: [
    {
      number: '01',
      title: 'デザイン経験',
      body: '2012年からデザインに興味を持ち、自らデザインし、制作することを楽しんできました。さまざまなプロダクトデザインの経験を通じてWebデザインにも関心を持つようになりました。',
    },
    {
      number: '02',
      title: 'フロントエンドへの挑戦',
      body: 'Webデザインの基礎を学びながらコーディングを始め、プログラミングを通じて自分のアイデアを形にすることに大きな達成感を覚えました。',
    },
    {
      number: '03',
      title: '現在の考え方',
      body: 'デザイン経験を活かしながら、ユーザーが使いやすい画面と保守しやすい実装を意識しています。新しい技術を学び続け、実装力を高めています。',
    },
  ],
  archiveTitle: 'DESIGN ARCHIVE',
  archivePeriod: '2015 - 2016 作品',
  pastImages: [
    { src: 'past/optimized/pro1.webp', alt: 'project_1' },
    { src: 'past/optimized/pro2.webp', alt: 'project_2' },
    { src: 'past/optimized/pro3.webp', alt: 'project_3' },
    { src: 'past/optimized/pro4.webp', alt: 'project_4' },
    { src: 'past/optimized/pro5.webp', alt: 'project_5' },
    { src: 'past/optimized/pro6.webp', alt: 'project_6' },
    { src: 'past/optimized/pro7.webp', alt: 'project_7' },
  ],
  isVisible: true,
}
