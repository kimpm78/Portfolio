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
  headlineLine1: '経験を活かし、',
  headlineHighlight: '使いやすい画面をつくる',
  introLead: 'フロントエンド開発において私が大切にしていることは、',
  quote: '好奇心を持ち、計画的に行動すること',
  introBody:
    'これまでの経験を通じて、課題に対してあきらめずに向き合い、使いやすさや見やすさを意識しながら、より良い成果を目指して改善を重ねてきました。\nまた、一つの技術や言語にとどまらず、新しい技術やトレンドにも積極的に関心を持ち、実践を通して知識と経験を積み重ねています。',
  tags: ['#ユーザー視点', '#継続的な改善', '#最後までやり切る'],
  buttonText: '詳細を見る',
  deskImage: 'optimized/desk01.webp',
  storyIntro:
    'デザイン経験からフロントエンド開発へ。これまでの経験を活かしながら、使いやすいUIと保守しやすい実装を目指しています。',
  storyCards: [
    {
      number: '01',
      title: 'デザイン経験',
      body: '2012年からデザインに興味を持ち、自ら考えたものを形にすることを楽しんできました。プロダクトデザインの経験を通じて、Webデザインにも関心を持つようになりました。',
    },
    {
      number: '02',
      title: 'フロントエンドへの挑戦',
      body: 'Webデザインの基礎を学びながらコーディングを始め、プログラミングを通して自分のアイデアを形にすることに大きな達成感を感じました。',
    },
    {
      number: '03',
      title: '現在の考え方',
      body: 'デザイン経験を活かしながら、ユーザーにとって使いやすい画面と、保守しやすい実装を意識しています。新しい技術を学び続け、実装力を高めています。',
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
};
