# PS5 Jailbreak Hub

中文 PS5 固件兼容性查询、基础知识与主机端入口。当前完成 **M1 可信数据与查询闭环的实现及自动检查**：有来源的型号资料、按方案展示状态与证据、正式/演示目录隔离。不包含漏洞执行、后端、数据库或登录。

> 正式目录目前只收录 CFI-2200B01 的官方型号资料与字段来源，**没有通过核验的兼容性记录**。未收录组合保持 unknown，这不代表暂无公开方案。出厂固件、内部修订及破解能力仍未知。独立社区项目，非 Sony 官方网站。

## 开发计划与聊天交接

已完成状态、M1 交付与后续建议、验收条件及新聊天接续提示词见 [docs/PLAN.md](./docs/PLAN.md)。新聊天先读取 AGENTS.md、README.md 和该计划，核对当前代码后再按用户确认的阶段推进。

## 本地运行

需要 Node.js >= 22.12.0、pnpm 10（packageManager 固定 10.10.0）。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

分别打开终端输出的 Web 地址（默认 http://127.0.0.1:5173）与 Host 地址（http://127.0.0.1:5174）。也可单独启动：

```sh
pnpm dev:web
pnpm dev:host
```

Web 路由：`/` 首页、`/compatibility` 正式查询、`/demo/compatibility` 独立示例查询、`/host` 本地 Host 说明；Host 是独立应用。Web 的说明页不假设 Host 与其部署在同一地址。开发服务器默认仅本机监听；PS5 局域网访问需主动配置绑定地址与防火墙，当前不做自动暴露，也未经 PS5 实机验证。

## 外观主题

Web 顶部可选择浅色或深色主题。首次访问跟随系统，显式选择保存在浏览器 localStorage（ps5-hub-theme）；存储不可用时仍可正常切换。首屏脚本在样式加载前设置主题，减少刷新闪烁。玩家风格使用紫色主色、青柠手柄插画、彩色入口卡片和按压反馈；减少动态效果偏好下关闭动效。独立 PS5 Host 仍保留原生 M0 信息页。

## 结构与架构

```text
apps/
  web/                 React + Vite + TypeScript、Tailwind v4
    src/components/ui/ shadcn/ui 本地 Button（Radix Slot + CVA）
  host/                原生 HTML、CSS、JavaScript，Vite 静态打包
packages/
  core/                Zod schemas、导出类型、精确匹配查询、约束测试
  data/                published.json 正式资料、sample.json 隔离演示、导入即校验
AGENTS.md              后续开发必须遵循的项目规范
```

Web → data → core；Host 独立且无业务包依赖。Turborepo 调度各包。core/data 当前由消费方直接编译 TS 源码，其 build 为静态类型校验，不输出独立分发产物。两个应用构建产物分别为 apps/web/dist、apps/host/dist。Web 使用 BrowserRouter，未来静态托管须将非资源路由回退至 index.html；Host 无路由回退要求。目前不包含部署配置。

## 数据与证据边界

core 导出主机型号、固件、方案、兼容性记录和来源证据的 Zod schema 与 TS 类型。兼容性用 modelId + firmwareId + methodId 关联，evidenceIds 指向有明确适用范围和核验日期的证据。查询只精确匹配型号与固件字符串，绝不比较固件版本大小或外推。

| 状态                            | 含义                       |
| ------------------------------- | -------------------------- |
| verified / 已验证               | 对应组合有可靠证据支持     |
| partial / 部分可用              | 有证据支持，存在明确限制   |
| researching / 研究中            | 有公开研究证据，尚待完善   |
| no_public_method / 暂无公开方案 | 截至核验时间的有来源结论   |
| unknown / 未知                  | 证据不足，不能判断支持与否 |

所有非 unknown 状态必须有精确匹配且人工核验过的非示例证据；示例参与的组合强制 unknown。schema 验证结构、引用和证据范围，人工仍须核对来源真实性、复现条件、限制与时间边界。测试内的 verified 仅是夹具，不会进入站点数据。

默认 `@ps5/data` 只导出正式数据，并经过 `publishedDatasetSchema` 禁止混入示例。型号来源 `modelSources.claims` 绑定字段和值；真实型号的已知字段必须有同值且已核对的来源。型号资料独立于兼容性证据。来源筛选与未采纳理由见 [docs/data-verification.md](./docs/data-verification.md)。

正式查询输入 `03.00` 或其他合法短版本，当前均显示无记录/未知，不会回退到演示数据。通过页面的“体验独立示例查询”进入 `/demo/compatibility`，输入 `03.00` 可查看演示记录与来源结构；`99.99` 同为示例值，不证明实际设备存在该组合。完整系统软件版本目前不做截取或转换。

结果按具体方案独立展示五种状态、限制、适用范围、来源核验日期；无记录回退 unknown。多方案不汇总成主机整体可破解结论。“暂无公开方案”会提示其证据时间边界；未核验与示例来源分别标注。示例经动态导入单独加载，不与正式数据混查。

## 检查与测试

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
# 或一次执行全部检查
pnpm check
```

修复格式用 `pnpm format`。测试覆盖证据约束、精确匹配与禁止外推、示例数据校验、查询表单、未知与非法输入、条件切换和 Host 本地状态检查。完整规则见 [AGENTS.md](./AGENTS.md)。

后续双主题改版已补做 1280px 桌面与 390px 手机浏览器检查：浅色/深色、刷新记忆、正式及演示查询、字段来源展开。PS5 实机尚未验证。具体记录见阶段计划。

## 后续（未实现）

更多型号/兼容性证据核验、完整中文知识库、PS5 实机兼容性验证。升级阶段范围须另行确认；不自动部署、推送或合并。

技术配置参考：[Vite](https://vite.dev/guide/)、[Tailwind Vite 集成](https://tailwindcss.com/docs/installation/using-vite)、[shadcn/ui Vite 配置](https://ui.shadcn.com/docs/installation/vite)。
