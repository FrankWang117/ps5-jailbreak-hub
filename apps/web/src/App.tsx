import { lazy, Suspense } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircleHelp,
  Cpu,
  Gamepad2,
  Search,
  ShieldCheck,
  Terminal,
  Layers3,
} from 'lucide-react';
import { dataset } from '@ps5/data';
import { Button } from '@/components/ui/button';
import { Status, Legend } from '@/components/status';
import { ModelProfile } from '@/components/model-profile';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { CompatibilityPage } from './CompatibilityPage';
import { KnowledgePage } from './KnowledgePage';
const DemoCompatibilityPage = lazy(() => import('./DemoCompatibilityPage'));

function ConsoleArt() {
  return (
    <div
      className="console-art"
      role="img"
      aria-label="抽象游戏手柄插画，非真实主机型号外观"
    >
      <div className="art-grid" aria-hidden="true" />
      <div className="art-disc" aria-hidden="true" />
      <span className="art-sticker sticker-top" aria-hidden="true">
        LET’S PLAY <span>↗</span>
      </span>
      <svg
        className="controller-art"
        viewBox="0 0 480 320"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="pad-face"
            x1="100"
            y1="60"
            x2="340"
            y2="300"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9d3f4" />
          </linearGradient>
        </defs>
        <ellipse
          cx="243"
          cy="277"
          rx="151"
          ry="18"
          fill="#30234b"
          opacity=".16"
        />
        <path
          d="M135 80C105 82 88 107 73 150L48 239C39 279 79 293 101 266L151 216H329L379 266C401 293 441 279 432 239L407 150C392 107 375 82 345 80L287 91H193L135 80Z"
          fill="#30224c"
          stroke="#30224c"
          strokeWidth="7"
          strokeLinejoin="round"
          transform="translate(0 9)"
        />
        <path
          d="M135 80C105 82 88 107 73 150L48 239C39 279 79 293 101 266L151 216H329L379 266C401 293 441 279 432 239L407 150C392 107 375 82 345 80L287 91H193L135 80Z"
          fill="url(#pad-face)"
          stroke="#30224c"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M193 91H287L298 161H182L193 91Z"
          fill="#8872d4"
          stroke="#30224c"
          strokeWidth="4"
        />
        <path
          d="M200 103H280"
          stroke="#c7bded"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M120 116H143V137H164V160H143V181H120V160H99V137H120V116Z"
          fill="#30224c"
        />
        <circle cx="188" cy="199" r="28" fill="#30224c" />
        <circle cx="188" cy="199" r="18" stroke="#796c9d" strokeWidth="3" />
        <circle cx="291" cy="199" r="28" fill="#30224c" />
        <circle cx="291" cy="199" r="18" stroke="#796c9d" strokeWidth="3" />
        <circle
          cx="350"
          cy="122"
          r="13"
          fill="#bded78"
          stroke="#30224c"
          strokeWidth="3"
        />
        <circle
          cx="377"
          cy="149"
          r="13"
          fill="#ff9c9f"
          stroke="#30224c"
          strokeWidth="3"
        />
        <circle
          cx="323"
          cy="149"
          r="13"
          fill="#8fbfff"
          stroke="#30224c"
          strokeWidth="3"
        />
        <circle
          cx="350"
          cy="176"
          r="13"
          fill="#b8a0f0"
          stroke="#30224c"
          strokeWidth="3"
        />
        <path
          d="M343 182L357 169M343 169L357 182"
          stroke="#30224c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="240" cy="203" r="7" fill="#bded78" />
      </svg>
      <span className="art-spark spark-one" aria-hidden="true">
        ✦
      </span>
      <span className="art-spark spark-two" aria-hidden="true">
        ✳
      </span>
      <div className="art-label">
        <Gamepad2 size={18} aria-hidden="true" />
        <div>
          PLAYER’S GUIDE<small>探索主机，从了解开始</small>
        </div>
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
            <span /> READY, PLAYER? · 中文 PS5 知识站
          </div>
          <h1>
            玩得尽兴。
            <br />
            <em>探索得明白。</em>
          </h1>
          <p className="hero-copy">
            你的 PS5，还有多少值得了解？从型号到固件，
            <br className="desktop-break" />
            一起探索有来源、有依据的主机知识。
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/knowledge/first-boot">
                <BookOpen size={17} />
                第一次开机，从这里开始
                <ArrowRight size={17} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/compatibility">
                <Search size={17} />
                查询我的主机
                <ArrowRight size={17} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/knowledge">
                浏览入门知识
                <ArrowUpRight size={16} />
              </Link>
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
          <strong>M1 · 型号资料已有来源，兼容性仍待核验</strong>
          <p>
            已收录 CFI-2200B01
            官方产品资料；暂无通过核验的兼容性记录。未验证组合保持“未知”，不据此推断破解能力。
          </p>
        </div>
        <span className="small-tag">SOURCE FIRST</span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">CHOOSE YOUR QUEST</div>
            <h2>选择你的下一站</h2>
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
          <Link to="/knowledge" className="feature-card">
            <BookOpen className="feature-icon" />
            <span className="card-index">02 / KNOWLEDGE</span>
            <h3>中文入门知识</h3>
            <p>认识主机型号、系统版本与兼容性状态，建立正确的查询习惯。</p>
            <span className="card-link">
              阅读基础说明 <ArrowRight size={17} />
            </span>
          </Link>
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
          <span className="model-code">官方产品资料 · 兼容性未知</span>
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
      <ModelProfile data={dataset} modelId="cfi-2200b01" />
      <section className="section" id="knowledge">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LEVEL UP YOUR KNOWLEDGE</div>
            <h2>查询之前，先了解这三件事</h2>
          </div>
          <Link className="text-link" to="/knowledge">
            进入知识库 →
          </Link>
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
            <div className="eyebrow">KNOW YOUR STATUS</div>
            <h2>五种状态，清晰表达证据边界</h2>
          </div>
        </div>
        <Legend />
      </section>
    </>
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
              <Gamepad2 size={23} />
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
            <NavLink to="/knowledge">知识库</NavLink>
            <NavLink to="/host">
              PS5 Host <ArrowUpRight size={13} />
            </NavLink>
          </nav>
          <ThemeSwitcher />
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/compatibility"
            element={<CompatibilityPage key="published" />}
          />
          <Route
            path="/demo/compatibility"
            element={
              <Suspense
                fallback={<p className="page-intro">正在加载演示目录…</p>}
              >
                <DemoCompatibilityPage />
              </Suspense>
            }
          />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/knowledge/:slug" element={<KnowledgePage />} />
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
        <p>M2 · 中文知识库 / 演示隔离 / 证据优先</p>
      </footer>
    </>
  );
}
