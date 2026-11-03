# D2b1：运行组件与离线游玩流程资料核验

核对日期：2026-11-03。用户确认继续按公开资料推进，暂不操作设备。本轮新增第九篇 `/knowledge/offline-game-workflow`，接入第六个阅读步骤；整理候选环境、冲突、格式、识别/注册/启动、离线存档与重启检查点。它是待实机验证的草稿，未形成 CFI-2200B01＋12.40 的准确可用配方。实际系统版本仍未知。

## 一手材料与结论范围

| 来源                                                                                                                    | 固定版本            | 采纳与限制                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ShadowMount README](https://github.com/drakmor/ShadowMountPlus/blob/1.7beta11/README.md)                               | 1.7beta11           | 最低 kstuff-lite 依赖、镜像类型、扫描根目录与深度、元数据、默认日志、退出/休眠释放及存储风险；未提供本型号 12.40 的完整复现。                                           |
| [ShadowMount 发布说明](https://github.com/drakmor/ShadowMountPlus/releases/tag/1.7beta11)                               | 1.7beta11           | 2026-10-29 21:22:45 UTC（北京时间 10 月 30 日）；PKG 队列和游戏→更新→DLC 顺序不证明游戏可运行。此前路线文章引用的 1.7beta2 是历史快照，本篇使用另一固定版本，不能混搭。 |
| [kstuff-lite 发布说明](https://github.com/EchoStretch/kstuff-lite/releases/tag/v1.11)                                   | v1.11               | 固件范围与 FPKG 功能条目分别读取；11.40/11.60 条目不能证明 12.40 所有格式或游戏可用。                                                                                   |
| [etaHEN 发布说明](https://github.com/GronedWaffel/etahen-11.00-13.60/blob/v2.5B-unified.1/RELEASE-NOTES-unified-r1.md)  | v2.5B-unified.1     | 非官方移植，内置 kstuff-lite v1.11，不得重复加载；12.40 启动反馈与 13.60 游戏功能反馈分开，不扩为所有配置实测。                                                         |
| [集成审查](https://github.com/GronedWaffel/etahen-11.00-13.60/blob/v2.5B-unified.1/KSTUFF-SHADOWMOUNT-COMPATIBILITY.md) | v2.5B-unified.1     | 仅 13.60 与定制 1.7beta2-snipers1360-r1 的候选组合；不能套用为 12.40 或上游 1.7beta11 的配方。                                                                          |
| [PlayStation 向后兼容](https://www.playstation.com/en-us/support/games/ps5-backward-compatibility-games/)               | 2026-11-03 阅读快照 | 普通受支持 PS4 游戏及限制，不能替代破解环境验证；不将该页升级系统建议加入本教程。                                                                                       |

通过 GitHub 连接器联网读取 README、固定 tag 正文及发布 API，另打开官方支持全文。没有下载 ELF 或游戏、运行第三方程序或修改网络。正文明确区分项目说明、本站推导/验收方法与未执行的设备测试。来源不写入 published.json。

## 不能直接拼接的部分

- 独立 kstuff 与内置 kstuff 的 etaHEN 是不同候选环境，不能同时加载；最低依赖满足不等于组合实测。
- ShadowMount README 的 autoload 示例包含另一份 kstuff，而 etaHEN 禁止第二份；前篇 Autoloader 的 autoload 文件还改变默认管理器行为，不能剪贴成通用清单。
- ShadowMount 默认 backport_fakelib 与独立 BackPork 冲突；不由此推导已具备某游戏所需 backport。
- README 9021 发送示例不证明前篇仅监听 localhost 的加载器可以被电脑连接。
- `.ffpkg` 是 UFS 镜像，不能当作 `.pkg` 的另一种拼写；扫描、注册、挂载和启动分别记录。
- 上游删除游戏数据的排错建议带有删除存档警告，不作为本站默认步骤。

## 发布元数据快照

仅核对 GitHub 资源 digest，未下载计算，不能作为运行安全或兼容性结论：

| 版本 / 文件                              | 元数据 SHA-256                                                   |
| ---------------------------------------- | ---------------------------------------------------------------- |
| 1.7beta11 / shadowmountplus.elf          | 08c843018750bef013fe3a4de5f80c5c9738c6c2dafa2406e6b6e68d7585f3da |
| v1.11 / kstuff.elf                       | ab9a6cb4d3b1daf139d4d646e402b1cf569071acd64599c936d7a3a6164dc779 |
| v2.5B-unified.1 / etaHEN-11.00-13.60.elf | 46c161473b27d12f1fa5e2d1d10466ce587db841ed9e8d71a219424d8fcf637f |

## 仍待补齐

准确 12.40 组合报告、具体游戏及其版本/补丁/系统要求/离线条件没有足够材料，本轮不发布“可以照做”的组合。游戏测试模板全部标为未知/未执行，不由图标、FPS、宽范围声明或其他固件报告生成兼容性结论。当前没有选定游戏，不能声称已经完成逐游戏最低系统与联网要求核验。

前篇次 DNS 与发布脚本运行记录的缺口仍未补齐；本轮没有发现足以填写次 DNS 的版本材料，也没有实际运行发布脚本，不以通用 DNS 教程代替。D2b1 的资料与网页草稿可以独立验收；D2b、D2、C2/D 及 A3/E 继续待办，不要求用户现在开机。

## 验收记录

- `CI=true pnpm install --frozen-lockfile` 成功，锁文件未变，无新增依赖。
- `pnpm check` 通过，共 58 项测试（core 23、data 3、web 30、host 2）；data/web 实际执行，core/host 沿用缓存。真实 JSON 通过 schema，新增直达、键盘继续阅读、六步位置、静态模板与正式未知结果回归。
- 本机 5177：1280px 桌面、390px 手机双主题；键盘从安装篇进入新篇，标题与章节焦点正常；来源标签与固定版本可读。文章 scrollWidth 为 1280/390，手机模板 clientWidth/scrollWidth 均为 302。已复核返回空查询并输入 12.40 仍未知。
- 正式兼容性 JSON、查询算法、Host 和锁文件未改；PS5 实机未操作，未运行外部漏洞程序，未提交、推送或部署。

## D2b2 后续修订（2026-11-03）

本轮更新现有安装篇与离线篇，优先研究用户选择的《战神：诸神黄昏》PS5 版。Python 发布文件已下载为文本并完成本地摘要与静态源码核对，替代前轮“尚未下载 Python 文件”的限制；没有运行或导入。固定依赖、DNS/HTTPS 失败分支、游戏本体/DLC 与社区报告的范围及剩余缺口见 [install-game-followup.md](./install-game-followup.md)。此前检查记录是历史记录，准确配方、次 DNS 和实机验收仍未完成。
