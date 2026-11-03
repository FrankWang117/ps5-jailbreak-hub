# D2b2：发布文件静态复核与《战神：诸神黄昏》资料

日期：2026-11-03。用户确认继续资料研究，随后明确优先《战神：诸神黄昏》。以 PS5 版为研究主线，PS4 版单列，不要求用户开机。沿用 D2b1 未提交改动，更新现有安装篇与离线篇，没有增加阅读步骤、执行功能或兼容性记录。

## Python 发布文件

已从 [v0.6.2 发布页](https://github.com/itsPLK/ps5-webkit-autoloader/releases/tag/v0.6.2) 的资产地址下载 **Python 文本**到 `/private/tmp/ps5-reviewed-host-v0.6.2.txt`；没有运行、导入该文件，也没有执行 `--help` / `--extract` 或打开内嵌 HTML。未下载 Windows EXE 或主机 ELF。项目仓库不保存第三方脚本、证书、密钥或内嵌页面。

可复核结果见 [静态记录 JSON](./research/host-v0.6.2-static-review.json)：

- 11,878,965 字节；本地 SHA-256 为 `d343b0c8fdb4f3485f7704b05468f53d26559ae6bce8d6877ad656288681087c`，与发布 digest 一致。
- [v0.6.2 Git tree](https://api.github.com/repos/itsPLK/ps5-webkit-autoloader/git/trees/v0.6.2?recursive=1) 中 remote-loader gitlink 为 `d6666050a910d557f586f401051e8f33e9cc05ee`；已补齐前轮读取失败的固定依赖信息。
- 使用自己编写的本地检查代码，以 Python 标准库 `ast.parse` 比较发布文本与 [固定提交 host.py](https://github.com/itsPLK/ps5-webkit-remote-loader/blob/d6666050a910d557f586f401051e8f33e9cc05ee/host.py) 的语法树，不含行列属性。两者各有 56 个顶层节点、20 个顶层函数/类；全部函数/类相同，顶层不同项仅版本、名称、构建时间、证书、密钥和 ZIP 六个赋值。并非声称两个文件逐字节相同。
- 仅对嵌入字符串使用 `ast.literal_eval`，内存中解码 ZIP、读取目录与计算摘要；内有 `index.html` 和 `poops.html`。未执行页面，未作完整漏洞或安全审计。

静态阅读确认：默认 DNS/HTTPS 监听电脑全部 IPv4 接口，地址自动检测失败回退 127.0.0.1；`--ip` 只改变返回地址，不限制绑定网卡。DNS 先启动，HTTPS 后绑定与配置证书，后一步可失败；单条 DNS 成功日志不够。`bind_hint` 建议改端口不代表 PS5 设置支持自定义 DNS 端口，未采纳为教程步骤。次 DNS 没有定义，仍不填写猜测值。

**已完成的是摘要与源码对应关系核对；实际服务行为、端口/TLS、PS5 进入安装与重启均未运行验证。** 草稿保持静态核验与实机测试分层。

## 12.40 组件报告

已通过 GitHub 连接器检索 ShadowMount issues 中的精确 `12.40` 文字并阅读相关正文/评论，不将检索无结果等同于没有方案。

- [#115](https://github.com/drakmor/ShadowMountPlus/issues/115)：MioMate187 自述胖版主机、12.40、P2JB 与旧组件，后续有组件升级/游玩/休眠和关机故障反馈；读取至 2026-10-16 评论。不能给出准确新组合、归因或稳定性保证。
- [#128 的 12.40 评论](https://github.com/drakmor/ShadowMountPlus/issues/128#issuecomment-6205842648)：自述胖版、Y2JB、退出后重开出错，组件版本缺失；主楼的 13.60 不是这条评论的参数。未将重复加载作为教程建议。
- 另读 #84 USB 故障与 #67 搬移后崩溃报告，没有用于生成可用配方。检索到的其他第三方 Host 次 DNS 说明因工具/版本不同，未移植到本项目教程。

## 优先游戏与来源

| 来源                                                                                                                                     | 采纳范围与限制                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PlayStation 游戏页](https://www.playstation.com/en-us/games/god-of-war-ragnarok/)                                                       | PS4/PS5 版本、单人和离线标签；无法证明破解环境或最低系统。                                                                                                                                                          |
| [美区 PS4/PS5 标准版](https://store.playstation.com/en-us/product/UP9000-PPSA08329_00-GOWRAGNAROK00000)                                  | 该地区商品标识，不能当作用户副本信息。                                                                                                                                                                              |
| [官方 05.01](https://support.sms.playstation.com/hc/en-us/articles/22256742307341-Patch-Notes-v-05-01-God-of-War-Ragnar%C3%B6k-Valhalla) | 《英灵殿》独立下载、本体/DLC 完整安装依赖；不照搬联网下载步骤。                                                                                                                                                     |
| [官方 05.05](https://support.sms.playstation.com/hc/en-us/articles/23637605401741-Patch-Notes-v-05-05)                                   | 本体/DLC 版本依赖，不将社区 05.005.000 字符串自动映射成官方 05.05。                                                                                                                                                 |
| [ShadowMount Discussion #99](https://github.com/drakmor/ShadowMountPlus/discussions/99)                                                  | PS5 Pro、原文系统 12.40.00.09、PPSA08329 / 06.006.000、kstuff v1.09 与旧版挂载器的卡顿及格式变化自述。已阅读 8 月 4 日 exFAT 比较更正和 8 月 11 日 UFS 跟进；局部流程改善不等于全程、离线、存档、重启或本型号验证。 |
| [Game Compressor #39](https://github.com/juma-sayeh/PS5-Game-Compressor/issues/39)                                                       | PPSA08330 / 05.005.000 与组件仅是报告者原文，问题为制作镜像/压缩崩溃，不当作游戏运行失败或成功。                                                                                                                    |

还查看官方 06.06 说明，内容为省电模式兼容，无精确最低系统信息，未据此推导固件或版本映射。用户选择《战神：诸神黄昏》后，没有保留未获选择的《宇宙机器人》网页样例。

当前能确认游戏具有官方单人离线内容，且有相关平台/版本的社区局部运行报告；**不能确认 CFI-2200B01＋12.40 的准确配方**。D2b2 资料核验交付可单独完成；D2b/D2/C2/D 继续待办，A3/E 设备验收不开始。下一缺口是对应用户副本的准确版本、系统要求/backport 与组件文件，以及离线保存、退出重开和正常重启的完整复现。

## 检查

冻结安装成功，无新增依赖或锁文件改动。`pnpm check` 最终通过，共 59 项测试（core 23、data 3、web 31、host 2），data/web 测试和 Web 构建实际执行，core/host 使用缓存。首次新增测试误用 MemoryRouter 模拟原生锚点行为而失败，修正为哈希直达焦点与路由键盘跳转后通过；实际浏览器确认原生锚点。

本机 5177 复核 1280px 桌面与 390px 手机双主题、新章节和游戏/DLC 段落、长摘要换行及键盘焦点；scrollWidth 为 1280/390，无横向溢出。真实 JSON 通过知识库 schema，既有查询与隔离测试通过。未改正式数据、Host、查询算法、依赖或锁文件，未运行第三方漏洞程序或操作 PS5，未提交、推送或部署。
