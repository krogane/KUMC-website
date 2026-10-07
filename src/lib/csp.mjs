export function cspPolicy(hashes = []) {
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    `script-src 'self' ${hashes.join(" ")} https://www.googletagmanager.com https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com https://platform.x.com https://syndication.x.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://pbs.twimg.com https://abs.twimg.com https://syndication.twitter.com https://syndication.x.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self'",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://syndication.twitter.com https://cdn.syndication.twimg.com https://syndication.x.com",
    "frame-src https://platform.twitter.com https://syndication.twitter.com https://platform.x.com https://syndication.x.com",
  ].join("; ");
}
