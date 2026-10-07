import {
  CONSENT_KEY,
  readConsent,
  saveConsent,
  analyticsAllowed,
  cleanPageUrl,
  eventPayload,
} from "./privacy-core.js";
const body = document.body;
const config = {
  site: body.dataset.siteUrl,
  id: body.dataset.measurementId,
  enabled: body.dataset.analyticsEnabled === "true",
};
const banner = document.querySelector("#consent-banner");
const status = document.querySelector("#consent-status");
let loaded = false,
  expiryTimer;
let returnFocus = null;
const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => {
        throw Error("unavailable");
      },
    };
  }
};
const consent = () => readConsent(storage());
const allowed = () => analyticsAllowed(config, location.origin, consent());
function stop() {
  window[`ga-disable-${config.id}`] = true;
  // Remove only GA cookies this origin can manage. No claim about already-sent data.
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!/^_ga(?:_|$)/.test(name)) continue;
    const hosts = [location.hostname, "." + location.hostname];
    const parts = location.hostname.split(".");
    if (parts.length > 2) hosts.push("." + parts.slice(-2).join("."));
    const paths = ["/"];
    let path = "";
    for (const part of location.pathname.split("/").filter(Boolean)) {
      path += "/" + part;
      paths.push(path, path + "/");
    }
    for (const path of paths) {
      document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
      for (const domain of hosts)
        document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}; SameSite=Lax`;
    }
  }
  clearTimeout(expiryTimer);
  if (loaded) location.reload();
}
function scheduleExpiry() {
  clearTimeout(expiryTimer);
  const c = consent();
  if (!c) return;
  expiryTimer = setTimeout(
    () => {
      if (!allowed()) stop();
      else scheduleExpiry();
    },
    Math.min(c.expires - Date.now() + 1, 2147483647),
  );
}
function start() {
  if (loaded || !allowed()) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  const page = cleanPageUrl(location.href);
  let ref = "";
  try {
    ref = new URL(document.referrer).origin;
  } catch {}
  window.gtag("config", config.id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: page,
    page_referrer: ref,
    cookie_flags: "SameSite=Lax;Secure",
  });
  window.gtag("event", "page_view", {
    page_location: page,
    page_referrer: ref,
    page_title: document.title,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.id)}`;
  script.id = "ga-script";
  document.head.append(script);
  scheduleExpiry();
}
function showSettings(opener) {
  returnFocus = opener || null;
  banner.hidden = false;
  document.querySelector("[data-consent-close]").hidden = !opener;
  status.textContent = config.enabled
    ? "現在の設定：" + (consent()?.choice === "granted" ? "許可" : "未許可")
    : "この環境ではアクセス解析を送信しません。公開サイトでのみ有効になります。";
}
function closeSettings() {
  banner.hidden = true;
  returnFocus?.focus();
  returnFocus = null;
}
for (const button of document.querySelectorAll("[data-consent-open]")) {
  button.hidden = false;
  button.addEventListener("click", () => {
    showSettings(button);
    banner.querySelector("button").focus();
  });
}
for (const button of document.querySelectorAll("[data-consent]"))
  button.addEventListener("click", () => {
    const choice = button.dataset.consent;
    if (!saveConsent(storage(), choice)) {
      status.textContent = "設定を保存できないため、解析は行いません。";
      stop();
      return;
    }
    closeSettings();
    if (choice === "granted") start();
    else stop();
  });
document
  .querySelector("[data-consent-close]")
  .addEventListener("click", closeSettings);
window.addEventListener("storage", (e) => {
  if (e.key === CONSENT_KEY || e.key === null) {
    if (!allowed()) stop();
    else start();
  }
});
window.addEventListener("pageshow", () => {
  if (loaded && !allowed()) stop();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && loaded && !allowed()) stop();
});
if (config.enabled && !consent()) showSettings();
start();
document.addEventListener("click", (e) => {
  const anchor = e.target.closest?.("a[data-event]");
  if (!anchor || !allowed() || !loaded) return;
  const payload = eventPayload(anchor.dataset);
  if (payload)
    window.gtag("event", payload.name, {
      ...payload.params,
      page_location: cleanPageUrl(location.href),
      page_referrer: "",
    });
});
for (const button of document.querySelectorAll("[data-copy-email]")) {
  button.hidden = false;
  button.addEventListener("click", async () => {
    const message = document.getElementById(button.dataset.copyStatus);
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      message.textContent = "メールアドレスをコピーしました。";
    } catch {
      message.textContent =
        "コピーできませんでした。表示されているメールアドレスを選択してコピーしてください。";
    }
  });
}
const menu = document.querySelector(".mobile-menu");
const summary = menu?.querySelector("summary");
menu?.addEventListener("toggle", () =>
  summary.setAttribute("aria-expanded", String(menu.open)),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu?.open) {
    menu.open = false;
    summary.focus();
  } else if (e.key === "Escape" && !banner.hidden && returnFocus) {
    closeSettings();
  }
});
document.addEventListener("click", (e) => {
  if (menu?.open && !menu.contains(e.target)) menu.open = false;
});
matchMedia("(min-width:1121px)").addEventListener("change", (e) => {
  if (e.matches && menu) menu.open = false;
});
const filters = document.querySelector("[data-filters]");
if (filters) {
  filters.hidden = false;
  filters.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-filter]");
    if (!button) return;
    for (const b of filters.querySelectorAll("button"))
      b.setAttribute("aria-pressed", String(b === button));
    let count = 0;
    for (const card of document.querySelectorAll("[data-category]")) {
      card.hidden =
        button.dataset.filter !== "all" &&
        card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    }
    document.getElementById("filter-count").textContent =
      `${count}件の作品を表示しています。`;
  });
}
const xButton = document.getElementById("load-x");
if (xButton) {
  xButton.hidden = false;
  xButton.addEventListener(
    "click",
    () => {
      xButton.disabled = true;
      const message = document.getElementById("x-status");
      message.textContent = "Xから読み込んでいます…";
      const fallback = () => {
        message.textContent =
          "投稿を表示できませんでした。下のプロフィールリンクからご覧ください。";
      };
      const timer = setTimeout(fallback, 15000);
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://platform.twitter.com/widgets.js";
      script.onerror = () => {
        clearTimeout(timer);
        fallback();
      };
      script.onload = async () => {
        try {
          if (!window.twttr?.widgets) throw Error("unavailable");
          const frame = await window.twttr.widgets.createTimeline(
            { sourceType: "profile", screenName: "KUMC_X" },
            document.getElementById("x-timeline"),
            {
              height: 480,
              dnt: true,
              theme: "light",
              chrome: "noheader nofooter",
            },
          );
          clearTimeout(timer);
          if (!frame) throw Error("no frame");
          document.getElementById("x-placeholder").hidden = true;
          document.querySelector(".x-reserved").classList.add("loaded");
        } catch {
          clearTimeout(timer);
          fallback();
        }
      };
      document.head.append(script);
    },
    { once: true },
  );
}

for (const label of document.querySelectorAll("[data-feed-stale]"))
  if (
    !label.dataset.feedFetched ||
    Date.now() - Date.parse(label.dataset.feedFetched) > 48 * 60 * 60 * 1000
  )
    label.hidden = false;
