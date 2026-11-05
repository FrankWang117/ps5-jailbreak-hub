import { Link } from 'react-router-dom';

// 阅读位置只表示页面顺序，不记录或推断设备操作进度。
const steps = [
  { id: 'first-boot', label: '开机前', to: '/knowledge/first-boot' },
  { id: 'query', label: '版本检查', to: '/compatibility' },
  {
    id: 'routes',
    label: '路线说明',
    to: '/knowledge/choosing-a-route',
  },
  {
    id: 'preparation',
    label: '浏览器准备',
    to: '/prepare',
  },
  {
    id: 'installation',
    label: '安装草稿',
    to: '/knowledge/webkit-first-install',
  },
  {
    id: 'offline',
    label: '离线游玩草稿',
    to: '/knowledge/offline-game-workflow',
  },
] as const;

type GuideStep = (typeof steps)[number]['id'];

export function GuideNavigation({ current }: { current: GuideStep }) {
  const index = steps.findIndex((step) => step.id === current);
  return (
    <nav className="guide-navigation" aria-label="新手阅读路径">
      <details>
        <summary>
          阅读路径 · {index + 1}/6 {steps[index].label}
          <span>展开全部步骤</span>
        </summary>
        <ol>
          {steps.map((step, index) => (
            <li key={step.id}>
              <Link
                to={step.to}
                aria-current={step.id === current ? 'step' : undefined}
              >
                <span aria-hidden="true">0{index + 1}</span>
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
        <small>阅读位置不代表操作进度；安装与游玩步骤待实机验证。</small>
      </details>
    </nav>
  );
}

export function GuideNext({ current }: { current: GuideStep }) {
  const index = steps.findIndex((step) => step.id === current);
  const next = steps[index + 1];
  if (!next) return null;
  return (
    <div className="guide-next">
      <Link className="text-link" to={next.to}>
        继续阅读：{next.label} →
      </Link>
    </div>
  );
}
