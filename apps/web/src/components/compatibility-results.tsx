import {
  queryCompatibility,
  statusLabels,
  type Dataset,
  type Evidence,
} from '@ps5/core';
import { CircleHelp, ExternalLink } from 'lucide-react';
import { Status } from './status';
function EvidenceDetails({
  data,
  evidence,
}: {
  data: Dataset;
  evidence: Evidence;
}) {
  const example = evidence.kind === 'example';
  return (
    <details>
      <summary>
        {example
          ? '示例证据（非真实来源）'
          : evidence.verified
            ? '已核对的兼容性证据'
            : '待核验的兼容性来源'}{' '}
        · {evidence.title}
      </summary>
      <p>{evidence.summary}</p>
      <dl>
        <dt>发布者</dt>
        <dd>{evidence.publisher}</dd>
        <dt>
          {example
            ? '示例日期'
            : evidence.verified
              ? '核验日期'
              : '记录日期（未核验）'}
        </dt>
        <dd>{evidence.checkedAt.slice(0, 10)}</dd>
        <dt>适用范围</dt>
        <dd>
          {data.models.find((x) => x.id === evidence.scope.modelId)?.code} /{' '}
          {
            data.firmwares.find((x) => x.id === evidence.scope.firmwareId)
              ?.version
          }{' '}
          / {data.methods.find((x) => x.id === evidence.scope.methodId)?.name}
        </dd>
        <dt>证据支持状态</dt>
        <dd>{statusLabels[evidence.scope.status]}</dd>
      </dl>
      <a href={evidence.url} target="_blank" rel="noreferrer">
        {example ? '打开占位链接' : '查看来源原文'}
        <ExternalLink size={13} />
      </a>
    </details>
  );
}
export function CompatibilityResults({
  data,
  modelId,
  firmware,
  mode,
}: {
  data: Dataset;
  modelId: string;
  firmware: string;
  mode: 'published' | 'demo';
}) {
  const result = queryCompatibility(data, modelId, firmware);
  return (
    <>
      <div className="result-header">
        <div className="eyebrow">
          QUERY RESULT · {mode === 'demo' ? '演示目录' : '正式目录'}
        </div>
        <span className="small-tag">{result.records.length} 条方案记录</span>
      </div>
      <h2>{data.models.find((x) => x.id === modelId)?.code}</h2>
      <p className="firmware-value">
        系统固件 <strong>{firmware}</strong>
      </p>
      {result.records.length === 0 ? (
        <div className="result-message">
          <CircleHelp size={21} />
          <div>
            <h3>兼容性未知</h3>
            <Status status="unknown" />
            <p>{result.reason}</p>
            <p>无记录不等于“暂无公开方案”，也不代表该设备能够安装此版本。</p>
          </div>
        </div>
      ) : (
        <>
          <p className="field-help">
            各方案独立判断，仅展示精确匹配记录；不能合并为整台主机可破解的结论。
          </p>
          {result.records.map((record) => {
            const model = data.models.find((x) => x.id === record.modelId)!;
            const fw = data.firmwares.find((x) => x.id === record.firmwareId)!;
            const method = data.methods.find((x) => x.id === record.methodId)!;
            const example =
              record.isExample ||
              model.isExample ||
              fw.isExample ||
              method.isExample;
            return (
              <article
                className="evidence-card"
                key={record.id}
                aria-label={`${method.name}兼容性记录`}
              >
                <div className="result-header">
                  <h3>{method.name}</h3>
                  <Status status={record.status} />
                </div>
                <p className="record-kind">
                  {example
                    ? '示例记录 · 不构成真实兼容性结论'
                    : '正式记录 · 请核对证据范围与日期'}
                </p>
                <p>{record.explanation}</p>
                {record.limitations.length > 0 && (
                  <div className="record-limits">
                    <h4>限制与前提</h4>
                    <ul>
                      {record.limitations.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {record.evidenceIds.length === 0 ? (
                  <p className="field-help">没有关联证据，保持未知。</p>
                ) : (
                  record.evidenceIds.map((id) => (
                    <EvidenceDetails
                      key={id}
                      data={data}
                      evidence={data.evidence.find((x) => x.id === id)!}
                    />
                  ))
                )}
                {record.status === 'no_public_method' && (
                  <p className="field-help">
                    此结论仅限上述证据的核验时间与范围，不是永久结论。
                  </p>
                )}
              </article>
            );
          })}
        </>
      )}
    </>
  );
}
