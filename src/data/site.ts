export const site = {
  name: "京大マインクラフト同好会KUMC",
  url: import.meta.env.PUBLIC_SITE_URL || "https://kumc-club.net",
  description:
    "Minecraftで遊び、つくり、つながる。京大マインクラフト同好会KUMCの活動、配布作品、入会方法、制作・共同企画の相談をご紹介します。",
  email: "kumcminecraft@gmail.com",
  x: "https://x.com/KUMC_X",
  blog: "https://kumc.hatenablog.com/",
  colony:
    "https://minecraft-mcworld.com/author/2937761467834624754e30c1ed9db1390dc5f974/",
  joinUrl: import.meta.env.PUBLIC_JOIN_URL || "",
  checkedAt: "2026-10-07",
  production: import.meta.env.DEPLOY_TARGET === "production",
  analyticsEnabled:
    import.meta.env.DEPLOY_TARGET === "production" &&
    import.meta.env.PUBLIC_ANALYTICS_ENABLED === "true",
  measurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID || "",
  feedLimits: { home: 3, works: 3, news: 6 },
};
export const nav = [
  ["/about/", "KUMCについて"],
  ["/activities/", "活動"],
  ["/works/", "作品"],
  ["/achievements/", "実績"],
  ["/news/", "ニュース"],
  ["/join/", "入会方法"],
  ["/collaboration/", "ご依頼・連携"],
];
export const emailLink = (subject = "") =>
  `mailto:${site.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
