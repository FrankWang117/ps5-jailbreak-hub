# PS5 Jailbreak Hub

中文 PS5 固件兼容性查询、基础知识与主机端入口。当前只完成 **M0 第一阶段**：项目骨架、数据约束、首页、查询页及原生静态 Host。不包含真实破解方案、漏洞执行、后端、数据库或登录。

> **所有自带数据均为示例，不是兼容性数据库。** CFI-2200B01 为重点展示条目，地区和硬件信息待核验；所有兼容性为“未知”。不可据此决定购买、升级或降级。独立社区项目，非 Sony 官方网站。

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

Web 路由：`/` 首页、`/compatibility` 查询、`/host` 本地 Host 说明；Host 是独立应用。Web 的说明页不假设 Host 与其部署在同一地址。开发服务器默认仅本机监听；PS5 局域网访问需主动配置绑定地址与防火墙，M0 不做自动暴露，也未经 PS5 实机验证。

## 结构与架构

```text
apps/
  web/                 React + Vite + TypeScript、Tailwind v4
    src/components/ui/ shadcn/ui 本地 Button（Radix Slot + CVA）
  host/                原生 HTML、CSS、JavaScript，Vite 静态打包
packages/
  core/                Zod schemas、导出类型、精确匹配查询、约束测试
  data/                sample.json、导入即校验、数据测试
AGENTS.md              后续开发必须遵循的项目规范
```

Web → data → core；Host 独立且无业务包依赖。Turborepo 调度各包。core/data 在 M0 由消费方直接编译 TS 源码，其 build 为静态类型校验，不输出独立分发产物。两个应用构建产物分别为 apps/web/dist、apps/host/dist。Web 使用 BrowserRouter，未来静态托管须将非资源路由回退至 index.html；Host 无路由回退要求。目前不包含部署配置。

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

查询页选择 CFI-2200B01 并输入 `03.00` 可看到示例记录与可展开的证据结构；`04.00` 等未收录版本显示未知。`03.00`、`99.99` 均为界面演示值，不声称真实设备存在该组合。`example.com` 证据链接明确为占位，不是真实研究来源。

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

## M0 之后（未实现）

真实来源采集和人工审核、完整中文知识库、更多型号与方案数据、PS5 实机兼容性验证。升级阶段范围须另行确认；不自动部署、推送或合并。

技术配置参考：[Vite](https://vite.dev/guide/)、[Tailwind Vite 集成](https://tailwindcss.com/docs/installation/using-vite)、[shadcn/ui Vite 配置](https://ui.shadcn.com/docs/installation/vite)。
