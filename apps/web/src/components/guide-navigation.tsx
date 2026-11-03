import { Link } from 'react-router-dom';

// 阅读位置只表示页面顺序，不记录或推断设备操作进度。
const steps = [
  { id: 'first-boot', label: '开机前', to: '/knowledge/first-boot' },
  { id: 'query', label: '版本检查', to: '/compatibility' },
  {
    id: 'routes',
    label: '路线说明',
    to: '/knowledge/firmware-1240-routes',
  },
  {
    id: 'preparation',
    label: '浏览器准备',
    to: '/knowledge/browser-entry-preparation',
  },
  {
    id: 'installation',
    label: '安装草稿',
    to: '/knowledge/webkit-first-install',
  },
] as const;

type GuideStep = (typeof steps)[number]['id'];

export function GuideNavigation({ current }: { current: GuideStep }) {
  return (
    <nav className="guide-navigation" aria-label="新手阅读路径">
      <p>从确认设备到准备路线</p>
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
      <small>
        这是阅读顺序，不表示设备操作已完成。安装教程为草稿，待实机验证。
      </small>
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
      <p>可以先了解下一步条件，不需要现在操作主机。</p>
    </div>
  );
}
