import { useEffect, useRef } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { knowledgeBase } from '@ps5/data';
import { RouteGuide } from './components/route-guide';
import { GuideNavigation, GuideNext } from './components/guide-navigation';

const sourceLabels = {
  official: '官方资料',
  project: '项目一手资料',
  community: '社区报告',
  editorial: '本站规则',
};

export function RelatedKnowledge({ exclude }: { exclude?: string }) {
  const article = knowledgeBase.articles.find((item) => item.slug === exclude);
  const articles = article
    ? knowledgeBase.articles.filter((item) =>
        article.relatedSlugs.includes(item.slug),
      )
    : knowledgeBase.articles;
  return (
    <aside className="related-knowledge" aria-label="相关阅读">
      <h2>相关阅读</h2>
      <ul>
        {articles.slice(0, 3).map((item) => (
          <li key={item.slug}>
            <Link to={`/knowledge/${item.slug}`}>
              {item.title}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function KnowledgePage() {
  const { slug } = useParams();
  const { pathname, hash, search, key: locationKey } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const article = knowledgeBase.articles.find((item) => item.slug === slug);
  const Background = slug === 'choosing-a-route' ? 'details' : 'div';
  const guideStep =
    slug === 'first-boot'
      ? 'first-boot'
      : slug === 'choosing-a-route'
        ? 'routes'
        : slug === 'browser-entry-preparation'
          ? 'preparation'
          : slug === 'webkit-first-install'
            ? 'installation'
            : slug === 'offline-game-workflow'
              ? 'offline'
              : null;
  useEffect(() => {
    // 路由跳转带锚点时也把阅读位置与键盘焦点带到目标章节。
    if (hash) {
      const section = document.getElementById(hash.slice(1));
      for (
        let parent = section?.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
      section?.focus({ preventScroll: true });
      section?.scrollIntoView?.({ block: 'start' });
    } else if (!(
      slug === 'choosing-a-route' &&
      new URLSearchParams(search).get('review') === '1'
    )) {
      heading.current?.focus({ preventScroll: true });
      document.querySelector('header')?.scrollIntoView?.({ block: 'start' });
    }
  }, [pathname, hash, locationKey, slug, search]);
  if (slug === 'firmware-1240-routes')
    return (
      <Navigate to={`/knowledge/choosing-a-route${search}${hash}`} replace />
    );
  if (slug && !article) {
    return (
      <section className="query-page">
        <h1 ref={heading} tabIndex={-1}>
          文章不存在
        </h1>
        <p className="page-intro">
          这篇文章可能已移动，请从知识库目录重新选择。
        </p>
        <Link className="text-link" to="/knowledge">
          返回知识库目录
        </Link>
      </section>
    );
  }
  if (!article) {
    return (
      <section className="query-page knowledge-page">
        <div className="eyebrow">PLAYER’S HANDBOOK</div>
        <h1 ref={heading} tabIndex={-1}>
          中文入门知识库
        </h1>
        <p className="page-intro">
          按顺序确认设备、查路线、读教程。适用于不同 PS5 型号。
        </p>
        <div className="article-grid">
          {knowledgeBase.articles.map((item, index) => (
            <Link
              className="article-card"
              key={item.slug}
              to={`/knowledge/${item.slug}`}
            >
              <span className="eyebrow">GUIDE / 0{index + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <span className="article-meta">
                更新于 <time dateTime={item.updatedAt}>{item.updatedAt}</time>
              </span>
              <span className="card-link">
                开始阅读
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
        <Link className="text-link" to="/compatibility">
          准备好了，去查询兼容性 →
        </Link>
      </section>
    );
  }
  return (
    <div className="query-page knowledge-page">
      <Link className="back-link" to="/knowledge">
        知识库 / 返回目录
      </Link>
      <article aria-labelledby="article-title">
        <div className="eyebrow">PLAYER’S HANDBOOK</div>
        <h1 id="article-title" ref={heading} tabIndex={-1}>
          {article.title}
        </h1>
        <p className="page-intro">{article.summary}</p>
        <p className="article-meta">
          本站编辑 · 更新于{' '}
          <time dateTime={article.updatedAt}>{article.updatedAt}</time> ·
          适用性按实际型号与版本核对
        </p>
        {guideStep && <GuideNavigation current={guideStep} />}
        {slug === 'first-boot' && (
          <p>
            <Link className="text-link" to="/start">
              按步骤确认我的设备 →
            </Link>
          </p>
        )}
        {slug === 'browser-entry-preparation' && (
          <p>
            <Link className="text-link" to="/prepare">
              按步骤准备电脑与网络 →
            </Link>
          </p>
        )}
        {(slug === 'webkit-first-install' ||
          slug === 'offline-game-workflow') && (
          <div className="tutorial-boundary">
            <strong>资料草稿 · 材料已核对，完整路线与实机复现待完成</strong>
            <p>
              当前页面供了解流程，尚未确认你的设备适用。首次安装草稿以 macOS
              为例，Windows / Linux 尚无完整分步教程。
            </p>
            <Link to="/knowledge/choosing-a-route">查看我的准备条件 →</Link>
          </div>
        )}
        {slug === 'choosing-a-route' && <RouteGuide key={search} />}
        <Background className="route-background">
          {slug === 'choosing-a-route' && (
            <summary>路线原理与来源（按需阅读）</summary>
          )}
          <div className="reading-layout">
            <aside className="article-toc" aria-label="本文目录">
              <details>
                <summary>本文目录</summary>
                <ul>
                  {article.sections.map((section) => (
                    <li key={section.id}>
                      <Link to={`${search}#${section.id}`}>
                        {section.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to={`${search}#article-sources`}>来源与适用范围</Link>
              </details>
            </aside>
            <div className="article-body">
              {article.sections.map((section) => {
                const content = (
                  <section id={section.id} key={section.id} tabIndex={-1}>
                    <h2>{section.title}</h2>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.snippet && (
                      <figure className="guide-snippet">
                        <figcaption>{section.snippet.label}</figcaption>
                        <pre aria-label={section.snippet.label} tabIndex={0}>
                          <code>{section.snippet.code}</code>
                        </pre>
                      </figure>
                    )}
                    {section.diagram && (
                      <figure
                        className="guide-diagram"
                        aria-label={section.diagram.label}
                      >
                        <p className="diagram-label">{section.diagram.label}</p>
                        <ol>
                          {section.diagram.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                        <figcaption>{section.diagram.caption}</figcaption>
                      </figure>
                    )}
                  </section>
                );
                return section.collapsed ? (
                  <details key={section.id} className="reading-extra">
                    <summary>{section.title}</summary>
                    {content}
                  </details>
                ) : (
                  content
                );
              })}
              <details className="reading-extra source-disclosure">
                <summary>来源与适用范围</summary>
                <section
                  id="article-sources"
                  className="article-sources"
                  tabIndex={-1}
                >
                  <h2>来源与适用范围</h2>
                  <p>
                    核验日期表示本站阅读来源的时间，不代表来源发布日期或设备实测日期。
                  </p>
                  <ul>
                    {article.sources.map((source) => (
                      <li key={source.title}>
                        <span className="small-tag">
                          {sourceLabels[source.kind]}
                        </span>
                        <h3>
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title}（新窗口）
                            </a>
                          ) : (
                            source.title
                          )}
                        </h3>
                        <p>
                          {source.publisher} ·{' '}
                          {source.kind === 'official' ? '核验' : '复核'}于{' '}
                          <time dateTime={source.checkedAt}>
                            {source.checkedAt}
                          </time>
                        </p>
                        <p>{source.scope}</p>
                        {source.revision && (
                          <p>版本 / 快照：{source.revision}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              </details>
            </div>
          </div>
        </Background>
      </article>
      {guideStep && guideStep !== 'routes' && <GuideNext current={guideStep} />}
      <RelatedKnowledge exclude={article.slug} />
      <Link className="text-link" to="/compatibility">
        {article.slug === 'first-boot'
          ? '带着实际版本，去正式查询 →'
          : '返回正式兼容性查询 →'}
      </Link>
    </div>
  );
}
