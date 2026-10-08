# 京大マインクラフト同好会KUMC 公式サイト

Astroの静的サイトです。正規URLは **https://www.kumc-club.net/**。GitHub Pages向けの実装を収録しています。GitHub配置先は未決定で、GA4測定IDは設定済みです。DNS・GA4管理画面の設定確認・Search Consoleの本番設定は未実施です。

## 起動

Node.js **22.23.3**（`.nvmrc`）とnpmを使用します。

```sh
nvm install
nvm use
npm ci
cp .env.example .env  # 初回のみ。既存の .env は上書きしない
npm run dev
```

表示確認は `http://127.0.0.1:4321/`。配信成果物の確認は次の通りです。

```sh
npm run verify
npm run preview
```

## 検証・更新コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run check` | Astro・TypeScript、原稿スキーマ、関連参照、設定項目 |
| `npm test` | RSSの安全性・障害時処理、日付、同意、イベント境界 |
| `npm run build` | 画像最適化、静的出力、リンク・画像・CSP・非公開データ検証 |
| `npm run verify` | check → test → build |
| `npm run test:publication` | 一時テスト原稿で下書き・未来公開・HTML無害化を実ビルド検証。終了時に原稿を除去し再ビルド |
| `npm run feeds` | 許可された2つのRSSを取得。失敗時は正常スナップショットを保持 |
| `npx playwright install chromium firefox webkit` | 検証用ブラウザ導入（Linuxでは `--with-deps` を追加） |
| `npm run test:e2e` | 3ブラウザでページ、導線、レスポンシブ、アクセシビリティ、同意制御 |
| `npm run audit:secrets` | ソース・成果物の秘密情報パターン検査 |
| `npm audit --audit-level=high` | 依存関係の既知の脆弱性検査 |
| `node scripts/capture-screenshots.mjs` | preview起動中に各画面を `.qa/` に保存 |
| `npm run audit:performance` | preview起動中に主要5ページをLighthouse mobileで各3回測定（noindexのためSEOは減点される） |
| `node scripts/audit-production.mjs` | 一時的な本番相当ビルドをlocalhost:4322で測定し、previewへ復帰。Googleへの送信なし |

`.qa/` のレポート・スクリーンショット、`.cache/`、`dist/` はGit対象外です。性能測定とE2Eは同時実行しないでください。テストは本物のGoogle解析先へ送信せず、通信を置き換えたfixtureで制御を確認します。

## 設定

`.env` と `.env.example` の**項目名を同期**してください。実値の `.env` はコミットしません。

| 変数 | 初期値・意味 |
| --- | --- |
| `PUBLIC_SITE_URL` | `https://www.kumc-club.net`。正規ホスト固定 |
| `PUBLIC_GA_MEASUREMENT_ID` | `G-6RPY79DMKZ`（依頼者提供の公開識別子）。本番workflowにも設定済み |
| `PUBLIC_ANALYTICS_ENABLED` | `false`。本番公開工程でのみ `true` |
| `DEPLOY_TARGET` | `preview`。公開工程でのみ `production` |
| `PUBLIC_JOIN_URL` | 空。確認済みの恒久的なHTTPS入会先がある場合だけ設定 |

本番指定でGA4が未設定ならビルドが停止します。解析は本番指定に加え、正規ホスト・利用者の有効な同意がすべてそろった時だけ動きます。プレビューはnoindexです。ドメインを変更する場合は `site` だけでなく検証・CNAME・workflow・テスト・DNSもまとめて更新してください。

メール、SNS、表示件数は `src/data/site.ts`。RSSの接続先・上限は `scripts/feed-core.mjs`。作品・実績は `src/content/`。任意HTMLとMDXは使用しません。

## 引き継ぎ

- [原稿・作品の更新](docs/content-guide.md)
- [GitHub Pages・DNS・初回公開](docs/deployment.md)
- [GA4・Search Console](docs/analytics.md)
- [セキュリティと配信上の制約](docs/security.md)
- [月次確認・障害対応・復旧](docs/operations.md)
- [検証結果・残る作業](docs/verification.md)
- [素材と事実の確認記録](docs/assets.md)
- [デザインと画面比較](docs/design.md)

内部資料の本文、共有URL・閲覧用ID、会員情報、未公開企画はこのリポジトリへ置かないでください。コードと素材の権利は別です。収録素材の第三者による再利用を許諾するライセンスは付与していません。
