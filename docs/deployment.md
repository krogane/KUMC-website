# GitHub Pages・独自ドメインの公開

正規URL：**https://kumc-club.net/**（wwwなし）。2026年10月7日時点で配置先リポジトリは未決定、公開処理は未実行です。SSH・Nginx・常駐サーバーは不要です。

## 管理者が準備するもの

- KUMCが継続管理できるGitHub所有者・リポジトリと権限
- `kumc-club.net` の取得状況、DNS管理権限、更新費用・担当者
- GA4 Webストリームの測定IDと管理権限
- Search Consoleドメインプロパティの管理権限

GitHub Freeは公開リポジトリ、非公開リポジトリのPagesはPro／Team等の対応プランが必要です。プランを確認し、既存リポジトリを勝手に公開へ変更しません。公開されるサイトに非公開リポジトリの機密が含まれてよいわけではありません。[GitHub Pagesの利用条件](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)

## 初回の順序

1. 秘密情報・内部資料が含まれていないことを確認し、決定したリポジトリへGit履歴をpushする。ブランチ名は `main`。`dist`、`.env`、`.cache`、`.qa` はpushしない。
2. GitHubの所有者設定からPagesのドメイン所有確認を行う。提示される `_github-pages-challenge-...` TXTをDNSへ登録し、検証完了後も保持する。[所有確認](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
3. リポジトリ Settings → Pages → Sourceを **GitHub Actions** にし、Custom domainに **kumc-club.net** を保存する。`public/CNAME` だけでは設定完了にならない。
4. 次のDNSを設定する。既存のWeb用競合レコードは用途を確認してから変更する。メール用MX等を消さない。
5. リポジトリ Settings → Secrets and variables → Actions → Variables に下表を設定する。
6. Validate pull requestを手動実行し、検証する。Build and deploy Pagesをmainで手動実行する。CIのブラウザ検証まで成功してから本番artifactが作成される。
7. 証明書発行・DNS確認後にSettings → Pagesの **Enforce HTTPS** を有効にする。反映には時間がかかる場合がある。
8. 下記公開後チェックとGA4実受信確認を実施して初めて「公開確認完了」とする。

| Actions Variable | 値 |
| --- | --- |
| `PAGES_ENABLED` | `true`（初回設定完了までは未設定またはfalse） |
| `PUBLIC_GA_MEASUREMENT_ID` | 実際の `G-...` |
| `PUBLIC_JOIN_URL` | 未設定で可。確認済みの恒久HTTPS入会先だけ |

GA測定IDは公開識別子です。Googleの秘密鍵・パスワードは一切登録しません。GA未設定の本番ビルドは意図的に失敗します。`PAGES_ENABLED` がfalseのとき公開ジョブはスキップされます。

## DNS

GitHub公式で2026年10月7日に確認したapex用IPv4です。設定時にも公式ページで更新がないか確認してください。

| 種別 | 名前 | 値 |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

`www` も利用する場合のみ、`www` のCNAMEを **決定した所有者名.github.io** へ設定します（リポジトリ名は含めない）。このサイトの正規ホストはwwwなしです。GitHub側でwwwから正規ホストへのHTTPS転送を実確認します。ワイルドカードDNSは使いません。AAAAを設定する場合は公式に記載された4件をすべて設定し、古いAAAAが別サーバーを指さないよう確認します。

[GitHub公式・カスタムドメイン設定](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## 公開後チェック

- `https://kumc-club.net/` と全詳細URLへの直接アクセス・更新が成功する
- HTTP→HTTPS、wwwを設定した場合の正規ホストへの転送
- 任意の存在しないURLで404が返り、案内・ナビ・画像が表示される
- canonical、OGP、sitemap、robotsに本番URLがあり、通常ページにnoindexが残らない
- `/404.html` はnoindex、サイトマップに404・下書き・未来公開がない
- 初期状態／拒否後のGA・X通信が0、同意後のGA実受信と撤回、X実表示または失敗案内
- スマートフォン、現行Chrome・Safari・Firefox、キーボード操作
- 実レスポンスのHTTPS・セキュリティヘッダーを記録する（任意ヘッダーを設定できるとは扱わない）

PRごとの公開プレビューは用意していません。ローカルpreviewとCIレポートを使います。Pagesの無料枠・プラン・制限は所有者の契約に従います。
