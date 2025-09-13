export const MAXIMUM_USER_URL = (displayId: string) =>
  `https://id.maximum.vc/members/${displayId}`;
export const MAXIMUM_DISPLAY_ID_PATTERN = /^m\.([a-zA-Z0-9_-]+)$/g;
export const GITHUB_USER_URL = (githubId: string) =>
  `https://github.com/${githubId}`;
export const GITHUB_ID_PATTERN = /^gh\.([a-zA-Z0-9_-]+)$/g;
export const X_USER_URL = (xId: string) => `https://x.com/${xId}`;
export const X_ID_PATTERN = /^x\.([a-zA-Z0-9_-]+)$/g;
