import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { knowledgeBase } from '@ps5/data';
import {
  guideSearch,
  emptyDeviceProgress,
  modelCodeInputSchema,
  systemVersionInputSchema,
} from '@ps5/core';
import { useDevice } from './components/device-context';
import { Button } from './components/ui/button';

const article = knowledgeBase.articles.find((a) => a.slug === 'first-boot')!;
const steps = article.deviceGuide!.steps;
export function DeviceGuidePage() {
  const { progress, save, storageAvailable } = useDevice();
  const { answers, step } = progress;
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = steps[step];
  useEffect(() => {
    heading.current?.focus();
    heading.current?.scrollIntoView?.({ block: 'start' });
  }, [step]);
  function moveTo(nextStep: number) {
    setError('');
    setHelp(false);
    save({ ...progress, step: nextStep, confirmed: false });
  }
  function next() {
    if (
      step === 0 &&
      !modelCodeInputSchema.safeParse(answers.modelCode).success
    ) {
      setError('请照抄完整 CFI- 型号；还没找到可以先保留进度。');
      return;
    }
    if (step === 1 && answers.homeScreen !== 'yes') {
      setHelp(true);
      return;
    }
    if (
      step === 2 &&
      !systemVersionInputSchema.safeParse(answers.systemVersion).success
    ) {
      setError('请照抄数字版本原文，可包含点和短横线。');
      return;
    }
    moveTo(Math.min(step + 1, 3));
  }
  // 未通过校验的输入仅停留在本页，不作为已确认进度保存。
  const [modelDraft, setModelDraft] = useState(answers.modelCode);
  const [versionDraft, setVersionDraft] = useState(answers.systemVersion);
  function record(kind: 'model' | 'version', value: string) {
    if (kind === 'model') {
      setModelDraft(value);
      setVersionDraft('');
    } else setVersionDraft(value);
    const schema =
      kind === 'model' ? modelCodeInputSchema : systemVersionInputSchema;
    const parsed = schema.safeParse(value);
    save({
      ...progress,
      confirmed: false,
      answers: {
        ...answers,
        ...(kind === 'model'
          ? { homeScreen: 'unknown' as const, systemVersion: '' }
          : {}),
        [kind === 'model' ? 'modelCode' : 'systemVersion']: parsed.success
          ? parsed.data
          : '',
      },
    });
    setError('');
  }
  return (
    <section className="device-guide">
      <Link className="back-link" to="/">
        首页 / 确认我的设备
      </Link>
      <p className="eyebrow">设备确认 · 材料已核对，实机流程待验证</p>
      <ol className="device-steps" aria-label="设备确认步骤">
        {steps.map((s, i) => (
          <li key={s.id} aria-current={i === step ? 'step' : undefined}>
            <span>{i + 1}</span>
            {s.title}
          </li>
        ))}
      </ol>
      <article className="step-panel">
        <p className="muted">
          第 {step + 1} 步，共 4 步 ·{' '}
          {step === 0
            ? '在主机标签上查看'
            : step === 3
              ? '在本页核对'
              : '在 PS5 上查看'}
        </p>
        <h1 tabIndex={-1} ref={heading}>
          {current.title}
        </h1>
        <p>{current.action}</p>
        {step === 0 && (
          <>
            <figure className="label-key" aria-label="型号与序列号字段辨认示意">
              <div>
                <strong>CFI-…</strong>
                <span>记录这一项：完整型号</span>
              </div>
              <div>
                <strong>S/N …</strong>
                <span>不填写：序列号</span>
              </div>
              <figcaption>
                字段辨认示意，非真实标签；以你机身的实际标记为准。
              </figcaption>
            </figure>
            <div className="step-input">
              <label htmlFor="device-model">机身完整型号</label>
              <input
                id="device-model"
                value={modelDraft}
                maxLength={24}
                placeholder="CFI- 开头，包含完整后缀"
                onChange={(e) => record('model', e.target.value)}
              />
            </div>
          </>
        )}
        {step === 1 && (
          <div className="step-input">
            <label htmlFor="device-home">你现在看到什么？</label>
            <select
              id="device-home"
              value={answers.homeScreen}
              onChange={(e) =>
                save({
                  ...progress,
                  confirmed: false,
                  answers: {
                    ...answers,
                    homeScreen: e.target.value as 'unknown' | 'yes' | 'no',
                  },
                })
              }
            >
              <option value="unknown">还没有确认</option>
              <option value="yes">已经在主界面，能进入设置</option>
              <option value="no">尚未进入，或被提示阻碍</option>
            </select>
          </div>
        )}
        {step === 2 && (
          <>
            <ol className="menu-path" aria-label="查找版本路径">
              <li>设置</li>
              <li>系统</li>
              <li>系统软件</li>
              <li>主机信息</li>
            </ol>
            <p className="field-help">
              菜单路径示意，非实机截图；不同系统布局可能不同。
            </p>
            <div className="step-input">
              <label htmlFor="device-version">系统软件版本原文</label>
              <input
                id="device-version"
                value={versionDraft}
                maxLength={80}
                placeholder="照抄整行数字版本，不自行截取"
                onChange={(e) => record('version', e.target.value)}
              />
            </div>
            <details>
              <summary>日语菜单对照与来源</summary>
              <p>設定 → システム → システムソフトウェア → 本体情報</p>
              <Link to="/knowledge/first-boot#find-system-version">
                查看路径说明与官方来源 →
              </Link>
            </details>
          </>
        )}
        {step === 3 && (
          <dl className="device-review">
            <dt>型号</dt>
            <dd>{answers.modelCode}</dd>
            <dt>版本原文</dt>
            <dd>{answers.systemVersion}</dd>
            <dt>主界面</dt>
            <dd>你报告可以进入</dd>
          </dl>
        )}
        <div className="expected">
          <strong>怎样算完成？</strong>
          <p>{current.expected}</p>
        </div>
        <button
          className="text-link"
          onClick={() => setHelp(!help)}
          aria-expanded={help}
          aria-controls="step-help"
        >
          {help ? '收起处理说明' : '我的画面不一样 / 暂时做不到'}
        </button>
        {help && (
          <div id="step-help" className="step-help" role="status">
            <h2>先停在这一步</h2>
            <p>{current.help}</p>
            <p>已填写的有效信息会保留；以后从首页“继续确认设备”回来。</p>
            <Link to="/knowledge/first-boot">查看完整设备指南与来源 →</Link>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="step-actions">
          {step > 0 && (
            <Button variant="outline" onClick={() => moveTo(step - 1)}>
              上一步
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>确认这一步，继续</Button>
          ) : !progress.confirmed ? (
            <Button onClick={() => save({ ...progress, confirmed: true })}>
              信息正确，确认保存
            </Button>
          ) : (
            <Button asChild>
              <Link to={`/compatibility${guideSearch(answers)}`}>
                带着记录去查询 →
              </Link>
            </Button>
          )}
        </div>
        {progress.confirmed && (
          <p role="status">
            信息已由你核对。适用教程仍待查询与证据核验，较长版本不会自动转换。
          </p>
        )}
        <p className="field-help">
          {storageAvailable
            ? '有效记录自动保存在此浏览器；可随时返回修改。'
            : '此浏览器无法保存；当前页面仍可继续，关闭后进度可能丢失。'}{' '}
          不记录序列号或账号。
        </p>
      </article>
      <Link className="text-link" to="/knowledge/first-boot">
        完整指南、适用范围与来源 →
      </Link>
      <p>
        <button
          className="text-link"
          onClick={() => {
            save(emptyDeviceProgress());
            setModelDraft('');
            setVersionDraft('');
            setError('');
            setHelp(false);
          }}
        >
          清空记录，重新确认另一台主机
        </button>
      </p>
    </section>
  );
}
