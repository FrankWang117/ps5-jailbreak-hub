# 浏览器准备指南与阅读导航核验

日期：2026-11-02。承接 B，用户确认继续网上资料核查与网站阅读路径，不要求主机实际操作。实现 C1 阅读导航与 D1 准备资料；完整执行教程、工具组合验证和 A3/E 实机验收未完成。型号为用户自述 CFI-2200B01，实际固件未知，12.40 仅为研究假设。

## 来源与采用边界

已阅读下列原始正文。GitHub 文档通过连接器读取；官方日语菜单由网页正文核对。仅查看文本和发布元数据，未下载、运行第三方二进制、脚本或执行页。

| 来源                                                                                                                   | 快照 / 日期                                           | 采用内容                                                                       | 限制                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| [PlayStation 日本支持](https://www.playstation.com/ja-jp/support/hardware/ps-accessories/)                             | 2026-11-02；“マニュアルと保証 / ユーザーズガイド”段落 | 日语用户指南菜单路径                                                           | 仅官方帮助入口，不证明第三方重定向或本型号的 12.40 画面                  |
| [WebKit Autoloader README](https://github.com/itsPLK/ps5-webkit-autoloader/blob/v0.6.2/README.md)                      | 固定 tag v0.6.2                                       | 同网电脑首次本地入口与安装后启动的区别；手动配置和管理器；默认加载器仅本机连接 | 项目声明不是本型号兼容性证据；不据此承诺首次初始化可离线或任意组件可叠加 |
| [WebKit Autoloader 架构](https://github.com/itsPLK/ps5-webkit-autoloader/blob/v0.6.2/ARCHITECTURE.md)                  | 固定 tag v0.6.2                                       | 缓存完整性；Relapse 要求连接本地网络接口而非互联网                             | 不把其他链的条件继承到 Relapse；不承诺重启后永久保持权限                 |
| [WebKit Autoloader v0.6.2](https://github.com/itsPLK/ps5-webkit-autoloader/releases/tag/v0.6.2)                        | 发布于 2026-10-28                                     | 捆绑 unified-autoloader v0.1.6、Payload Manager v0.6.3、elfldr v0.27           | latest 仅用于发现发布，文章改用明确 tag；不称该版本最新或最佳            |
| [etaHEN 非官方移植](https://github.com/GronedWaffel/etahen-11.00-13.60/releases/tag/v2.5B-unified.1)                   | v2.5B-unified.1；发布于 2026-10-05                    | 已捆绑 kstuff-lite v1.11，禁止再重复加载                                       | 不与独立工具任意拼接，不给 12.40 推导执行顺序                            |
| [13.60 组件兼容说明](https://github.com/GronedWaffel/etahen-11.00-13.60/blob/main/KSTUFF-SHADOWMOUNT-COMPATIBILITY.md) | main；2026-11-02 阅读                                 | 仅作为特定构建需要检查就绪条件、相互作用和剩余验证的案例                       | 不将 13.60 的构建修复或测试移植为本型号、12.40 的结论                    |
| [nanoDNS README](https://github.com/drakmor/nanoDNS/blob/main/README.md)                                               | main；2026-11-02 阅读                                 | 运行时 DNS 代理、本地覆盖、上游转发及例外规则                                  | 不作为新机首次入口的当然前提，不提供全部联网阻断保证                     |

另阅读 [Payload Manager README](https://github.com/itsPLK/ps5-payload-manager/blob/main/README.md) 和 [idlesauce Self-Host Tool README](https://github.com/idlesauce/PS5-Exploit-Host-Self-Host-Tool/blob/main/README.md) 作角色对照；未将其他工具的端口、权限、安装命令或公网配置移植到 v0.6.2。1nk1 bundle 仓库文档未能成功获取，因此没有采纳该仓库的版本或配方。搜索中的视频转述及公共 DNS 地址未作为步骤依据，也未访问执行入口。

准备清单、现象分类、记录模板、停止条件是本站编辑安排。文章只说明条件与排查方向，不提供固定公网 DNS、执行文件下载、网络修改脚本或一键运行按钮。本站 apps/host 未集成这些外部工具。

## 产物与验收记录

- 新增 `/knowledge/browser-entry-preparation`，内容仍集中在 data JSON；官方菜单图用既有 diagram 结构渲染，图注表明非实机截图。
- 阅读导航连接开机指南、正式查询、假设路线与准备指南；当前页面用 aria-current=step 标注，不写设备操作完成状态。文末“继续阅读”衔接后续内容，演示查询不展示正式阅读导航。
- 正式未知结果增加准备说明入口，明确不代表该查询适用；查询条件变更与跨页返回仍清除旧结果，不把路线自动匹配为可用方案。
- 冻结安装成功，锁文件未变，未新增依赖。pnpm check 通过，共 53 项测试（core 22、data 3、web 26、host 2）；data/web 实际执行，core/host 使用缓存。UI 覆盖阅读链、键盘进入、跨页清理、资料边界及既有查询回归。
- 本机 5177 浏览器检查：1280px 桌面浅/深色文章与导航；390px 手机浅/深色导航、浅色日语菜单图及章节焦点；scrollWidth 为 1280/390，无横向溢出。验证手机导航进入 12.40 假设查询仍未知，再进入准备篇；焦点可定位到 user-guide。
- 未修改 published.json、Host 或核心查询算法，未做 PS5 实机操作。未提交、推送或部署。

后续缺口为同型号、完整系统版本下可复核的首次入口及具体组件组合说明，以及可操作执行教程；公开资料研究可以继续，不要求用户先操作设备。
