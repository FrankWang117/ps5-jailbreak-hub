import { z } from 'zod';

export const siteLocationSchema = z
  .object({
    basePath: z
      .string()
      .regex(
        /^\/(?:[A-Za-z0-9_-]+\/)*$/,
        '站点路径必须以 / 开头和结尾，例如 /ps5/',
      ),
    siteUrl: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.siteUrl) return;
    try {
      const url = new URL(value.siteUrl);
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== value.basePath
      )
        ctx.addIssue({
          code: 'custom',
          message:
            '公开地址须为 HTTPS，路径与 basePath 一致，且不含账号、查询或锚点',
        });
    } catch {
      ctx.addIssue({ code: 'custom', message: '公开地址必须是完整 HTTPS URL' });
    }
  });
export type SiteLocation = z.infer<typeof siteLocationSchema>;
export function parseSiteLocation(input: {
  basePath?: string;
  siteUrl?: string;
}): SiteLocation {
  return siteLocationSchema.parse({
    basePath: input.basePath ?? '/',
    siteUrl: input.siteUrl || undefined,
  });
}
export function publicSiteRoot(site: SiteLocation, fallbackOrigin: string) {
  const valid = siteLocationSchema.parse(site);
  return valid.siteUrl ?? new URL(valid.basePath, fallbackOrigin).href;
}
