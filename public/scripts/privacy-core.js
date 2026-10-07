export const CONSENT_KEY = "kumc-analytics-v1";
export const CONSENT_TTL = 180 * 24 * 60 * 60 * 1000;
export function readConsent(storage, now = Date.now()) {
  try {
    const v = JSON.parse(storage.getItem(CONSENT_KEY) || "null");
    return v?.version === 1 &&
      ["granted", "denied"].includes(v.choice) &&
      Number.isFinite(v.expires) &&
      v.expires > now &&
      v.expires <= now + CONSENT_TTL + 1000
      ? v
      : null;
  } catch {
    return null;
  }
}
export function saveConsent(storage, choice, now = Date.now()) {
  if (!["granted", "denied"].includes(choice)) return false;
  try {
    const value = { version: 1, choice, expires: now + CONSENT_TTL };
    storage.setItem(CONSENT_KEY, JSON.stringify(value));
    return readConsent(storage, now)?.choice === choice;
  } catch {
    return false;
  }
}
export function analyticsAllowed(config, origin, consent) {
  return (
    config.enabled === true &&
    /^G-[A-Z0-9]{6,20}$/.test(config.id) &&
    origin === config.site &&
    consent?.choice === "granted" &&
    consent.expires > Date.now()
  );
}
export function cleanPageUrl(url) {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) ? u.origin + u.pathname : "";
  } catch {
    return "";
  }
}
const values = {
  placement: [
    "header",
    "hero",
    "footer",
    "join",
    "contact",
    "collaboration",
    "work",
    "feed",
    "embed",
  ],
  method: ["email", "x"],
  platform: ["x", "blog", "colony"],
};
export function eventPayload(data) {
  if (
    ![
      "join_click",
      "contact_click",
      "work_download_click",
      "social_click",
    ].includes(data.event)
  )
    return null;
  const params = {};
  for (const key of Object.keys(values))
    if (values[key].includes(data[key])) params[key] = data[key];
  if (
    data.event === "work_download_click" &&
    /^[a-z0-9-]{1,80}$/.test(data.workId || "")
  )
    params.work_id = data.workId;
  return { name: data.event, params };
}
