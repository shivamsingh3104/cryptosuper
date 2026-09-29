// Site identity is derived from the host the app is served on, so the same
// build works on any domain without hardcoding one.
// Optional overrides: REACT_APP_SITE_NAME, REACT_APP_SITE_ORIGIN.

const host =
  (typeof window !== "undefined" && window.location.hostname) || "";

const origin =
  (typeof window !== "undefined" && window.location.origin) || "";

const deriveName = (hostname) => {
  if (!hostname || /^(localhost|127\.0\.0\.1)$/i.test(hostname)) return "Our";
  return hostname
    .replace(/^www\./i, "")
    .split(".")[0]
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

export const SITE_ORIGIN = process.env.REACT_APP_SITE_ORIGIN || origin;

export const SITE_NAME = process.env.REACT_APP_SITE_NAME || deriveName(host);

// Possessive form used in copy like "Verify <Site>'s channels".
export const SITE_POSSESSIVE = `${SITE_NAME}'s`;
