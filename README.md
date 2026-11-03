# LT Slide

React + TypeScript + MDX の LT 用スライドです。Vue は使いません。本文は `slides.mdx` です。

編集、発表、PDF 出力の手順は [使い方.md](./使い方.md) にまとめてあります。

## コマンド

```bash
npm install
npm run dev      # http://localhost:5173/1
npm run build    # 静的サイト
npm run export   # PDF
npm run lint
```

発表者画面は `http://localhost:5173/presenter/1` です。

PDF は `output/export/lt-slide.pdf` に出ます。`npm run export` は開発サーバーを起動し、印刷用画面を Playwright で PDF にします。
