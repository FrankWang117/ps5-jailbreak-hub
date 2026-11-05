import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { factoryDataset } from '@ps5/data/factory';
import { siteContent } from '@ps5/data';
import { Button } from './components/ui/button';
import { useDevice } from './components/device-context';

const feedbackTemplate = `反馈类型：页面问题 / 资料纠错
型号（可选）：
实际系统版本（可选）：
所在页面（不要包含个人信息）：
遇到的问题 / 希望更正的内容：
复现步骤 / 资料来源链接：
请勿提供完整序列号、账号、密码或带有个人信息的照片。`;

export function SiteInfoPage() {
  const feedback = useLocation().pathname === '/feedback';
  const { clearRecords } = useDevice();
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: 'start' });
  }, []);
  return (
    <section className="site-info">
      <Link className="back-link" to="/">
        返回首页
      </Link>
      <p className="eyebrow">{siteContent.release}</p>
      <h1 ref={heading} tabIndex={-1}>
        {feedback ? '问题反馈与资料纠错' : '关于与数据说明'}
      </h1>
      {feedback ? (
        <>
          <p>查询没有结果、页面不好用或资料有误，都可以反馈。</p>
          <div className="notice">
            <div>
              <strong>反馈会公开显示</strong>
              <p>
                GitHub
                反馈需要登录。请勿提交完整序列号、账号或密码，照片请遮住个人信息。
              </p>
            </div>
          </div>
          <Button asChild>
            <a href={siteContent.feedbackUrl} target="_blank" rel="noreferrer">
              去 GitHub 提交反馈 ↗
            </a>
          </Button>
          <p className="field-help">
            没有 GitHub
            账号？可复制下方模板，通过你找到本站的渠道联系维护者。本页不会自动发送。
          </p>
          <label htmlFor="feedback-template">反馈模板（可自行选择复制）</label>
          <textarea
            id="feedback-template"
            rows={8}
            readOnly
            value={feedbackTemplate}
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            variant="outline"
            onClick={async () => {
              try {
                if (!navigator.clipboard?.writeText)
                  throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(feedbackTemplate);
                setMessage('模板已复制，请补充问题后自行发送。');
              } catch {
                setMessage('无法自动复制，请选择上方模板文字手动复制。');
              }
            }}
          >
            复制反馈模板
          </Button>
          <p className="field-help">
            不会自动读取设备记录、地址栏、浏览器日志或剪贴板内容。
          </p>
        </>
      ) : (
        <>
          <p>
            本站是独立中文项目，先帮助你查出厂版本线索，再确认实际版本并阅读入门资料。
          </p>
          <h2>这版能做什么？</h2>
          <p>
            Beta 当前收录 {factoryDataset.records.length} 个社区批次，覆盖{' '}
            {Array.from(
              new Set(factoryDataset.records.map((r) => r.family)),
            ).join(' / ')}{' '}
            的部分记录。候选版本只是参考；CFI-2200B01 仍未收录出厂批次。
          </p>
          <p>
            本站尚无已核验的正式破解兼容性记录。安装和游戏篇是待实机验证的草稿，不能保证你的主机或游戏可用。
          </p>
          <p>
            批次资料更新：{factoryDataset.updatedAt}
            。各条来源、修订与限制可在查询结果中展开查看。
          </p>
          <h2>哪些内容会被保存？</h2>
          <ul>
            <li>
              快速查询：输入只在当前页面处理；完整序列号粘贴后只保留必要前缀，不写入地址或浏览器存储。
            </li>
            <li>
              分步指南：型号、版本、你的回答和准备进度保存在当前浏览器，刷新可恢复；不会同步到其他设备。
            </li>
            <li>主题选择：浅色/深色偏好保存在当前浏览器。</li>
            <li>
              阅读链接可能携带型号、版本或回答，分享前请检查地址。本站未加入统计或追踪脚本；外部链接和
              GitHub 由相应服务处理访问。
            </li>
          </ul>
          <Button
            variant="outline"
            onClick={() =>
              setMessage(
                clearRecords()
                  ? '设备与准备记录已清空，主题偏好保留。'
                  : '当前页面记录已清空，但浏览器存储不可用，无法确认持久化记录已删除。',
              )
            }
          >
            清空设备与准备记录
          </Button>
          <h2>发现资料问题？</h2>
          <Link className="text-link" to="/feedback">
            问题反馈 / 资料纠错 →
          </Link>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
