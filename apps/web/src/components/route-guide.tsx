import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { dataset } from '@ps5/data';
import {
  assessGuideReadiness,
  guideAnswersFromSearch,
  guideAnswersSchema,
  guideSearch,
  progressForAnswers,
  type GuideAnswers,
} from '@ps5/core';
import { Button } from './ui/button';
import { useDevice } from './device-context';

const labels = { unknown: '还不确定', yes: '可以', no: '不可以' };
const missingLabels = {
  model: '完整主机型号',
  version: '设备显示的版本原文',
  'home-screen': '是否能进入主机主界面',
  'version-mapping': '完整版本与兼容性目录的可靠对应关系',
  computer: '可用电脑条件（当前整理的本地首次安装草稿需要电脑）',
  'computer-os': '电脑使用的系统',
  compatibility: '对应型号、版本和方案的可用性证据',
};
const osLabels = {
  unknown: '还不确定',
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  other: '其他系统',
};
const actions = {
  'device-info': {
    title: '先确认设备信息',
    copy: '先记录型号、版本并确认能否进入主界面。若初始化要求更新或登录，记录画面，暂不进入安装。',
    href: '/knowledge/first-boot',
    link: '查看设备确认步骤 →',
  },
  'version-review': {
    title: '适用教程尚未确认',
    copy: '本站尚未核实这个完整版本的适用教程，设备记录已保留。对应关系由本站继续核验，你无需自行截取或研究；现在可以先阅读通用准备说明。',
    href: '/prepare',
    link: '只阅读通用准备说明 →',
  },
  'computer-check': {
    title: '先确认电脑准备条件',
    copy: '当前整理的本地首次安装草稿需要同局域网电脑。没有电脑或尚未确认时，先了解准备清单；这不表示其他入口不存在，也不要求购买设备。',
    href: '/prepare',
    link: '了解电脑与网络准备 →',
  },
  'os-check': {
    title: '先确认电脑系统',
    copy: '选择电脑使用的系统后，重新查看下一步；不知道也可以保留“还不确定”。',
    href: '#condition-os',
    link: '回到电脑系统选项 →',
  },
  'evidence-review': {
    title: '先阅读精确记录的限制',
    copy: '有对应的已验证或部分可用记录，仍需逐方案阅读限制与核验日期。此引导没有验证执行教程，不能据此直接安装。',
    href: '/compatibility',
    link: '返回查询查看记录 →',
  },
  'preparation-reading': {
    title: '可以先了解浏览器准备',
    copy: '设备和电脑条件已填写，但仍缺少精确可用性证据。目前可以阅读准备说明，暂不据此执行安装、恢复备份或加载组件。',
    href: '/prepare',
    link: '只阅读准备说明 →',
  },
};

