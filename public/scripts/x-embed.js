// The SDK load event can precede widget readiness. Share one SDK per page.
let sdkPromise;
function loadSDK() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    let settled = false;
    const script = document.createElement("script");
    const timer = setTimeout(() => fail(), 15000);
    function fail() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      sdkPromise = null;
      reject(new Error("X widgets unavailable"));
    }
    script.async = true;
    script.src = "https://platform.twitter.com/widgets.js";
    script.onerror = fail;
    script.onload = () => {
      if (!window.twttr?.ready) return fail();
      window.twttr.ready((twitter) => {
        if (settled) return;
        clearTimeout(timer);
        if (!twitter.widgets?.createTimeline) return fail();
        settled = true;
        resolve(twitter);
      });
    };
    document.head.append(script);
  });
  return sdkPromise;
}

export function initXEmbed() {
  const button = document.getElementById("load-x");
  const timeline = document.getElementById("x-timeline");
  if (!button || !timeline) return;
  const message = document.getElementById("x-status");
  const placeholder = document.getElementById("x-placeholder");
  const reserved = timeline.closest(".x-reserved");
  let loading = false;

  async function load() {
    if (loading) return;
    loading = true;
    button.hidden = true;
    button.disabled = true;
    timeline.setAttribute("aria-busy", "true");
    message.textContent = "Xから読み込んでいます…";
    // Isolate each attempt so a timed-out widget cannot replace a later result.
    const mount = document.createElement("div");
    timeline.replaceChildren(mount);
    let timer;
    try {
      const frame = await Promise.race([
        loadSDK().then((twitter) => twitter.widgets.createTimeline(
          { sourceType: "profile", screenName: timeline.dataset.screenName },
          mount,
          { height: 480, dnt: true, theme: "light", chrome: "noheader nofooter" },
        )),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("X timeline timeout")), 20000);
        }),
      ]);
      if (!frame || !mount.contains(frame)) throw new Error("No X timeline");
      placeholder.hidden = true;
      reserved.classList.add("loaded");
      message.textContent = "";
    } catch {
      mount.remove();
      placeholder.hidden = false;
      reserved.classList.remove("loaded");
      message.textContent = "投稿を表示できませんでした。再試行するか、下のプロフィールリンクからご覧ください。";
      button.hidden = false;
      button.disabled = false;
    } finally {
      clearTimeout(timer);
      timeline.setAttribute("aria-busy", "false");
      loading = false;
    }
  }

  button.addEventListener("click", load);
  load();
}
