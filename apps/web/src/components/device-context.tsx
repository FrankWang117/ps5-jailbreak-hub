import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  deviceProgressSchema,
  emptyDeviceProgress,
  guideSearch,
  readDeviceProgress,
  type DeviceProgress,
} from '@ps5/core';

export const deviceStorageKey = 'ps5-device-progress-v1';
export const preparationStorageKey = 'ps5-preparation-progress-v1';
const DeviceContext = createContext<{
  progress: DeviceProgress;
  save: (next: DeviceProgress) => void;
  clearRecords: () => boolean;
  storageAvailable: boolean;
} | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(() => {
    try {
      return readDeviceProgress(localStorage.getItem(deviceStorageKey));
    } catch {
      return emptyDeviceProgress();
    }
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  function save(next: DeviceProgress) {
    const valid = deviceProgressSchema.parse(next);
    setProgress(valid);
    try {
      if (
        (Object.keys(valid.answers) as Array<keyof typeof valid.answers>).some(
          (key) => valid.answers[key] !== progress.answers[key],
        )
      )
        localStorage.removeItem(preparationStorageKey);
      localStorage.setItem(deviceStorageKey, JSON.stringify(valid));
    } catch {
      setStorageAvailable(false);
    }
  }
  function clearRecords() {
    setProgress(emptyDeviceProgress());
    try {
      localStorage.removeItem(deviceStorageKey);
      localStorage.removeItem(preparationStorageKey);
      setStorageAvailable(true);
      return true;
    } catch {
      setStorageAvailable(false);
      return false;
    }
  }
  return (
    <DeviceContext.Provider
      value={{ progress, save, clearRecords, storageAvailable }}
    >
      {children}
    </DeviceContext.Provider>
  );
}
export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) throw new Error('DeviceProvider is required');
  return context;
}
export function DeviceCard() {
  const { progress } = useDevice();
  const { pathname } = useLocation();
  if (
    pathname === '/start' ||
    pathname.startsWith('/demo') ||
    pathname === '/host' ||
    (!progress.answers.modelCode && !progress.answers.systemVersion)
  )
    return null;
  const a = progress.answers;
  return (
    <aside className="device-card" aria-label="我的设备记录">
      <div>
        <strong>我的设备</strong>
        <p>
          {a.modelCode || '型号未确认'} · {a.systemVersion || '版本未确认'}
        </p>
        <small>
          {progress.confirmed ? '你已核对信息' : '信息待核对'} ·
          适用教程尚未确认
        </small>
      </div>
      <div className="step-actions">
        <Link to="/start">继续或修改记录 →</Link>
        {pathname.startsWith('/knowledge') && (
          <Link to={`/knowledge/choosing-a-route${guideSearch(a)}`}>
            查看准备条件 →
          </Link>
        )}
      </div>
    </aside>
  );
}
