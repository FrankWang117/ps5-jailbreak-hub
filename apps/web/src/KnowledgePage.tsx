import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { knowledgeBase } from '@ps5/data';
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
        {articles.map((item) => (
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
  const { pathname, hash } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const article = knowledgeBase.articles.find((item) => item.slug === slug);
  const guideStep =
    slug === 'first-boot'
      ? 'first-boot'
      : slug === 'firmware-1240-routes'
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
      section?.focus({ preventScroll: true });
      section?.scrollIntoView?.({ block: 'start' });
    } else {
      heading.current?.focus({ preventScroll: true });
      document.querySelector('header')?.scrollIntoView?.({ block: 'start' });
    }
  }, [pathname, hash]);
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
          还没开机？先读首次开机指南，再确认版本、查询适用信息。
        </p>
        <div className="notice">
          <BookOpen size={22} aria-hidden="true" />
          <div>
            <strong>先了解，再查询</strong>
            <p>
              官方说明、项目声明、社区报告与本站建议分别标注。指南与路线说明待实机验证，文章不构成任何型号的兼容性结论。
            </p>
          </div>
        </div>
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
          来源适用范围见文末
        </p>
        {guideStep && <GuideNavigation current={guideStep} />}
        <div className="reading-layout">
          <aside className="article-toc" aria-label="本文目录">
            <h2>本文目录</h2>
            <ul>
              {article.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
            <a href="#article-sources">来源与适用范围</a>
          </aside>
          <div className="article-body">
            {article.sections.map((section) => (
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
            ))}
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
                        <a href={source.url} target="_blank" rel="noreferrer">
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
                    {source.revision && <p>版本 / 快照：{source.revision}</p>}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>
      {guideStep && <GuideNext current={guideStep} />}
      <RelatedKnowledge exclude={article.slug} />
      <Link className="text-link" to="/compatibility">
        {article.slug === 'first-boot'
          ? '带着实际版本，去正式查询 →'
          : '返回正式兼容性查询 →'}
      </Link>
    </div>
  );
}
