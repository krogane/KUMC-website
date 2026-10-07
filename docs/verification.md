# 検証・引き継ぎ記録

実施日：2026年10月7日。状態は **ローカル実装済み／本番公開未実施** です。

## 納品範囲

18 HTMLページ（作品4件・活動実績2件・独自ニュース1件と全固定ページ・404）、sitemap・robots・ニュースRSS、WebP・OGP、RSS更新、X opt-in、GA4同意制御、Markdown管理、GitHub Actionsと運用資料を実装しています。配信ファイルは約3.1MBです。KUMC制作の実作品画像を使用し、生成案は配信しません。

## 実施結果

| 検証 | 結果・限界 |
| --- | --- |
| 再現性 | `npm ci` 成功。ビルド・検証の実行Nodeは22.23.3。初回インストールを起動したホストNode22.19.0ではengine警告が出たため、運用時は`.nvmrc`に合わせる |
| 型・原稿 | Astro/TypeScriptでエラー・警告なし。slug・参照・日付・URL・画像alt・env項目を検証 |
| 単体テスト | 17件成功。RSSの不正XML/DTD・危険URL・DNSアドレス・重複・順序・上限・障害時fallback、同意期限・保存失敗、公開条件等 |
| ビルド境界 | 実際に下書き・未来公開・危険HTMLのテスト原稿を生成してビルド。全配信テキストから非公開原稿が除外され、script/イベント属性が除去されることを確認。終了時にテスト原稿を除去し通常ビルドへ復帰 |
| 静的成果物 | 18ページの内部リンク・画像・srcset・アンカー、h1・ja・メタデータ・canonical、禁止成果物・内部URLを検証。JSON-LDのCSPハッシュを適用 |
| ブラウザ | Chromium 153.0.8010.12／WebKit 26.6で計22件成功。全18ページ、操作、JS無効、320/360/390/768/1280/1440pxを確認 |
| アクセシビリティ | 全ページでaxeの重大・深刻な違反0。見出し階層・読み上げ名もLighthouseの指摘を修正。WCAG適合認証やスクリーンリーダーの全手動検査ではない |
| 同意・GA | ブラウザfixtureで、未同意／拒否／preview時の外部通信0、同意後page_viewと各導線イベント1回、URL除去、撤回・GA Cookie削除、別タブ撤回、CSPのinline実行拒否を確認。本物のGoogleタグ・GA4受信は未検証 |
| RSS実接続 | はてな16件・クラフターズコロニー5件を正常取得。日時を保持したスナップショットを用意。ブラウザから直接取得しない |
| X | クリック前の通信0、クリック後の公式script読み込み、失敗案内とプロフィールリンクの維持を確認。実ブラウザでは投稿本体の表示を確認できず、実表示は未検証 |
| セキュリティ | 秘密情報パターン検査成功。`npm audit --audit-level=high` は既知脆弱性0件。全秘密情報の不在を機械検査だけで保証するものではない |
| 画面 | Codex内ブラウザで導線を実操作。PlaywrightでPC・モバイル画像を保存。pageerrorは0。検討画像と同寸法の比較・意図的差分は[デザイン記録](design.md) |

Firefox 155のPlaywrightブラウザは、このMacで `Could not find profile folder` と終了し、ページを開く前に起動失敗しました。通常／別の一時フォルダ／実行環境を変えた確認でも解消しませんでした。Firefoxでサイトが失敗したという結果ではなく、未検証です。CIにはFirefoxを含む3ブラウザの検証を残しています。現行製品版Chrome・Safari・Firefoxと実機の最終確認は公開前に行ってください。

## 性能測定

Lighthouse 13.5.0、Chromium、mobile 390×844、simulated throttling、第三者未読み込み、ページごとに新規ブラウザを起動して3回測定した中央値です。本番相当のnoindexなしビルドをlocalhostで評価しました。テスト用GA IDはそのプロセスのみで設定し、ホスト制限によりGoogleへ送信しません。測定後はGA無効のpreviewへ戻しています。再測定は `node scripts/audit-production.mjs`。途中でプロセスを強制終了した場合は、`DEPLOY_TARGET=preview PUBLIC_ANALYTICS_ENABLED=false PUBLIC_GA_MEASUREMENT_ID= npm run build` でpreviewへ戻してください。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 100 | 100 | 100 | 100 | 1.49秒 | 0.000 |
| `/works/` | 100 | 100 | 100 | 100 | 1.52秒 | 0.000 |
| `/works/kyoto-campus/` | 100 | 100 | 100 | 100 | 1.29秒 | 0.000 |
| `/join/` | 100 | 100 | 100 | 100 | 1.21秒 | 0.000 |
| `/collaboration/` | 100 | 100 | 100 | 100 | 1.07秒 | 0.000 |

すべて目標値（Performance 90、その他95）を達成しました。初回は作品一覧の見出し順でAccessibility 98でしたが、見出し階層を修正して100になりました。ローカルラボ値であり、実ユーザーのCore Web Vitals／INPや本番回線性能を証明するものではありません。

## 確認用ファイル

ローカル `.qa/home-desktop.png`、`home-mobile.png`、`home-320.png`〜`home-1440.png`、`works-desktop.png`、`join-desktop.png`、`contact-desktop.png`、`collaboration-desktop.png`。概念画像・同寸法比較は `concept-*.png` と `render-*-native.png`。詳細テスト結果は `playwright-results.json`、性能は `lighthouse-*.json`。これらはGit対象外で、公開artifactへ入りません。

## 残る外部作業

1. GitHubの配置先・権限・利用プランを確定し、ソースを配置する（利用者の希望により後から実施）。workflowの実行は未検証。
2. `kumc-club.net` の取得・DNS管理者・更新費用担当を確認し、GitHub側の所有確認・Custom domain → DNS → HTTPSの順で設定する。
3. 実GA4測定ID・保持期間・拡張計測等を設定し、本番NetworkとGA4管理画面で受信確認する。
4. Search Consoleの所有確認とsitemap登録を実施する。
5. Xの未ログイン状態での実表示、Firefox・製品版ブラウザ、実機スマートフォンを確認する。
6. 恒久的な入会先が決まった場合だけ `PUBLIC_JOIN_URL` を設定する。未設定でもメール・Xで案内できる。

DNS、アカウント、GA4実計測、Search Consoleは設定・登録済みとは報告しません。手順は [deployment.md](deployment.md) と [analytics.md](analytics.md) を参照してください。
