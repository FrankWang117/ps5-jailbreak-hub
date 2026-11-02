import { useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleHelp,
  Cpu,
  ExternalLink,
  Gamepad2,
  Search,
  ShieldCheck,
  Terminal,
  Layers3,
} from 'lucide-react';
import { dataset } from '@ps5/data';
import {
  queryCompatibility,
  statusLabels,
  type CompatibilityStatus,
} from '@ps5/core';
import { Button } from '@/components/ui/button';

function Status({ status }: { status: CompatibilityStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}
const descriptions: Record<CompatibilityStatus, string> = {
  verified: '有可靠证据支持的明确组合',
  partial: '有证据支持，但存在功能限制',
  researching: '有公开研究证据，尚待完善',
  no_public_method: '截至核验时间未有公开方案',
  unknown: '缺少足够证据，无法判断',
};
function Legend() {
  return (
    <div className="legend">
      {(Object.keys(statusLabels) as CompatibilityStatus[]).map((s) => (
        <div key={s}>
          <Status status={s} />
          <p>{descriptions[s]}</p>
        </div>
      ))}
    </div>
  );
}
function ConsoleArt() {
  return (
    <div
      className="console-art"
      role="img"
      aria-label="抽象 PS5 主机示意图，非真实型号外观"
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="console-body">
        <div className="console-core" />
        <div className="console-wing left" />
        <div className="console-wing right" />
        <div className="console-line" />
      </div>
      <div className="art-label">
        <span className="live-dot" /> SYSTEM / UNKNOWN{' '}
        <small>概念示意 · 非型号实物</small>
      </div>
    </div>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span /> 中文 PS5 研究与知识入口
          </div>
          <h1>
            先了解你的主机。
            <br />
            <em>再探索更多可能。</em>
          </h1>
          <p className="hero-copy">
            从主机型号到系统固件，查阅有来源的兼容性信息。
            <br className="desktop-break" />
            让每一个判断，都有证据可循。
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/compatibility">
                <Search size={17} />
                查询固件兼容性
                <ArrowRight size={17} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#knowledge">
                浏览入门知识
                <ArrowUpRight size={16} />
              </a>
            </Button>
          </div>
          <div className="hero-notes">
            <span>
              <ShieldCheck size={15} />
              证据优先
            </span>
            <span>
              <Layers3 size={15} />
              型号精确匹配
            </span>
            <span>
              <Terminal size={15} />
              无漏洞执行
            </span>
          </div>
        </div>
        <ConsoleArt />
      </section>
      <div className="notice">
        <CircleHelp size={19} />
        <div>
          <strong>M0 预览 · 当前仅含示例数据</strong>
          <p>
            本站尚未建立真实兼容性档案。所有未验证组合均为“未知”，请勿据此升级、降级或购买主机。
          </p>
        </div>
        <span className="small-tag">SAMPLE DATA</span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">START HERE</div>
            <h2>你的探索，从这里开始</h2>
          </div>
          <span className="muted">两种设备，同一个知识入口</span>
        </div>
        <div className="feature-grid">
          <Link to="/compatibility" className="feature-card">
            <Search className="feature-icon" />
            <span className="card-index">01 / COMPATIBILITY</span>
            <h3>固件兼容性查询</h3>
            <p>选择主机型号、输入固件版本，查看精确匹配的状态与来源。</p>
            <span className="card-link">
              开始查询 <ArrowRight size={17} />
            </span>
          </Link>
          <a href="#knowledge" className="feature-card">
            <BookOpen className="feature-icon" />
            <span className="card-index">02 / KNOWLEDGE</span>
            <h3>中文入门知识</h3>
            <p>认识主机型号、系统版本与兼容性状态，建立正确的查询习惯。</p>
            <span className="card-link">
              阅读基础说明 <ArrowRight size={17} />
            </span>
          </a>
          <Link to="/host" className="feature-card">
            <Gamepad2 className="feature-icon" />
            <span className="card-index">03 / CONSOLE HOST</span>
            <h3>PS5 主机端入口</h3>
            <p>面向电视浏览的轻量静态页面，M0 仅提供信息与入口说明。</p>
            <span className="card-link">
              了解 Host <ArrowRight size={17} />
            </span>
          </Link>
        </div>
      </section>
      <section className="model-panel">
        <div>
          <div className="eyebrow">MODEL SPOTLIGHT</div>
          <h2>CFI-2200B01</h2>
          <p>本阶段重点展示型号</p>
          <span className="model-code">型号条目 · 信息待核验</span>
        </div>
        <div className="model-details">
          <Cpu size={24} />
          <h3>型号 ≠ 固件版本</h3>
          <p>{dataset.models[0].description}</p>
          <Status status="unknown" />
        </div>
        <Button asChild variant="outline">
          <Link to="/compatibility?model=cfi-2200b01">
            查询此型号 <ArrowRight size={16} />
          </Link>
        </Button>
      </section>
      <section className="section" id="knowledge">
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE BASICS</div>
            <h2>查询之前，先了解这三件事</h2>
          </div>
          <BookOpen className="muted" />
        </div>
        <div className="knowledge-grid">
          {[
            [
              '01',
              '在哪里查看系统版本？',
              '在主机设置中查找系统软件与主机信息，并以设备实际显示的版本为准。不要从型号或包装反推固件。',
            ],
            [
              '02',
              '版本越低就一定能破解吗？',
              '不能根据版本大小判断。兼容性需要对应型号、固件版本和具体方案的独立证据。',
            ],
            [
              '03',
              '“未知”代表不支持吗？',
              '未知表示证据不足，并不代表已确认支持或不支持。研究状态也不等于可用方案。',
            ],
          ].map(([n, title, copy]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section status-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">READ THE SIGNAL</div>
            <h2>五种状态，清晰表达证据边界</h2>
          </div>
        </div>
        <Legend />
      </section>
    </>
  );
}
function CompatibilityPage() {
  const initialModel = new URLSearchParams(window.location.search).get('model');
  const [model, setModel] = useState(
    dataset.models.some((x) => x.id === initialModel)
      ? initialModel!
      : dataset.models[0].id,
  );
  const [firmware, setFirmware] = useState('');
  const [submission, setSubmission] = useState<{
    model: string;
    firmware: string;
  } | null>(null);
  const [error, setError] = useState('');
  const result = submission
    ? queryCompatibility(dataset, submission.model, submission.firmware)
    : null;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{1,2}\.\d{2}$/.test(firmware.trim())) {
      setError('请输入有效格式，例如 03.00。示例版本不代表已验证支持。');
      setSubmission(null);
      return;
    }
    setError('');
    setSubmission({ model, firmware: firmware.trim() });
  }
  function resetResult() {
    setSubmission(null);
    setError('');
  }
  return (
    <section className="query-page">
      <Link className="back-link" to="/">
        首页 / 固件兼容性
      </Link>
      <div className="eyebrow">COMPATIBILITY EXPLORER</div>
      <h1>
        了解你的主机兼容性<span>。</span>
      </h1>
      <p className="page-intro">按型号与固件精确查询。没有证据，就保留未知。</p>
      <div className="notice">
        <ShieldCheck size={20} />
        <div>
          <strong>示例数据模式</strong>
          <p>
            可输入 03.00
            查看示例记录，或输入其他版本查看未知结果。所有版本均不构成真实兼容性结论。
          </p>
        </div>
      </div>
      <div className="query-layout">
        <form className="query-form" onSubmit={submit} noValidate>
          <div className="panel-title">
            <Search size={19} />
            <h2>选择你的主机</h2>
          </div>
          <label htmlFor="model">主机型号</label>
          <select
            id="model"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              resetResult();
            }}
          >
            {dataset.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="field-help">
            {dataset.models.find((x) => x.id === model)?.description}
          </p>
          <label htmlFor="firmware">系统固件版本</label>
          <input
            id="firmware"
            placeholder="例如 03.00"
            value={firmware}
            onChange={(e) => {
              setFirmware(e.target.value);
              resetResult();
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'firmware-error' : 'firmware-help'}
            autoComplete="off"
            maxLength={20}
          />
          <p id="firmware-help" className="field-help">
            手动输入设备显示的版本；不按版本范围推断。
          </p>
          {error && (
            <p className="error" id="firmware-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            <Search size={17} />
            查询兼容性
            <ArrowRight size={17} />
          </Button>
          <div className="form-note">
            <Check size={15} />
            仅查询信息，不运行任何主机端代码
          </div>
        </form>
        <div className="result-panel" aria-live="polite" aria-atomic="true">
          {!result || !submission ? (
            <div className="empty-result">
              <div className="empty-icon">
                <Cpu size={35} />
              </div>
              <h2>等待你的查询</h2>
              <p>
                选择型号并输入固件版本，
                <br />
                查看匹配记录与来源证据。
              </p>
              <span className="small-tag">EXACT MATCH ONLY</span>
            </div>
          ) : (
            <>
              <div className="result-header">
                <div className="eyebrow">QUERY RESULT · 示例查询</div>
                <Status status="unknown" />
              </div>
              <h2>
                {dataset.models.find((x) => x.id === submission.model)?.code}
              </h2>
              <p className="firmware-value">
                系统固件 <strong>{submission.firmware}</strong>
              </p>
              <div className="result-message">
                <CircleHelp size={21} />
                <div>
                  <h3>兼容性未知</h3>
                  <p>{result.reason}</p>
                </div>
              </div>
              {result.records.map((r) => (
                <article className="evidence-card" key={r.id}>
                  <div className="eyebrow">
                    {dataset.methods.find((x) => x.id === r.methodId)?.name}
                  </div>
                  <p>{r.explanation}</p>
                  {r.evidenceIds.map((id) => {
                    const ev = dataset.evidence.find((x) => x.id === id)!;
                    return (
                      <details key={id}>
                        <summary>查看示例来源结构 · 未核验</summary>
                        <p>{ev.summary}</p>
                        <dl>
                          <dt>发布者</dt>
                          <dd>{ev.publisher}</dd>
                          <dt>记录日期</dt>
                          <dd>{ev.checkedAt.slice(0, 10)}（示例）</dd>
                          <dt>适用范围</dt>
                          <dd>
                            {ev.scope.modelId} / {submission.firmware} /{' '}
                            {ev.scope.methodId}
                          </dd>
                        </dl>
                        <a href={ev.url} target="_blank" rel="noreferrer">
                          {ev.title}
                          <ExternalLink size={13} />
                        </a>
                      </details>
                    );
                  })}
                </article>
              ))}
              <p className="field-help">
                未知不等于不支持。本站没有可用于确认此组合的可靠证据。
              </p>
            </>
          )}
        </div>
      </div>
      <div className="section-heading">
        <h2>如何理解查询状态</h2>
      </div>
      <Legend />
    </section>
  );
}
function HostPage() {
  return (
    <section className="host-info">
      <div className="eyebrow">PS5 HOST / M0</div>
      <Terminal size={48} />
      <h1>为主机端准备的轻量入口</h1>
      <p>
        Host 是独立的原生 HTML、CSS、JavaScript
        应用。当前仅提供状态说明和本地检测，不包含漏洞利用、Payload
        加载或代码执行入口。
      </p>
      <div className="notice">
        <CircleHelp />
        <div>
          <strong>本地启动方式</strong>
          <p>
            在项目根目录执行 <code>pnpm dev:host</code>，在本机访问
            http://127.0.0.1:5174。PS5 实机访问需另行配置局域网监听，M0
            尚未实机验证。
          </p>
        </div>
      </div>
      <Button asChild variant="outline">
        <Link to="/compatibility">
          返回兼容性查询
          <ArrowRight size={16} />
        </Link>
      </Button>
    </section>
  );
}
export default function App() {
  return (
    <>
      <header>
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="PS5 Jailbreak Hub 首页">
            <span className="brand-icon">
              <Layers3 size={23} />
            </span>
            <span>
              PS5<span className="brand-light"> JAILBREAK HUB</span>
              <small>中文主机研究站</small>
            </span>
          </Link>
          <nav aria-label="主导航">
            <NavLink to="/" end>
              首页
            </NavLink>
            <NavLink to="/compatibility">兼容性查询</NavLink>
            <NavLink to="/host">
              PS5 Host <ArrowUpRight size={13} />
            </NavLink>
          </nav>
          <span className="header-badge">
            <span /> M0 PREVIEW
          </span>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compatibility" element={<CompatibilityPage />} />
          <Route path="/host" element={<HostPage />} />
          <Route
            path="*"
            element={
              <section className="host-info">
                <h1>页面不存在</h1>
                <Link to="/">返回首页</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="footer-brand">
          PS5 JAILBREAK HUB <span>独立中文知识项目 · 非 Sony 官方网站</span>
        </div>
        <p>M0 · 示例数据 / 证据优先 / 不执行漏洞代码</p>
      </footer>
    </>
  );
}
