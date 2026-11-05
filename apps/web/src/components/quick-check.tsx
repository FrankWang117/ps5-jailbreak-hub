import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { dataset } from '@ps5/data';
import { factoryDataset } from '@ps5/data/factory';
import {
  captureSystemVersion,
  captureFactoryPrefix,
  factoryPrefixSchema,
  modelCodeInputSchema,
  queryFactoryReference,
  systemVersionInputSchema,
} from '@ps5/core';
import { Button } from './ui/button';
import { CompatibilityResults } from './compatibility-results';

type Mode = 'serial' | 'model' | 'version';
type Result =
  | {
      mode: 'serial' | 'model';
      value: string;
      estimate: ReturnType<typeof queryFactoryReference>;
    }
  | { mode: 'version'; value: string; version: string };
const modes = [
  { id: 'serial', label: '按序列号' },
  { id: 'model', label: '按型号' },
  { id: 'version', label: '已知系统版本' },
] as const;
export function QuickCheck() {
  const [mode, setMode] = useState<Mode>('serial');
  const [value, setValue] = useState('');
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  const [serialNotice, setSerialNotice] = useState('');
  const [errorField, setErrorField] = useState<'value' | 'version' | null>(
    null,
  );
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const versionRef = useRef<HTMLInputElement>(null);
  const radioRefs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (result) {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [result]);
  function reset() {
    setResult(null);
    setError('');
    setErrorField(null);
    setSerialNotice('');
  }
  function changeMode(next: Mode) {
    setMode(next);
    setValue('');
    setVersion('');
    reset();
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized =
      mode === 'serial' ? `S01-${value}` : value.trim().toUpperCase();
    const parsed = (
      mode === 'serial' ? factoryPrefixSchema : modelCodeInputSchema
    ).safeParse(normalized);
    if (!parsed.success) {
      setResult(null);
      setErrorField('value');
      valueRef.current?.focus();
      setError(
        mode === 'serial'
          ? '请填写 S01- 后的 4 位，例如 F561。'
          : '请照抄完整 CFI- 型号，包含末尾字母和数字。',
      );
      return;
    }
    if (mode === 'version') {
      const v = systemVersionInputSchema.safeParse(version);
      if (!v.success) {
        setResult(null);
        setErrorField('version');
        versionRef.current?.focus();
        setError('请照抄设备上的数字版本原文，不自行截取或换算。');
        return;
      }
      setResult({ mode, value: parsed.data, version: v.data });
    } else
      setResult({
        mode,
        value: parsed.data,
        estimate: queryFactoryReference(factoryDataset, {
          kind: mode,
          value: parsed.data,
        }),
      });
    setError('');
    setErrorField(null);
  }
  const knownVersion =
    result?.mode === 'version' ? captureSystemVersion(result.version) : null;
  function changeSerial(raw: string) {
    const captured = captureFactoryPrefix(raw);
    reset();
    if (captured.kind === 'invalid') {
      setErrorField('value');
      setError('未识别这段内容。请填后 4 位，或粘贴以 S01- 开头的序列号。');
      valueRef.current?.focus();
      return;
    }
    setValue(captured.suffix);
    if (captured.truncated)
      setSerialNotice(`已提取前缀 S01-${captured.suffix}，其余内容未保留。`);
  }
  return (
    <section className="quick-check" aria-labelledby="quick-title">
      <p className="eyebrow">
        PS5 出厂版本参考 <span className="beta-badge">Beta</span>
      </p>
      <h1 id="quick-title">先查你的 PS5，再看适用教程。</h1>
      <p className="quick-intro">
        还没开机？查出厂版本参考。已经开机？直接填实际版本。
      </p>
      <p className="quick-coverage">
        已收录 {factoryDataset.records.length} 个批次 ·{' '}
        {Array.from(new Set(factoryDataset.records.map((r) => r.family))).join(
          ' / ',
        )}{' '}
        部分记录
      </p>
      {dataset.compatibility.length === 0 && (
        <p className="field-help">
          当前仅收录部分出厂批次；破解兼容性资料待补充，暂不能给出可破解结论。
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <fieldset className="quick-modes">
          <legend className="sr-only">选择查询方式</legend>
          {modes.map((item, index) => (
            <label
              key={item.id}
              className={mode === item.id ? 'is-selected' : ''}
            >
              <input
                ref={(node) => {
                  radioRefs.current[index] = node;
                }}
                type="radio"
                name="quick-mode"
                value={item.id}
                checked={mode === item.id}
                onChange={() => changeMode(item.id)}
                onKeyDown={(event) => {
                  if (
                    [
                      'ArrowLeft',
                      'ArrowUp',
                      'ArrowRight',
                      'ArrowDown',
                    ].includes(event.key)
                  ) {
                    event.preventDefault();
                    const offset =
                      event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                        ? -1
                        : 1;
                    const next = (index + offset + modes.length) % modes.length;
                    changeMode(modes[next].id);
                    radioRefs.current[next]?.focus();
                  }
                }}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
        <div className="step-input">
          <label htmlFor="quick-value">
            {mode === 'serial' ? '序列号前缀' : '完整主机型号'}
          </label>
          <div className={mode === 'serial' ? 'serial-input' : undefined}>
            {mode === 'serial' && <span aria-hidden="true">S01-</span>}
            <input
              id="quick-value"
              ref={valueRef}
              autoComplete="off"
              spellCheck={false}
              aria-label={mode === 'serial' ? 'S01- 后的 4 位' : undefined}
              autoCapitalize={mode === 'serial' ? 'characters' : 'off'}
              maxLength={mode === 'serial' ? 4 : 24}
              enterKeyHint={mode === 'version' ? 'next' : 'search'}
              value={value}
              placeholder={mode === 'serial' ? 'F561' : '例如 CFI-2116A'}
              onChange={(e) => {
                if (mode === 'serial') {
                  changeSerial(e.target.value);
                  return;
                }
                setValue(e.target.value);
                reset();
              }}
              onPaste={
                mode === 'serial'
                  ? (event) => {
                      event.preventDefault();
                      const input = event.currentTarget;
                      const pasted = event.clipboardData.getData('text');
                      const captured = captureFactoryPrefix(pasted);
                      const isFullPrefix =
                        captured.kind === 'accepted' && captured.hasPrefix;
                      changeSerial(
                        isFullPrefix
                          ? pasted
                          : value.slice(
                              0,
                              input.selectionStart ?? value.length,
                            ) +
                              pasted +
                              value.slice(input.selectionEnd ?? value.length),
                      );
                    }
                  : undefined
              }
              aria-invalid={errorField === 'value'}
              aria-describedby={
                errorField === 'value' ? 'quick-help quick-error' : 'quick-help'
              }
            />
            {mode === 'serial' && <Button type="submit">确认查询</Button>}
          </div>
        </div>
        {mode === 'version' && (
          <div className="step-input">
            <label htmlFor="quick-version">实际系统版本原文</label>
            <input
              id="quick-version"
              ref={versionRef}
              autoComplete="off"
              maxLength={80}
              enterKeyHint="search"
              value={version}
              placeholder="照抄系统软件版本"
              aria-invalid={errorField === 'version'}
              aria-describedby={
                errorField === 'version'
                  ? 'quick-help quick-error'
                  : 'quick-help'
              }
              onChange={(e) => {
                setVersion(e.target.value);
                reset();
              }}
            />
          </div>
        )}
        {mode !== 'serial' && (
          <div className="quick-submit-row">
            <Button type="submit">确认查询</Button>
          </div>
        )}
        <p className="field-help" id="quick-help">
          {mode === 'serial'
            ? '只需填后 4 位，也可粘贴完整序列号；不会保存或上传。'
            : mode === 'model'
              ? '型号只能查看系列的已收录批次，不能单凭型号确定唯一出厂版本。'
              : '按实际型号与版本精确查询；较长版本保留原文，不自动转换。'}
        </p>
        {serialNotice && (
          <p className="field-help" role="status">
            {serialNotice}
          </p>
        )}
        <details className="quick-position">
          <summary>信息在哪里？</summary>
          {mode === 'serial' ? (
            <p>
              查看包装盒底部的序列号标签，填 S01- 后的 4 位，例如 F561。
              也可粘贴 S01- 开头的完整序列号，本页只提取查询前缀。
              标签不是这种格式时，可切换“按型号”；不要填写 CFI- 型号。
            </p>
          ) : (
            <p>型号与实际系统版本的查看位置，见下方设备确认指南。</p>
          )}
          <Link className="text-link" to="/start">
            查看型号和系统版本的位置 →
          </Link>
        </details>
        {error && (
          <p id="quick-error" role="alert">
            {error}
          </p>
        )}
      </form>
      {result && (
        <section
          className="quick-result"
          ref={resultRef}
          tabIndex={-1}
          aria-label="快速查询结果"
        >
          {result.mode === 'version' ? (
            <>
              <p className="quick-kicker">实际版本查询 · {result.value}</p>
              {knownVersion?.kind === 'unmapped' ? (
                <>
                  <h2>版本原文已保留</h2>
                  <p className="factory-version">{result.version}</p>
                  <p>
                    暂缺可靠对应关系，无法据此判断本机可用性。不会自动截成短版本。
                  </p>
                </>
              ) : (
                <CompatibilityResults
                  data={dataset}
                  modelId={
                    dataset.models.find((m) => m.code === result.value)?.id ??
                    ''
                  }
                  modelCode={result.value}
                  firmware={result.version}
                  mode="published"
                />
              )}
              <Link
                className="text-link"
                to={`/compatibility?${new URLSearchParams({ model: result.value, version: result.version })}`}
              >
                查看完整查询与来源 →
              </Link>
            </>
          ) : (
            <>
              <p className="quick-kicker">
                出厂参考 ·{' '}
                {result.mode === 'serial' ? '前缀匹配' : '系列批次概览'}
              </p>
              <h2>
                {result.estimate.matched
                  ? '找到出厂版本线索'
                  : '尚无匹配的出厂记录'}
              </h2>
              {result.estimate.matched ? (
                <>
                  {result.mode === 'serial' && (
                    <>
                      <p className="factory-version">
                        {result.estimate.records[0].versions.join(' / ')}
                      </p>
                      <p>
                        {result.estimate.records[0].family} 系列 · 来源标注批次{' '}
                        {result.estimate.records[0].period} · 社区估计
                      </p>
                    </>
                  )}
                  <p>
                    {result.mode === 'model'
                      ? '以下仅为该系列已收录的部分批次，不是此型号的最低、最高或唯一出厂版本。'
                      : '以上是该前缀对应的历史批次候选版本，不是对这台机器的实测。'}
                  </p>
                  {result.mode === 'model' && (
                    <details className="factory-batches">
                      <summary>
                        查看已收录批次（{result.estimate.records.length} 个）
                      </summary>
                      <div className="factory-table-wrap">
                        <table className="factory-table">
                          <caption>已收录批次参考</caption>
                          <thead>
                            <tr>
                              <th>系列</th>
                              <th>来源批次</th>
                              <th>候选版本</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.estimate.records.map((r) => (
                              <tr key={r.id}>
                                <td>{r.family}</td>
                                <td>{r.period}</td>
                                <td>{r.versions.join(' / ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                  <div className="factory-conclusion">
                    <strong>能否破解：仍需确认</strong>
                    <p>
                      出厂参考不能代替当前系统版本；已更新、二手或翻新设备不能据此判断。本页不推荐具体执行方案。
                    </p>
                  </div>
                </>
              ) : (
                <p>
                  当前目录未覆盖这个
                  {result.mode === 'serial' ? '前缀' : '型号或系列'}
                  ，不是“不能破解”。不会使用相邻批次或其他型号补猜版本。
                </p>
              )}
              <div className="step-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode('version');
                    setValue(result.mode === 'model' ? result.value : '');
                    setVersion('');
                    reset();
                    valueRef.current?.focus();
                  }}
                >
                  已开机？填写实际版本
                </Button>
                <Link className="text-link" to="/start">
                  不知道信息在哪？查看位置 →
                </Link>
              </div>
              <details className="factory-sources">
                <summary>来源、覆盖范围与限制</summary>
                <p>
                  当前收录 {factoryDataset.records.length} 个批次，覆盖{' '}
                  {Array.from(
                    new Set(factoryDataset.records.map((r) => r.family)),
                  ).join(' / ')}{' '}
                  部分记录。未收录系列不继承其他系列的版本。
                </p>
                {factoryDataset.sources.map((s) => (
                  <div key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                    <p>
                      {s.publisher} · 表项核查 {s.checkedAt}
                    </p>
                    <p>{s.revision}</p>
                    <p>{s.limitations}</p>
                  </div>
                ))}
              </details>
            </>
          )}
        </section>
      )}
      <p className="quick-footnote">
        出厂参考与实际版本查询独立。找到历史批次不代表已验证本机可以破解。
      </p>
    </section>
  );
}
