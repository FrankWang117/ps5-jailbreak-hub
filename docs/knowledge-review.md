# 知识库与首次开机指南内容核验及维护

2026-11-05 电脑与网络准备：独立 preparation.json 增加四步、平台查看路径和来源范围，现有知识库仍为九篇；文章入口和阅读导航接入 `/prepare`。Apple 部分页面采用已读官方正文节选，限流与边界见 [preparation-guide-review.md](./preparation-guide-review.md)。未据此改变兼容性结论或既有来源核验日期。

2026-11-05 分步样板：first-boot 增加结构化四步动作、完成现象和失败处理，采用原有指南资料；菜单位置于 11 月 4 日再次核对 PlayStation 日本说明。新增字段辨认和路径示意不冒充实机截图，不增加兼容性结论。候选路线复核与交付检查见 [device-guide-review.md](./device-guide-review.md)。其他来源日期不因编辑自动更新。

2026-11-03 追加 D2b1：第九篇 `/knowledge/offline-game-workflow` 与第六步阅读入口。固定版本、冲突、未采纳的跨固件组合及验收见 [offline-game-review.md](./offline-game-review.md)。本站验收清单不作为项目报告或兼容性证据。

核验与文章更新时间：2026-11-02。原 M2 为四篇入门文章，后续 A 新增首次开机指南，本轮 B 增加路线研究说明，C1/D1 增加浏览器准备篇，D2a 增加首次安装草稿，共八篇；不新增型号、固件或兼容性记录。

## 来源核验

本轮已打开并阅读以下官方网页的相关正文，采用转述，不把网页存在或搜索摘要当作兼容性证据：

