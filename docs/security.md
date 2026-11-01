# セキュリティ設計と制約

## 守る対象

訪問者のプライバシー、公開原稿の正しさ、GitHub／ドメインの権限、内部資料・未公開データの分離を重視します。静的HTMLのみを配信し、DB・ログイン・独自問い合わせAPI・アップロード・決済を持ちません。

## 外部入力

RSSは未信頼入力です。2つのHTTPSホストだけを許可し、同一許可ホストへのリダイレクトを最大3回に制限します。DNS解決結果を公開IPv4に制限して接続先へ固定し、localhost・プライベートIP・特殊アドレス・任意ポート・資格情報付きURLを拒否します。IPv6のみの配信先は安全側で取得に失敗し、スナップショットへ戻ります。

1回15秒（DNS・転送を含む）、最大2MiB、再試行1回、処理最大30件。XMLのDTD・ENTITY宣言を拒否し、構文検査してから解析します。本文を取得・再帰巡回せず、タイトルと短い要約からHTMLを除きます。外部文字列はHTMLとして挿入せず、エスケープされたテキストとして表示します。削除URL指定はキャッシュにも適用します。

Markdownの任意HTMLを除去・サニタイズし、MDXは使いません。URL・日付・画像識別子・参照をスキーマ検証。JSON-LDは `<` `>` `&` をエスケープしてscript終了を防ぎます。画像はローカル管理素材のみ。外部SVGをインライン化しません。

## ブラウザ

headの先頭付近にmeta CSPを置きます。`default-src 'self'`、`object-src 'none'`、`base-uri 'self'`、`form-action 'none'`。自作JSは同一サイトのファイル。JSON-LD等はビルド時に実内容のSHA-256ハッシュを生成します。スクリプトの `unsafe-inline`、`unsafe-eval`、無制限ワイルドカードは使いません。

GA4に必要なホストだけを列挙し、外部コードは解析への同意後だけ読み込みます。サイト内のインラインスタイル用にstyleの `unsafe-inline` を許可します。Xは外部プロフィールへのリンクのみで、投稿の埋め込みや初期接続は行いません。外部画像・フォント・フィード通信も初期表示時には行いません。外部サイトへのリンクには `target="_blank" rel="noopener noreferrer"` を設定します。

CSP本体は `src/lib/csp.mjs`、生成検証は `scripts/verify-dist.mjs`。本物のGAタグの実通信・CSPログは公開環境で確認してください。ドメインを許可しただけで連携成功とは扱いません。

## GitHub Pagesで保証できないこと

meta CSPはHTTPヘッダーCSPと同等ではなく、`frame-ancestors`、レポート専用ポリシー等には制限があります。HSTS、X-Frame-Options、Permissions-Policy等の任意ヘッダーをPagesの設定で自由に付けられるとは扱いません。Nginxや他社向け `_headers` ファイルはありません。初回公開時に実レスポンスを確認してください。クリックジャッキング対策等で全ヘッダー制御が必須なら配信層の追加を別途検討します。[CSP仕様](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)

## CIと依存関係

PRはread-only検証、main公開は別workflow。`pull_request_target` は使用しません。基本 `contents: read`、スナップショット取得ジョブに `actions: read`、デプロイジョブだけにPages書き込み・OIDCを付与します。checkoutの資格情報は残しません。Actionsは検証したコミットSHA、npmはlockfileへ固定しDependabotで月次更新します。

キャッシュは同一リポジトリ・main・同一公開workflowの成功実行（push/schedule/workflow_dispatch）からのみ復元します。PRの成果物は採用しません。復元失敗時は同梱データへ戻ります。公開するartifactは `dist/` だけです。

`npm audit --audit-level=high`、秘密情報パターン検査、リンク・非公開データ・CSP検証を実施します。パターン検査は全種類の秘密を検出できる保証ではありません。依存の更新はリリース内容を確認し、検証成功後に反映します。`npm audit fix --force` の無条件実行は避けます。

## 機密・アカウント

`.env`、秘密鍵、トークン、内部資料本文・共有URL・ID、個人名簿、未公開企画、メール内容をGit／配信成果物へ入れません。内部の出典・権利許諾台帳はKUMC管理の非公開保存先で保持します。noindex・draft・非表示UIはアクセス制御になりません。

ドメイン・GitHub・Googleは複数の適切な管理者、MFA、復旧手段を準備し、復旧コードは公開資料へ置きません。漏えい時は履歴削除だけで済ませず、認証情報を失効・再発行し、影響範囲を確認します。
