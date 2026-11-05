import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight, Check, Cpu } from 'lucide-react';
import { dataset } from '@ps5/data';
import {
  firmwareVersionSchema,
  systemVersionInputSchema,
  captureSystemVersion,
  guideSearch,
  progressForAnswers,
  modelCodeInputSchema,
  type Dataset,
} from '@ps5/core';
import { Button } from '@/components/ui/button';
import { Legend } from '@/components/status';
import { ModelProfile } from '@/components/model-profile';
import { RelatedKnowledge } from './KnowledgePage';
import { CompatibilityResults } from '@/components/compatibility-results';
import { GuideNavigation } from './components/guide-navigation';
import { useDevice } from './components/device-context';
export function CompatibilityPage({
  data = dataset,
  mode = 'published',
}: {
  data?: Dataset;
  mode?: 'published' | 'demo';
}) {
  const { progress, save } = useDevice();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialModel = searchParams.get('model');
  const [model, setModel] = useState(
    mode === 'demo'
      ? (data.models.find((x) => x.id === initialModel)?.id ??
          data.models[0]?.id ??
          '')
      : (data.models.find((x) => x.id === initialModel)?.code ??
          (modelCodeInputSchema.safeParse(initialModel).success
            ? initialModel!
            : searchParams.has('model')
              ? ''
              : progress.answers.modelCode)),
  );
  const [firmware, setFirmware] = useState(
    mode === 'published' &&
      systemVersionInputSchema.safeParse(searchParams.get('version')).success
      ? searchParams.get('version')!
      : mode === 'published' && !searchParams.has('version')
        ? progress.answers.systemVersion
        : '',
  );
  const [submission, setSubmission] = useState<{
    model: string;
    firmware: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [modelError, setModelError] = useState('');
  const selectedModel =
    mode === 'demo'
      ? data.models.find((x) => x.id === model)
      : data.models.find((x) => x.code === model.trim());
  function submit(e: FormEvent) {
    e.preventDefault();
    const validModel =
      mode === 'demo' || modelCodeInputSchema.safeParse(model.trim()).success;
    setModelError(
      validModel ? '' : '请照抄完整 CFI- 型号编号，包含末尾字母和数字。',
    );
    if (!validModel) {
      setSubmission(null);
      return;
    }
    if (
      !(
        mode === 'demo' ? firmwareVersionSchema : systemVersionInputSchema
      ).safeParse(firmware.trim()).success
    ) {
      setError(
        '请照抄设备显示的数字版本，可包含点和短横线；例如 12.40.00.09。',
      );
      setSubmission(null);
      return;
    }
    setError('');
    setSubmission({ model, firmware: firmware.trim() });
    if (mode === 'published') {
      if (
        model.trim() !== progress.answers.modelCode ||
        firmware.trim() !== progress.answers.systemVersion
      )
        save(
          progressForAnswers({
            ...progress.answers,
            modelCode: model.trim(),
            systemVersion: firmware.trim(),
            homeScreen: 'unknown',
          }),
        );
      setSearchParams(
        { model: model.trim(), version: firmware.trim() },
        { replace: true },
      );
    }
  }
  function resetResult() {
    setSubmission(null);
    setError('');
    setModelError('');
  }
  const unmapped =
    mode === 'published' &&
    submission &&
    captureSystemVersion(submission.firmware).kind === 'unmapped';
  const nextSearch =
    submission && mode === 'published'
      ? guideSearch({
          modelCode: submission.model.trim(),
          systemVersion: submission.firmware,
          homeScreen:
            progress.answers.modelCode === submission.model.trim() &&
            progress.answers.systemVersion === submission.firmware
              ? progress.answers.homeScreen
              : 'unknown',
          computer: progress.answers.computer,
          computerOs: progress.answers.computerOs,
        })
      : '';
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
      {mode === 'published' && <GuideNavigation current="query" />}
      <div className="notice">
        <ShieldCheck size={20} />
        <div>
          <strong>
            {mode === 'demo'
              ? '演示数据模式 · 与正式目录隔离'
              : '正式资料目录 · 兼容性证据持续核验'}
          </strong>
          <p>
            {mode === 'demo'
              ? '可输入 03.00 查看示例记录。演示值与示例来源不能证明真实兼容性。'
              : `已收录有来源的型号资料与 ${data.compatibility.length} 条兼容性记录。可查询其他完整型号；没有精确证据时显示未知。`}
          </p>
          <Link
            className="mode-link"
            to={mode === 'demo' ? '/compatibility' : '/demo/compatibility'}
          >
            {mode === 'demo' ? '返回正式查询 →' : '体验独立示例查询 →'}
          </Link>
        </div>
      </div>
      <div className="query-layout">
        <form className="query-form" onSubmit={submit} noValidate>
          <div className="panel-title">
            <Search size={19} />
            <h2>输入你的主机信息</h2>
          </div>
          <label htmlFor="model">主机型号</label>
          {mode === 'demo' ? (
            <select
              id="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                resetResult();
              }}
            >
              {data.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.startsWith(m.code) ? m.name : `${m.code} · ${m.name}`}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                id="model"
                list="known-models"
                value={model}
                placeholder="照抄机身上的完整 CFI- 编号"
                autoComplete="off"
                maxLength={24}
                aria-invalid={!!modelError}
                aria-describedby={modelError ? 'model-error' : 'model-help'}
                onChange={(e) => {
                  setModel(e.target.value);
                  resetResult();
                }}
              />
              <datalist id="known-models">
                {data.models.map((m) => (
                  <option key={m.id} value={m.code} />
                ))}
              </datalist>
              <p id="model-help" className="field-help">
                可输入其他型号；未收录的型号与版本保持未知。
              </p>
              {modelError && (
                <p id="model-error" className="error" role="alert">
                  {modelError}
                </p>
              )}
            </>
          )}
          {selectedModel && (
            <ModelProfile data={data} modelId={selectedModel.id} />
          )}
          <label htmlFor="firmware">系统固件版本</label>
          <Link
            className="text-link"
            to="/knowledge/first-boot#find-system-version"
          >
            不知道版本在哪里？查看位置 →
          </Link>
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
            maxLength={80}
          />
          <p id="firmware-help" className="field-help">
            照抄完整版本或已有短版本。保留原文，不自动截取或换算。
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
          {!submission ? (
            <div className="empty-result">
              <div className="empty-icon">
                <Cpu size={35} />
              </div>
              <h2>等待你的查询</h2>
              <p>输入完整型号和固件版本，查看匹配结果。</p>
              <span className="small-tag">EXACT MATCH ONLY</span>
            </div>
          ) : unmapped ? (
            <div className="result-message">
              <div>
                <h2>版本原文已保留</h2>
                <p className="firmware-value">
                  <strong>{submission.firmware}</strong>
                </p>
                <h3>暂不能对应兼容性目录</h3>
                <p>
                  已记录 {submission.model.trim()}{' '}
                  的版本。缺少可靠的版本对应关系，不会把它截成短版本，也不能据此判断支持或不支持。
                </p>
                <p>下一步可以补充准备条件，网站会列出还缺什么资料。</p>
              </div>
            </div>
          ) : (
            <CompatibilityResults
              data={data}
              modelId={
                mode === 'demo' ? submission.model : (selectedModel?.id ?? '')
              }
              modelCode={
                mode === 'published' ? submission.model.trim() : undefined
              }
              firmware={submission.firmware}
              mode={mode}
            />
          )}
        </div>
      </div>
      {mode === 'published' &&
        (submission ? (
          <div className="guide-next">
            <Link
              className="text-link"
              to={`/knowledge/choosing-a-route${nextSearch}`}
            >
              继续：确认准备条件 →
            </Link>
            <p>型号与版本会带入下一页；这不表示已具备执行条件。</p>
          </div>
        ) : (
          <p className="field-help">
            先填写设备信息；还没查到版本？从上方“查看位置”开始。
          </p>
        ))}
      <details className="reading-extra">
        <summary>如何理解查询状态</summary>
        <Legend />
      </details>
      <RelatedKnowledge />
    </section>
  );
}