| 来源                                                                                                                                      | 采用内容                                                                | 不支持的结论                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [PlayStation：查找型号和序列号](https://www.playstation.com/zh-hans-hk/support/hardware/ps5-find-serial-model-numbers/)                   | 型号标记位于主机竖放时的底部；提醒按实物和设备说明查找                  | 出厂固件、内部修订、破解能力；不从型号后缀外推字段                |
| [PlayStation：检查系统软件版本](https://www.playstation.com/zh-hans-cn/support/hardware/playstation-system-software-application-version/) | 设定 → 系统 → 系统软件 → 主机信息                                       | 完整版本与本站短版本的映射、更新建议或兼容性                      |
| [PlayStation：系统软件说明](https://www.playstation.com/zh-hans-cn/support/hardware/ps5/system-software/)                                 | 重装会清除数据；非官方数据/方法可能导致异常并影响保用服务；安装中断风险 | 降级能力、任何第三方方案的支持范围；不转载更新/执行步骤或下载文件 |

官方页面会变化，核验日期仅代表阅读时间，不代表网页发布日期、设备实测日期或永久有效期。具体菜单随设备语言和版本可能变化。

## 本站规则与编辑说明

术语、五种兼容性状态、精确匹配、禁止跨版本/型号外推、示例隔离等，来自本仓库 AGENTS.md、core 查询与 schema、README 的现有产品规则。Payload 只给通用概念，不涉及项目能力或执行流程。文章文末标为“本站规则”，不冒用 Sony 官方来源，也不将这些说明导入 evidence。

文章源文件为 packages/data/src/knowledge.json；packages/data/src/knowledge.ts 在导入时经 core 的 knowledgeBaseSchema 校验。此校验只保证结构和引用一致性，不能替代内容审核。

维护时逐项阅读来源正文，确认采用内容及适用范围，更新 checkedAt；修改文章后更新 updatedAt，并保证它不早于来源核验日期。新增或改名文章时同时维护 relatedSlugs，检查旧路径与站内入口。运行 pnpm check，并对目录、文章、来源锚点与相关阅读执行桌面/手机和双主题检查。

当前八篇文章包含原四篇入门内容、首次开机指南、路线研究说明、浏览器准备篇与首次安装草稿，不是完整破解教程库。无后台编辑系统、全文搜索或设备实测报告；后续扩充需另行确定范围。

## A：首次开机与版本确认指南（2026-11-02）

新增 `/knowledge/first-boot`。已逐项打开并阅读下列官方网页正文，采用范围如下：

| 来源                                                                                                                      | 采用内容                                                                    | 适用边界                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [日本支持：PS5 の使い方](https://www.playstation.com/ja-jp/support/hardware/ps5-get-started-set-up/)                      | HDMI、电源连接与初始设置项目                                                | 通用说明不能证明 CFI-2200B01 能跳过联网、账号或更新；不照搬其他型号的安装配件规格 |
| [日本支持：型号查找](https://www.playstation.com/ja-jp/support/hardware/ps5-find-serial-model-numbers/)                   | 底部型号位置与 CFI 标记                                                     | 不推断出厂固件或破解能力                                                          |
| [日本支持：DualSense 连接](https://www.playstation.com/ja-jp/support/hardware/dualsense-controller-support/)              | USB 连接、PS 键配对与数据线要求                                             | 不采用手柄更新流程                                                                |
| [日本支持：版本查看](https://www.playstation.com/ja-jp/support/hardware/playstation-system-software-application-version/) | 設定 → システム → システムソフトウェア → 本体情報；该页还显示网络标识等信息 | 不建立完整版本与短版本的映射；不要求分享整页信息                                  |
| [日本支持：自动更新](https://www.playstation.com/ja-jp/support/hardware/automatic-updates-playstation/)                   | 系统自动下载、自动安装的菜单路径与日语选项名称                              | 官方介绍启用设置；关闭选项是本站暂缓更新的流程建议，不保证阻止全部更新            |
| [中国大陆支持：系统软件](https://www.playstation.com/zh-hans-cn/support/hardware/ps5/system-software/)                    | 官方建议保持最新；安装期间中断有损坏风险                                    | 不采用更新、重装或文件下载流程                                                    |

先记录现状、先不接网、暂缓更新、遇到无法跳过的初始化画面时停止、记录模板和隐私提示属于本站编辑流程，已单独标为本站说明。明确区分尚未开始更新和已经安装中：不得把“停下”理解为拔电或强行关机。

两幅图用可访问的 HTML 有序列表和主题 CSS 绘制：连接关系、日语版本菜单路径。图注标明本站示意而非实机截图，不虚构接口位置、初始化按钮或版本值。图中内容同样保存在 data JSON，经 core 的可选 diagram schema 校验，Web 只渲染。

CFI-2200B01 为首位用户自述型号，尚未开机；实际版本、初始化过程、网络/账号限制仍未知。12.40 只作假设，不采纳为正式数据。本站目前不自动截取完整版本，也不因指南接入改变正式目录零兼容性记录的事实。用户实际操作与截图反馈属于待办 E，本轮不声称实测成功。

## B：公开资料路线说明（2026-11-02）

新增 `/knowledge/firmware-1240-routes`，原始来源、版本、日期、采纳范围和缺口统一记录于 [route-research.md](./route-research.md)。本轮不要求用户实际操作，A3/E 仍待实机验证，B 的资料核查可独立验收。

知识库来源种类扩展为官方资料、项目一手资料、社区报告、本站规则；项目和社区来源必须有原文 URL，revision 表示发布号或阅读快照。GitHub 项目不能标成 Sony 官方资料；issue 只能支持报告者自述与线索，不直接建立兼容性结论。文章与首次开机指南互链，查询仍为空目录下的未知结果。未下载、集成或运行漏洞项目代码。

## C1 / D1：浏览器准备与阅读路径

新增 `/knowledge/browser-entry-preparation`，来源固定到 v0.6.2 的部分与可变 main 文档分开记录；核验范围、未采纳材料和页面检查见 [browser-preparation-review.md](./browser-preparation-review.md)。四步导航不表示设备操作已完成，未知结果的准备入口不构成当前组合适用结论。完整执行教程及实机验收仍未完成。

## D2a：首次安装草稿（2026-11-03）

新增 `/knowledge/webkit-first-install`，固定发布元数据与源码推导分开标明，原始来源、摘要记录、缺口及检查见 [first-install-review.md](./first-install-review.md)。文章只到管理器启动；命令是静态内容，不运行脚本或改网络。snippet schema 校验标签、语言和非空文本；React 按文本渲染，不解析 HTML。完整游戏运行路线、次 DNS 等缺口及实机验收仍待后续工作。

## D2b2 后续修订（2026-11-03）

本轮更新现有安装篇与离线篇，优先研究用户选择的《战神：诸神黄昏》PS5 版。Python 发布文件已下载为文本并完成本地摘要与静态源码核对，替代前轮“尚未下载 Python 文件”的限制；没有运行或导入。固定依赖、DNS/HTTPS 失败分支、游戏本体/DLC 与社区报告的范围及剩余缺口见 [install-game-followup.md](./install-game-followup.md)。此前检查记录是历史记录，准确配方、次 DNS 和实机验收仍未完成。

## 通用教程与精简（2026-11-03 用户修正）

后续完整版本与条件引导修订：型号与版本篇改为说明可接收完整原文，无映射时不查询；路线页由条件表单给出准备建议。未新增来源或兼容性结论，既有来源日期不因此更新。检查见 [intake-guidance-review.md](./intake-guidance-review.md)。

主线正文改为多型号阅读；机型与版本研究保留在折叠案例中，来源仍可展开。路线篇改为 choosing-a-route，旧路径重定向。未增加兼容性结论或推断其他型号资料；原始来源继续保留。字数口径、数据约束与本轮检查见 [usability-review.md](./usability-review.md)。
