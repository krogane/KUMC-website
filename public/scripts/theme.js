// Classic head script: resolve the theme before the first paint, under script-src 'self'.
(() => {
  const key = "kumc-theme";
  const root = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const normalize = (value) =>
    value === "light" || value === "dark" ? value : "auto";
  const read = () => {
    try {
      return normalize(localStorage.getItem(key));
    } catch {
      return "auto";
    }
  };
  let preference = read();

  function apply() {
    const theme =
      preference === "auto" ? (media.matches ? "dark" : "light") : preference;
    const changed = root.dataset.theme !== theme;
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#181818" : "#48689e";
    for (const button of document.querySelectorAll("[data-theme-value]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeValue === preference),
      );
    }
    for (const control of document.querySelectorAll("[data-theme-control]")) {
      control.hidden = false;
    }
    if (changed)
      document.dispatchEvent(
        new CustomEvent("kumc:themechange", {
          detail: { theme },
        }),
      );
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply, { once: true });
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-theme-value]");
    if (!button) return;
    preference = normalize(button.dataset.themeValue);
    try {
      localStorage.setItem(key, preference);
    } catch {
      // Keep this page usable when browser storage is blocked or full.
    }
    apply();
  });
  media.addEventListener("change", () => {
    if (preference === "auto") apply();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      preference = read();
      apply();
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      preference = read();
      apply();
    }
  });
})();
