export function cspPolicy(hashes = []) {
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    `script-src 'self' ${hashes.join(" ")} https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self'",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
    "frame-src 'none'",
  ].join("; ");
}
