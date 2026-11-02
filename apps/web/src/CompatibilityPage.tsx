import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight, Check, Cpu } from 'lucide-react';
import { dataset } from '@ps5/data';
import { firmwareVersionSchema, type Dataset } from '@ps5/core';
import { Button } from '@/components/ui/button';
import { Legend } from '@/components/status';
import { ModelProfile } from '@/components/model-profile';
import { RelatedKnowledge } from './KnowledgePage';
import { CompatibilityResults } from '@/components/compatibility-results';
export function CompatibilityPage({
  data = dataset,
  mode = 'published',
}: {
  data?: Dataset;
  mode?: 'published' | 'demo';
}) {
  const [searchParams] = useSearchParams();
  const initialModel = searchParams.get('model');
  const [model, setModel] = useState(
    data.models.some((x) => x.id === initialModel)
      ? initialModel!
      : (data.models[0]?.id ?? ''),
  );
  const [firmware, setFirmware] = useState('');
  const [submission, setSubmission] = useState<{
    model: string;
    firmware: string;
  } | null>(null);
  const [error, setError] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!firmwareVersionSchema.safeParse(firmware.trim()).success) {
      setError(
        '请输入有效格式，例如 03.00；完整系统版本暂不转换，请勿自行截取。',
      );
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
          <strong>
            {mode === 'demo'
              ? '演示数据模式 · 与正式目录隔离'
              : '正式资料目录 · 兼容性证据持续核验'}
          </strong>
          <p>
            {mode === 'demo'
              ? '可输入 03.00 查看示例记录。演示值与示例来源不能证明真实兼容性。'
              : `已收录有来源的型号资料与 ${data.compatibility.length} 条兼容性记录。各方案独立展示状态；未收录组合保持未知。`}
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
            {data.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name.startsWith(m.code) ? m.name : `${m.code} · ${m.name}`}
              </option>
            ))}
          </select>
          <p className="field-help">
            {data.models.find((x) => x.id === model)?.description}
          </p>
          <ModelProfile data={data} modelId={model} />
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
            仅支持短版本精确匹配，不按版本范围推断；暂不转换完整系统软件版本。
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
              <p>选择型号并输入固件版本，查看匹配记录与来源证据。</p>
              <span className="small-tag">EXACT MATCH ONLY</span>
            </div>
          ) : (
            <CompatibilityResults
              data={data}
              modelId={submission.model}
              firmware={submission.firmware}
              mode={mode}
            />
          )}
        </div>
      </div>
      <div className="section-heading">
        <h2>如何理解查询状态</h2>
      </div>
      <Legend />
      <RelatedKnowledge />
    </section>
  );
}
