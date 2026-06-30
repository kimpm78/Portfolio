export type DesignGraphicWorkData = {
  title: string
  category: string
  period: string
  description: string
  image: string
  logo: string
  alt: string
  colors: string[]
  isFeatured: boolean
  isVisible: boolean
  order: number
}

export const designGraphicImageUrl = (fileName: string) => {
  if (/^(https?:|data:|blob:)/.test(fileName)) {
    return fileName
  }

  return new URL(`../img/project_img/optimized/${fileName}`, import.meta.url).href
}

export const staticDesignGraphicWorks: DesignGraphicWorkData[] = [
  {
    title: 'KAZARU PROJECT',
    category: 'Brand Design',
    period: '2016',
    description: '展示・プロダクト制作を想定したブランドビジュアルとロゴデザイン。',
    image: 'kazaru_main.webp',
    logo: 'Kazaru.webp',
    alt: 'KAZARU',
    colors: ['#000000', '#D3D3D3', '#2D3347'],
    isFeatured: true,
    isVisible: true,
    order: 1,
  },
  {
    title: 'Fox Tech',
    category: 'Logo / Web Visual',
    period: '2016',
    description: 'テック系サービスをイメージしたロゴとキービジュアル制作。',
    image: 'fox_tech_main.webp',
    logo: 'Fox_Tech_Logo.webp',
    alt: 'Fox Tech',
    colors: ['#F98351', '#737373', '#D9D9D9'],
    isFeatured: false,
    isVisible: true,
    order: 2,
  },
  {
    title: 'PrimeKim',
    category: 'Personal Branding',
    period: '2016',
    description: '個人ブランドを想定したロゴ、カラー、メインビジュアル制作。',
    image: 'PrimeKim_main.webp',
    logo: 'PrimeKim_log.svg',
    alt: 'PrimeKim',
    colors: ['#000000', '#FFFFFF', '#FF3A3A'],
    isFeatured: false,
    isVisible: true,
    order: 3,
  },
  {
    title: 'L.E.O.T',
    category: 'Product Visual',
    period: '2016',
    description: '力強い印象を意識したプロダクト系ビジュアルデザイン。',
    image: 'LEOT_main.webp',
    logo: 'L.E.O.T.webp',
    alt: 'L.E.O.T',
    colors: ['#FF9D00', '#000000', '#F5F5F5'],
    isFeatured: false,
    isVisible: true,
    order: 4,
  },
  {
    title: 'メシドア',
    category: 'Service UI Visual',
    period: '2025',
    description: '飲食系サービスを想定したロゴ、カラー、ビジュアル整理。',
    image: 'meshidoor_main.webp',
    logo: 'meshidoor_logo.svg',
    alt: 'meshidoor_main',
    colors: ['#8B2601', '#C17A47', '#353535'],
    isFeatured: true,
    isVisible: true,
    order: 5,
  },
  {
    title: 'Cloudia Market',
    category: 'EC Visual',
    period: '2026',
    description: 'ECサイトの商品ページを想定したシンプルなビジュアル制作。',
    image: 'Cloudia Market_product.webp',
    logo: 'Cloudia Market_logo.webp',
    alt: 'Cloudia Market',
    colors: ['#111827', '#F8FAFC', '#64748B'],
    isFeatured: false,
    isVisible: true,
    order: 6,
  },
]
