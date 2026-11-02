import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { knowledgeBase } from '@ps5/data';

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
  useEffect(() => {
    // 文章间导航把焦点带到正文；章节锚点保留浏览器原生行为。
    if (!hash) heading.current?.focus({ preventScroll: true });
    if (!hash)
      document.querySelector('header')?.scrollIntoView?.({ block: 'start' });
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
          从读懂主机信息开始，学会判断来源与结论的边界。
        </p>
        <div className="notice">
          <BookOpen size={22} aria-hidden="true" />
          <div>
            <strong>先了解，再查询</strong>
            <p>
              官方说明与本站规则分别标注来源。文章只解释概念，不构成任何型号的兼容性结论。
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
                      {source.kind === 'official' ? '官方资料' : '本站规则'}
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
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>
      <RelatedKnowledge exclude={article.slug} />
      <Link className="text-link" to="/compatibility">
        返回正式兼容性查询 →
      </Link>
    </div>
  );
}
