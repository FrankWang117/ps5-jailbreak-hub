import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { parseSiteLocation } from '../../packages/core/src/site-location';

const envDir = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, envDir, 'VITE_');
  const productionSite = parseSiteLocation({
    basePath: env.VITE_BASE_PATH,
    siteUrl: env.VITE_SITE_URL,
  });
  const localDev = command === 'serve' && !isPreview;
  const site = localDev ? parseSiteLocation({}) : productionSite;
  return {
    envDir,
    base: site.basePath,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'ps5-public-location',
        transformIndexHtml(html) {
          return {
            html: html.replace(
              '__PS5_SHARE_IMAGE__',
              `${site.siteUrl ?? site.basePath}share-card.jpg`,
            ),
            tags: site.siteUrl
              ? [
                  {
                    tag: 'link',
                    attrs: { rel: 'canonical', href: site.siteUrl },
                    injectTo: 'head',
                  },
                ]
              : [],
          };
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'site-config.json',
            source: JSON.stringify(site, null, 2) + '\n',
          });
        },
      },
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  };
});
