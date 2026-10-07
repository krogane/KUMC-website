# 原稿・画像の更新

公開可能な内容だけを `src/content/{news,works,achievements}/` に置きます。ファイル名は `slug.md` と一致させます。下書きもGitHubの公開リポジトリでは閲覧できるため、秘密の保管場所にはできません。

## お知らせ

```yaml
---
slug: example-news
title: お知らせのタイトル
summary: 一覧と検索結果に使う短い説明。
draft: true
publishedAt: '2026-10-10T12:00:00+09:00'
checkedAt: '2026-10-07'
category: お知らせ
tags: []
relatedWorkIds: []
relatedAchievementIds: []
---
```

区切りの下にMarkdown本文を記入します。本文の最初の見出しは `##`。HTML、script、イベント属性、MDXは使わず、画像や部品はAstroコンポーネント側で管理します。見出しに続けて内容を書けば、ページ側がh1・日付・目次以外の共通部分を生成します。

`draft: false` かつ公開日時を過ぎた原稿だけが詳細・一覧・RSS・サイトマップ等へ出ます。表示日は日本時間です。未来公開は次回ビルドで反映されるため、予約時刻ぴったりの公開を保証しません。`updatedAt` は実質的に更新したときだけISO日時で追加します。ビルド日時へ置換しません。

## 作品

共通項目に以下を追加します。実例は `src/content/works/kyoto-campus.md` です。

```yaml
category: 建築              # 建築 / ゲーム・マップ / 技術
status: 公開中              # 公開中 / 制作中 / 公開終了
edition: [Java版, 統合版]
supportedVersions: ['Java Edition 1.21.4', 'Bedrock Edition 1.21.50']
cover: campus
coverAlt: Minecraftで再現した京都大学の時計台
# 以下のURLは記法例。掲載時は実際に確認した配布ページにする
downloads:
  - label: Java版の配布ページ
    url: https://minecraft-mcworld.com/111488/
gallery:
  - image: campus-wide
    alt: 再現マップの時計台と広場
relatedAchievementIds: []
publicSourceUrls:
  - https://minecraft-mcworld.com/111488/
```

Java版・統合版が同じ作品なら一つの詳細へまとめ、版別のリンクを付けます。制作中・公開終了では `downloads: []` にします。配布ワールド本体をこのサイトへ追加しません。新しい作品slugはGA4の `work_id` にも使われます。

## 活動実績

共通項目に次を追加します。

```yaml
eventDate: '2026-08-08'
# eventEndDate: '2026-08-09'  # 複数日の場合だけ
role: KUMCが担当した内容
outcome: 公開報告で確認できた実施内容
relatedWorkIds: []
publicSourceUrls: []
```

開催月しか確認できない場合は `eventDate: '2025-11'` のように月まで記載します。推測で日を補いません。日付・期間の逆転はビルドで検知します。記事公開日とイベント実施日を混同せず、予定を実績へ自動変換しません。相手団体の役割・共催／協力等は公開報告に合わせます。

## 画像

1. KUMCの原本保管先で原本と権利確認を管理する。第三者の顔、ロゴ、氏名等は別途確認する。
2. 公開可能なJPEG/PNG等を `src/assets/` へ追加し、位置情報等の不要メタデータを除く。
3. `src/lib/images.ts` の画像対応、`src/lib/schema.mjs` のasset列挙へ同じ識別子を追加する。
4. `scripts/prepare-images.mjs` にOGP対応を追加する（必要な作品のみ）。`docs/assets.md` に公開出典と用途を書く。
5. 実作品の説明となるaltを書く。見栄えを整える生成画像を実作品の証拠に使わない。
6. `npm run build` がWebPとsrcset・寸法を生成。トップ画像は優先読み込み、下部は遅延読み込み。共通OGPは1200×630。

管理されたfavicon・矢印以外の外部SVGはそのまま埋め込みません。元画像が小さい場合は拡大で解像度が増えたと扱わず、必要なら原本を差し替えます。

## 更新手順

編集 → `npm run verify` → `npm run test:publication` → previewでPC・スマートフォンを確認 → PR → CI → mainへ反映。条件・募集・活動日時を変えるときは現行資料を確認し `checkedAt` も更新します。会員数・固定活動時刻は現在掲載していません。

FAQは `src/data/faq.json`、活動は `src/data/activities.json`。関連slugの存在は検証され、非公開の関連詳細は表示されません。外部リンクはHTTPS、連絡用メールは共通設定のみを使います。
