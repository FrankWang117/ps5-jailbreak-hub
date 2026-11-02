import { modelFieldLabels, type Dataset } from '@ps5/core';
const editionLabels = {
  digital: '数字版（不含内置光驱）',
  disc: '光驱版',
  unknown: '未知',
};
export function ModelProfile({
  data,
  modelId,
}: {
  data: Dataset;
  modelId: string;
}) {
  const model = data.models.find((x) => x.id === modelId);
  if (!model) return null;
  const sources = data.modelSources.filter((x) => x.modelId === model.id);
  return (
    <details className="model-profile">
      <summary>
        型号资料与字段来源
        {model.isExample
          ? ' · 示例'
          : sources.some((s) => s.verified && s.kind === 'primary')
            ? ' · 已有一手来源'
            : ' · 待核验'}
      </summary>
      <p className="field-help">
        资料来源核对不等于主机实测；型号信息不能证明破解兼容性。
      </p>
      <dl>
        {(
          Object.keys(modelFieldLabels) as (keyof typeof modelFieldLabels)[]
        ).map((field) => {
          const value = model[field];
          const refs = sources.filter(
            (s) =>
              s.verified &&
              s.kind !== 'example' &&
              s.claims.some((c) => c.field === field && c.value === value),
          );
          return (
            <div className="fact-row" key={field}>
              <dt>{modelFieldLabels[field]}</dt>
              <dd>
                {field === 'edition'
                  ? editionLabels[model.edition]
                  : (value ?? '未知')}
                {refs.map((s) => (
                  <a
                    className="fact-source"
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${modelFieldLabels[field]}来源：${s.publisher}`}
                  >
                    来源 ↗
                  </a>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
      {sources.map((s) => (
        <div className="model-source" key={s.id}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.title} ↗
          </a>
          <p>
            {s.kind === 'example'
              ? '示例来源'
              : s.verified
                ? '已核对来源内容'
                : '待核验来源'}{' '}
            · {s.publisher} · 核对日期 {s.checkedAt.slice(0, 10)}
          </p>
          <p>{s.summary}</p>
          <p>证据边界：{s.limitations}</p>
        </div>
      ))}
      {model.isExample && (
        <p className="field-help">演示资料，没有可核验的产品字段来源。</p>
      )}
    </details>
  );
}
