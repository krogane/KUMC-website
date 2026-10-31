// Public visitor information only. Keep private planning material outside this repository.
export const nf2026 = {
  path: "/nf/2026/",
  year: 2026,
  title: "京大マイクラワールド",
  subtitle: "対戦ゲームや建築展示に大熱狂",
  festival: "京都大学11月祭（NF）2026",
  pageTitle: "NF 2026｜京大マイクラワールド",
  description:
    "2026年11月20〜23日、京都大学・法経本館2階第六教室で開催。京大トレジャーラン、建築展示、会報誌、グッズ、ぬりえとオンライン企画をご紹介します。",
  introduction:
    "京大キャンパスを駆け巡る宝探し、建築展示、会報誌やグッズ、親子で楽しむぬりえ。会場とオンラインでMinecraftの世界を体験できます。",
  homeDescription:
    "宝探しゲーム、建築展示、会報誌、グッズ、ぬりえ。オンライン企画も紹介。",
  days: [
    { date: "2026-11-20", label: "11.20", weekday: "金", opens: "10:00", closes: "18:00" },
    { date: "2026-11-21", label: "11.21", weekday: "土", opens: "10:00", closes: "18:00" },
    { date: "2026-11-22", label: "11.22", weekday: "日", opens: "10:00", closes: "18:00" },
    { date: "2026-11-23", label: "11.23", weekday: "月", opens: "10:00", closes: "17:30" },
  ],
  venue: {
    campus: "京都大学 吉田キャンパス本部構内",
    shortCampus: "京都大学 吉田キャンパス",
    room: "法経本館2階 第六教室",
    mapUrl: "https://www.kyoto-u.ac.jp/ja/access/campus/yoshida/map6r-y",
  },
  onsite: {
    treasure: {
      title: "京大トレジャーラン",
      description:
        "Minecraftで再現した京大キャンパスで、制限時間内にお宝を集めて得点を競うゲーム。屋上や中庭を探索し、ジャンプやエリトラの滑空で高得点を目指します。",
      conditions: "会場のPCで体験・有料",
      support: "操作はスタッフがサポート。混雑時は整理券を配布します。",
    },
    exhibition: {
      title: "建築・クイズ展示",
      description:
        "KUMCメンバーの建築写真を、細かな装飾や風景までじっくり鑑賞。Minecraftの英訳・和訳クイズ、豆知識、来場者が書き込める「あるある」も紹介します。",
    },
    magazine: {
      title: "会報誌「KU匠」",
      theme: "新刊 Vol.3「マイクラ×学び」",
      description:
        "スティーブの能力を科学で考える記事や、翻訳・プログラミングなど、Minecraftを入口に知識を広げる一冊です。",
      backIssue: "既刊Vol.2も販売します。",
    },
    goods: {
      title: "オリジナルグッズのガチャガチャ",
      description:
        "時計台やKUMCをモチーフにした缶バッジとアクリルキーホルダー。むっつんさんとのコラボデザインも登場予定。",
      prices: [
        { label: "缶バッジ", yen: 300 },
        { label: "アクリルキーホルダー", yen: 400 },
      ],
    },
    coloring: {
      title: "おえかき・ぬりえ",
      description:
        "A4のKUMCオリジナルぬりえを、色鉛筆で彩るコーナー。小さなお子様も保護者と一緒に楽しめます。",
      conditions: "無料・作品の持ち帰りOK",
    },
  },
  online: {
    title: "京大マイクラワールドonline",
    introduction: "自宅からMinecraftで参加。冒険するゲームと、自由に見て回れる建築展示。",
    games: [
      {
        id: "nf-mmo",
        title: "NFMMO",
        description:
          "浮島を舞台に探索や戦闘を楽しむMMO風コンテンツ。構造が変わるダンジョン、装備を組み合わせるビルド、採掘や釣りで素材集めを楽しめます。",
        edition: "Java版 26.3",
        players: "1〜4人",
        recommendedAge: "15歳以上推奨",
        duration: "プレイ時間：数時間〜",
        credit: "制作：KUMC＆むっつん",
      },
      {
        id: "nf-drift",
        title: "Drift",
        description:
          "最大3人で「Abyss」へ潜航するPvE戦闘コンテンツ。制限時間内に敵を倒し、装備や「晶石」の効果を組み合わせて攻略を目指します。",
        edition: "Java版 1.20.1",
        players: "1〜3人",
        recommendedAge: "16歳以上推奨",
        duration: "1回約45分",
        period: "公開予定：11月20〜22日",
      },
    ],
    buildings: {
      title: "KUMC建築観覧",
      description:
        "Java版・統合版対応。京大再現キャンパスなど、メンバーの建築を自分のペースで観覧。",
    },
    collaboration: {
      title: "むっつんさんコラボ展示",
      description:
        "Java版・統合版対応。「天空宮殿」は動画に映っていない部分まで。「氷の浮島」では氷の木や多面体、ガラスとエンドロッドによる表現を楽しめます。",
    },
    connectionNotice: "接続情報は11月20日公開予定。",
  },
} as const;
