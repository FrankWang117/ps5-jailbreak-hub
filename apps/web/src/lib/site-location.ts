import { parseSiteLocation } from '@ps5/core';
export const siteLocation = parseSiteLocation({
  basePath: import.meta.env.BASE_URL,
  siteUrl: import.meta.env.PROD ? import.meta.env.VITE_SITE_URL : undefined,
});
