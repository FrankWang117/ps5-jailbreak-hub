import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { knowledgeBase } from '@ps5/data';
import { publicSiteRoot } from '@ps5/core';
import { siteLocation } from '../lib/site-location';

const brand = 'PS5 出厂版本参考 · Beta';
const defaults =
  '按序列号前缀查看 PS5 出厂版本参考，按型号浏览批次，确认实际系统版本。社区估计与破解兼容性分开展示。';
export function PageMetadata() {
  const { pathname, search } = useLocation();
  const article = knowledgeBase.articles.find(
    (a) => pathname === `/knowledge/${a.slug}`,
  );
  const pages: Record<string, string> = {
    '/': brand,
    '/compatibility': '实际系统版本查询',
    '/knowledge': 'PS5 中文入门指南',
    '/start': '确认我的设备',
    '/prepare': '电脑与网络准备',
    '/about': '关于与数据说明',
    '/feedback': '问题反馈与资料纠错',
    '/host': 'Host 开发说明',
    '/demo/compatibility': '兼容性查询演示',
  };
  const known = !!pages[pathname] || !!article;
  const title = article?.title ?? pages[pathname] ?? '页面不存在';
  const description = article?.summary ?? defaults;
  const noindex =
    !known ||
    !!search ||
    [
      '/host',
      '/demo/compatibility',
      '/feedback',
      '/start',
      '/prepare',
    ].includes(pathname);
  useEffect(() => {
    const root = publicSiteRoot(siteLocation, window.location.origin);
    const pageUrl = root + pathname.replace(/^\/+/, '');
    document.title = pathname === '/' ? brand : `${title} · ${brand}`;
    function meta(key: string, content: string, property = false) {
      const attribute = property ? 'property' : 'name';
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      );
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    }
    meta('description', description);
    meta('robots', noindex ? 'noindex, follow' : 'index, follow');
    meta('og:title', document.title, true);
    meta('og:description', description, true);
    meta('og:type', article ? 'article' : 'website', true);
    meta('og:image', `${root}share-card.jpg`, true);
    meta(
      'og:image:alt',
      'PS5 出厂版本参考：查前缀、看批次、确认实际版本',
      true,
    );
    meta('og:url', pageUrl, true);
    meta('twitter:card', 'summary_large_image');
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (noindex) canonical?.remove();
    else {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = pageUrl;
    }
  }, [pathname, title, description, noindex, article]);
  return null;
}
