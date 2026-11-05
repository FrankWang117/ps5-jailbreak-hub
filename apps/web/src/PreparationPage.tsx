import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Router, Gamepad2 } from 'lucide-react';
import { preparationContent as content } from '@ps5/data';
import {
  assessPreparation,
  emptyPreparation,
  guideAnswersSchema,
  guideSearch,
  preparationProgressSchema,
  progressForAnswers,
  readPreparation,
  type PreparationProgress,
} from '@ps5/core';
import { useDevice, preparationStorageKey } from './components/device-context';
import { Button } from './components/ui/button';

export function PreparationPage() {
  const {
    progress: device,
    save: saveDevice,
    storageAvailable: deviceStorage,
  } = useDevice();
  const [progress, setProgress] = useState(() => {
    try {
      return readPreparation(
        localStorage.getItem(preparationStorageKey),
        device.answers,
      );
    } catch {
      return emptyPreparation(device.answers);
    }
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const { step, basis } = progress;
  const current = content.steps[step];
  const platform =
    basis.computerOs === 'unknown' ? null : content.platforms[basis.computerOs];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView?.({ block: 'start' });
  }, [step]);
  function save(next: PreparationProgress) {
    const valid = preparationProgressSchema.parse(next);
    setProgress(valid);
    try {
      localStorage.setItem(preparationStorageKey, JSON.stringify(valid));
    } catch {
      setStorageAvailable(false);
    }
  }
  function computerChange(field: 'computer' | 'computerOs', value: string) {
    const answers = guideAnswersSchema.parse({
      ...basis,
      [field]: value,
      ...(field === 'computer' && value !== 'yes'
        ? { computerOs: 'unknown' }
        : {}),
    });
    saveDevice(progressForAnswers(answers, device));
    save(emptyPreparation(answers));
    setHelp(false);
    setError('');
  }
  function move(nextStep: number) {
    save({ ...progress, step: nextStep, confirmed: false });
    setHelp(false);
    setError('');
  }
  function next() {
    const result = assessPreparation(progress);
    if (!result.canAdvance) {
      setHelp(true);
      setError('请先确认本步的信息；还不能确认时，可以停留并保留当前进度。');
      return;
    }
    move(step + 1);
  }
  function check(
    field: 'addressLocated' | 'networkPlanned' | 'settingsRecorded',
    value: boolean,
  ) {
    save({ ...progress, [field]: value, confirmed: false });
    setError('');
  }
  return (
    <section className="device-guide" ref={panel}>
      <Link className="back-link" to="/knowledge/choosing-a-route">
        准备条件 / 电脑与网络
      </Link>
      <p className="eyebrow">准备信息核对 · 实际互通与安装待验证</p>
      <ol className="device-steps" aria-label="电脑与网络准备步骤">
        {content.steps.map((s, i) => (
          <li key={s.title} aria-current={i === step ? 'step' : undefined}>
            <span>{i + 1}</span>
            {s.title}
          </li>
        ))}
      </ol>
      <article className="step-panel">
        <p className="muted">
          第 {step + 1} 步，共 4 步 ·{' '}
          {step === 0
            ? '选择电脑'
            : step === 3
              ? '核对你的记录'
              : '在设备上查看，在自己的笔记中记录'}
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {current.title}
        </h1>
        <p>{current.action}</p>
        {step === 0 && (
          <>
            <div className="step-input">
              <label htmlFor="prep-computer">有可用电脑吗？</label>
              <select
                id="prep-computer"
                value={basis.computer}
                onChange={(e) => computerChange('computer', e.target.value)}
              >
                <option value="unknown">还不确定</option>
                <option value="yes">有</option>
                <option value="no">没有</option>
              </select>
            </div>
            {basis.computer === 'yes' && (
              <div className="step-input">
                <label htmlFor="prep-os">电脑使用什么系统？</label>
                <select
                  id="prep-os"
                  value={basis.computerOs}
                  onChange={(e) => computerChange('computerOs', e.target.value)}
                >
                  <option value="unknown">还不确定</option>
                  {Object.entries(content.platforms).map(([id, p]) => (
                    <option key={id} value={id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        {step === 1 && platform && (
          <>
            <div className="platform-instructions">
              <h2>{platform.label}：查看当前连接</h2>
              {!platform.menuVerified && (
                <p className="field-help">
                  该系统的具体菜单尚未核验，仅提供通用准备说明。
                </p>
              )}
              <ol>
                {platform.instructions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </div>
            <label className="prep-check">
              <input
                type="checkbox"
                checked={progress.addressLocated}
                onChange={(e) => check('addressLocated', e.target.checked)}
              />
              我已找到并在本地记下电脑当前连接的 IPv4 地址
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <figure
              className="network-figure"
              aria-label="家庭网络连接计划示意"
            >
              <div className="network-map">
                <div>
                  <Laptop aria-hidden="true" />
                  <strong>电脑</strong>
                  <span>查看地址、后续提供本地服务</span>
                </div>
                <span aria-hidden="true">⇄</span>
                <div>
                  <Router aria-hidden="true" />
                  <strong>家庭路由器</strong>
                  <span>有线或 Wi-Fi 的本地连接</span>
                </div>
                <span aria-hidden="true">⇄</span>
                <div>
                  <Gamepad2 aria-hidden="true" />
                  <strong>PS5</strong>
                  <span>后续访问电脑本地服务</span>
                </div>
              </div>
              <figcaption>
                连接计划示意，非实测。局域网互通、互联网访问和 PSN
                登录是不同事项；本步不要求连接互联网。
              </figcaption>
            </figure>
            <p>
              同一路由器或同名 Wi-Fi
              不能证明设备互通；访客网络、网络隔离、多网卡和 VPN
              等仍需后续核对。
            </p>
            <p>
              只保留当前设置。未配置或没有显示的值写明“未配置 /
              未显示”，不要猜测补填；没有这些记录也不要先改 DNS。
            </p>
            <label className="prep-check">
              <input
                type="checkbox"
                checked={progress.networkPlanned}
                onChange={(e) => check('networkPlanned', e.target.checked)}
              />
              我已明确电脑和 PS5 的家庭网络连接计划，实际互通尚未验证
            </label>
            <label className="prep-check">
              <input
                type="checkbox"
                checked={progress.settingsRecorded}
                onChange={(e) => check('settingsRecorded', e.target.checked)}
              />
              我已在本地保留主机原网络设置；未配置的项目也已注明
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <dl className="device-review">
              <dt>电脑系统</dt>
              <dd>{platform?.label}</dd>
              <dt>电脑地址</dt>
              <dd>你报告已在本地记下</dd>
              <dt>连接计划</dt>
              <dd>你已核对，实际互通未验证</dd>
              <dt>原网络设置</dt>
              <dd>你报告已保留现状</dd>
              <dt>设备适用性</dt>
              <dd>尚未确认</dd>
            </dl>
            {!device.answers.modelCode ||
            !device.answers.systemVersion ||
            device.answers.homeScreen !== 'yes' ? (
              <p>
                <Link to="/start">设备信息仍有缺项，继续确认设备 →</Link>
              </p>
            ) : (
              <p>设备记录仍为原文；准备勾选不改变兼容性结论。</p>
            )}
            <p className="field-help">
              {basis.computerOs === 'macos'
                ? '现有 macOS 安装篇仍是资料草稿，不能据此直接安装。'
                : `${platform?.label} 的完整安装分步教程尚未完成，不套用其他系统的命令。`}
            </p>
          </>
        )}
        <div className="expected">
          <strong>怎样算完成？</strong>
          <p>{current.expected}</p>
        </div>
        <button
          className="text-link"
          aria-expanded={help}
          aria-controls="prep-help"
          onClick={() => setHelp(!help)}
        >
          {help ? '收起处理说明' : '找不到 / 和我的情况不一样'}
        </button>
        {help && (
          <div className="step-help" id="prep-help" role="status">
            <h2>先保留当前进度</h2>
            <p>{current.help}</p>
            <Link to="/knowledge/browser-entry-preparation">
              查看准备资料与来源 →
            </Link>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="step-actions">
          {step > 0 && (
            <Button variant="outline" onClick={() => move(step - 1)}>
              上一步
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>确认本步，继续</Button>
          ) : !progress.confirmed ? (
            <Button onClick={() => save({ ...progress, confirmed: true })}>
              确认准备记录
            </Button>
          ) : (
            <Link
              className="text-link"
              to={`/knowledge/choosing-a-route${guideSearch(basis)}&review=1`}
            >
              返回查看当前缺项 →
            </Link>
          )}
        </div>
        {progress.confirmed && (
          <p role="status">
            准备记录已保存。网络互通、教程适用性与实际安装仍未验证。
          </p>
        )}
        <p className="field-help">
          {storageAvailable && deviceStorage
            ? '准备进度保存在当前浏览器，刷新可继续。'
            : '此浏览器无法保存进度；当次仍可继续，关闭后可能丢失。'}{' '}
          本页只保存确认项，不收集 IP、Wi-Fi 名称或 DNS
          数值。换网络后请返回重新核对。
        </p>
      </article>
      <p>
        <Link className="text-link" to="/knowledge/browser-entry-preparation">
          完整准备资料与来源 →
        </Link>
      </p>
      <details className="preparation-sources">
        <summary>本篇来源与核验范围 · {content.updatedAt}</summary>
        <ul>
          {content.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <p>
                {source.publisher} · 核验于 {source.checkedAt}
              </p>
              <p>{source.scope}</p>
            </li>
          ))}
        </ul>
        <p>
          连接计划、记录顺序和停止条件为本站编排，不是第三方工具执行或实机互通证明。
        </p>
      </details>
    </section>
  );
}
