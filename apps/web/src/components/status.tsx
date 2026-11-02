import { statusLabels, type CompatibilityStatus } from '@ps5/core';
export function Status({ status }: { status: CompatibilityStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}
const descriptions: Record<CompatibilityStatus, string> = {
  verified: '有可靠证据支持的明确组合',
  partial: '有证据支持，但存在功能限制',
  researching: '有公开研究证据，尚待完善',
  no_public_method: '截至核验时间未有公开方案',
  unknown: '缺少足够证据，无法判断',
};
export function Legend() {
  return (
    <div className="legend">
      {(Object.keys(statusLabels) as CompatibilityStatus[]).map((s) => (
        <div key={s}>
          <Status status={s} />
          <p>{descriptions[s]}</p>
        </div>
      ))}
    </div>
  );
}
