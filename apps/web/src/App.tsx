import { lazy, Suspense } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Gamepad2,
  Terminal,
} from 'lucide-react';
import { dataset } from '@ps5/data';
import { Button } from '@/components/ui/button';
import { ModelProfile } from '@/components/model-profile';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { CompatibilityPage } from './CompatibilityPage';
import { KnowledgePage } from './KnowledgePage';
import { DeviceGuidePage } from './DeviceGuidePage';
import { PreparationPage } from './PreparationPage';
import { SiteInfoPage } from './SiteInfoPage';
import { PageMetadata } from './components/page-metadata';
import { QuickCheck } from './components/quick-check';
import { DeviceCard, DeviceProvider } from './components/device-context';
const DemoCompatibilityPage = lazy(() => import('./DemoCompatibilityPage'));

function Home() {
  return (
    <>
      <QuickCheck />
      <section className="home-next" aria-labelledby="next-title">
        <h2 id="next-title">需要帮助？</h2>
        <div className="home-help-links">
          <Link to="/start">
            <BookOpen size={19} />
            <span>
              开始确认我的设备<small>查看型号与系统版本的位置</small>
            </span>
            <ArrowRight size={17} />
          </Link>
          <Link to="/knowledge">
            <CircleHelp size={19} />
            <span>
              阅读入门指南<small>了解查询结果和准备事项</small>
            </span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <details className="reading-extra model-example">
        <summary>型号示例：CFI-2200B01</summary>
        <h2>CFI-2200B01</h2>
        <p>已收录官方型号资料；出厂版本与兼容性仍未知，不继承其他系列。</p>
        <ModelProfile data={dataset} modelId="cfi-2200b01" />
        <Link className="text-link" to="/compatibility?model=cfi-2200b01">
          查看这个型号 →
        </Link>
      </details>
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
function AppContent() {
  return (
    <>
      <PageMetadata />
      <header>
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="PS5 Jailbreak Hub 首页">
            <span className="brand-icon">
              <Gamepad2 size={23} />
            </span>
            <span>
              PS5<span className="brand-light"> JAILBREAK HUB</span>
              <small>出厂版本参考 · Beta</small>
            </span>
          </Link>
          <nav aria-label="主导航">
            <NavLink to="/" end>
              首页
            </NavLink>
            <NavLink to="/compatibility">兼容性查询</NavLink>
            <NavLink to="/knowledge">知识库</NavLink>
          </nav>
          <ThemeSwitcher />
        </div>
      </header>
      <main>
        <DeviceCard />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<DeviceGuidePage />} />
          <Route path="/prepare" element={<PreparationPage />} />
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
          <Route path="/about" element={<SiteInfoPage key="about" />} />
          <Route path="/feedback" element={<SiteInfoPage key="feedback" />} />
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
        <div className="footer-links">
          <Link to="/about">关于与数据说明</Link>
          <Link to="/feedback">问题反馈 / 资料纠错</Link>
        </div>
      </footer>
    </>
  );
}
export default function App() {
  return (
    <DeviceProvider>
      <AppContent />
    </DeviceProvider>
  );
}