export function RouteGuide() {
  const { progress, save } = useDevice();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(() =>
    params.size ? guideAnswersFromSearch(params.toString()) : progress.answers,
  );
  const [reviewed, setReviewed] = useState(params.get('review') === '1');
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLElement>(null);
  const result = reviewed ? assessGuideReadiness(dataset, answers) : null;
  useEffect(() => {
    if (reviewed) {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView?.({ block: 'start' });
    }
  }, [reviewed]);
  function change<K extends keyof GuideAnswers>(
    key: K,
    value: GuideAnswers[K],
  ) {
    setAnswers((old) => ({
      ...old,
      [key]: value,
      ...(key === 'computer' && value !== 'yes'
        ? { computerOs: 'unknown' as const }
        : {}),
    }));
    setReviewed(false);
    setError('');
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = guideAnswersSchema.safeParse(answers);
    if (!parsed.success) {
      setReviewed(false);
      setError(
        '请填写完整 CFI- 型号和设备显示的数字版本；还不知道的字段可以留空。',
      );
      return;
    }
    setAnswers(parsed.data);
    save(progressForAnswers(parsed.data, progress));
    const next = new URLSearchParams(guideSearch(parsed.data));
    next.set('review', '1');
    navigate({ search: `?${next.toString()}`, hash: '' }, { replace: true });
    setReviewed(true);
    setError('');
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView?.({ block: 'start' });
  }
  const action = result ? actions[result.stage] : null;
  return (
    <section className="condition-guide" aria-labelledby="condition-title">
      <h2 id="condition-title">先回答这几个问题</h2>
      <p>只填写你知道的信息；不确定就保留未知，网站会告诉你下一步。</p>
      <form onSubmit={submit} noValidate className="condition-form">
        <div>
          <label htmlFor="condition-model">主机型号（可留空）</label>
          <input
            id="condition-model"
            value={answers.modelCode}
            maxLength={24}
            placeholder="完整 CFI- 编号"
            onChange={(e) => change('modelCode', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="condition-version">版本原文（可留空）</label>
          <input
            id="condition-version"
            value={answers.systemVersion}
            maxLength={80}
            placeholder="照抄设备显示的版本"
            onChange={(e) => change('systemVersion', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="condition-home">能进入主机主界面吗？</label>
          <select
            id="condition-home"
            value={answers.homeScreen}
            onChange={(e) =>
              change(
                'homeScreen',
                guideAnswersSchema.shape.homeScreen.parse(e.target.value),
              )
            }
          >
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition-computer">有可用电脑吗？</label>
          <select
            id="condition-computer"
            value={answers.computer}
            onChange={(e) =>
              change(
                'computer',
                guideAnswersSchema.shape.computer.parse(e.target.value),
              )
            }
          >
            <option value="unknown">还不确定</option>
            <option value="yes">有</option>
            <option value="no">没有</option>
          </select>
        </div>
        {answers.computer === 'yes' && (
          <div>
            <label htmlFor="condition-os">电脑使用什么系统？</label>
            <select
              id="condition-os"
              value={answers.computerOs}
              onChange={(e) =>
                change(
                  'computerOs',
                  guideAnswersSchema.shape.computerOs.parse(e.target.value),
                )
              }
            >
              {Object.entries(osLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit">查看我的下一步</Button>
      </form>
      {!result && (
        <p className="field-help">
          回答确认后保留在页面地址，刷新可恢复。修改条件后请重新查看下一步。
        </p>
      )}
      {result && action && (
        <section
          ref={resultRef}
          tabIndex={-1}
          className="condition-result"
          aria-label="我的下一步"
        >
          <span className="small-tag">当前阶段：信息核对与准备</span>
          <h2>{action.title}</h2>
          <p>{action.copy}</p>
          <div className="condition-summary">
            <div>
              <h3>已经知道</h3>
              <ul>
                {result.answers.modelCode && (
                  <li>型号原文：{result.answers.modelCode}（用户填写）</li>
                )}
                {result.version && (
                  <li>版本原文：{result.version.original}（未换算）</li>
                )}
                {result.answers.homeScreen !== 'unknown' && (
                  <li>进入主界面：{labels[result.answers.homeScreen]}</li>
                )}
                {result.answers.computer !== 'unknown' && (
                  <li>
                    可用电脑：
                    {result.answers.computer === 'yes' ? '有' : '没有'}
                  </li>
                )}
                {result.answers.computer === 'yes' &&
                  result.answers.computerOs !== 'unknown' && (
                    <li>电脑系统：{osLabels[result.answers.computerOs]}</li>
                  )}
                {!result.answers.modelCode &&
                  !result.version &&
                  result.answers.homeScreen === 'unknown' &&
                  result.answers.computer === 'unknown' && (
                    <li>还没有确认的信息，可先保留未知。</li>
                  )}
              </ul>
            </div>
            <div>
              <h3>还缺什么</h3>
              <ul>
                {result.missing.map((key) => (
                  <li key={key}>{missingLabels[key]}</li>
                ))}
                {result.missing.length === 0 && (
                  <li>执行教程的适用步骤与验证；精确记录不代替完整教程。</li>
                )}
              </ul>
            </div>
          </div>
          <Link
            className="text-link"
            to={
              result.stage === 'evidence-review'
                ? `/compatibility${guideSearch(result.answers)}`
                : action.href.startsWith('#')
                  ? `${guideSearch(result.answers)}&review=1${action.href}`
                  : action.href
            }
          >
            {action.link}
          </Link>
          <p className="field-help">
            本页只给核对和准备建议，没有推荐执行路线；条件变化不会沿用旧结果。
          </p>
          {result.answers.computer === 'yes' &&
            result.answers.computerOs !== 'unknown' &&
            result.answers.computerOs !== 'macos' && (
              <p className="field-help">
                当前安装草稿仅以 macOS 为例，尚无可直接照做的{' '}
                {osLabels[result.answers.computerOs]}{' '}
                分步教程；无需翻译或套用命令。
              </p>
            )}
        </section>
      )}
    </section>
  );
}
