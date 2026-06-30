# Prime Portfolio

フロントエンド開発、デザイン制作、技術スタック、プロフィールをまとめたポートフォリオサイトです。  
GitHub Pagesで公開し、Works / Tech Stack / Design & Graphic / About の各コンテンツは管理画面からFirestoreとCloudinaryへ連携できるようにしています。

## 公開URL

https://kimpm78.github.io/Portfolio/

## 主な機能

- セクション構成: Intro / About / Tech Stack / Works / Design & Graphic / Contact
- Worksの画像ギャラリー、拡大表示、関連リンク表示
- Design & Graphicのビジュアル一覧、カラー表示、画像プレビュー
- Tech Stack、Works、Design & Graphic、AboutのFirestore連携
- 管理画面での追加、編集、表示/非表示、既存データ登録
- Cloudinaryへの画像アップロード
- GitHub Pages向けのビルド設定

## 技術スタック

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Cloudinary
- lucide-vue-next

## ディレクトリ構成

```txt
src/
  components/
    about/        About詳細パネル
    common/       共通UI、画像プレビュー
    layout/       Header、Section navigation
    sections/     メインページ各セクション
  data/           初期データ、静的データ
  firebase/       Firebase初期化、認証処理
  pages/
    admin/        管理画面
  router/         Vue Router
  services/       Cloudinaryアップロード処理
```