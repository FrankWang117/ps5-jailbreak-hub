# M1 数据来源核验记录

核对日期：2026-11-02。方式：Codex 实际读取下面的官方产品页及项目文档，对照字段与结论范围；未做 PS5 实机测试，未取得独立人员复核，也未执行、下载或集成漏洞代码。`verified` 在型号来源中表示内容已对照原文，不表示设备或破解已经实测。日期按天记录，JSON 的 `T00:00:00Z` 为日期占位，不声称精确访问时刻。

## 采纳的型号来源

### Sony Store 日本产品页

- 原页面标题：PlayStation(R) 5 本体 商品一覧 | PlayStation（R）5 | ソニー。
- [CFI-2200B01 产品页](https://pur.store.sony.jp/ps5/products/ps5/CFI-2200B01_product/)。发布者：Sony Store 日本；来源 ID：sony-store-cfi2200。
- 核对位置：页首型号和产品名，产品说明的日本向规格、日语语言说明、光驱说明及付属品存储条目。
- 支持字段：code、name、region、edition、language、storage。中文名称是摘要译名；region 表示销售面向地区，不表示制造地、硬件版本或可解除限制。
- 收录为日本销售、日语专用数字版、825GB SSD 标称规格；不收录易变化的售价与库存。
- 不能支持：出厂/当前固件、主板修订、破解兼容性、能否改变语言或账号限制。产品规格不代表用户设备的实际配置及状态。

### PlayStation 日本产品详情

- 原页面标题：PS5 デジタル・エディション 日本語専用 | PlayStation (日本)。
- [产品详情页](https://www.playstation.com/ja-jp/ps5/buy-now/ps5-digital-edition-Japanese-only/)。发布者：Sony Interactive Entertainment / PlayStation 日本；来源 ID：playstation-jp-cfi2200。
- 核对位置：商品详情表中品番 CFI-2200B01 一栏的发售日期。
- 支持字段：releaseDate = 2025-11-21。邻列套装 CFIJ-10032 和后文黑色款 CFI-2200B02S 是其他商品，未混用其日期。
- 不能支持：批次固件或当前系统版本，更不能证明兼容性。页面未来可能变动，后续修改数据应重新核对。

对应 JSON 见 packages/data/src/published.json。modelSources.claims 将来源绑定到具体字段和值；型号来源不能放入兼容性记录的 evidenceIds。

## 查阅但未采纳为兼容性结论的线索

| 来源                                                                                 | 实际看到的内容与局限                                                                                                    | 本次决定                                                                                           |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [cragson/ps5-hen README](https://github.com/cragson/ps5-hen#readme)                  | 提供固件列表和功能限制，未在所读正文提供 CFI-2200B01 的精确型号复现证据                                                 | 不把固件列表外推到此型号，不建立兼容性记录                                                         |
| [P2JB-Y2JB-Porting issue #21](https://github.com/matem6/P2JB-Y2JB-Porting/issues/21) | 用户报告该型号与版本标记 12.2 的备份恢复错误；后续评论提出其他方案线索。缺少完整方案版本、复现环境和可核验验证过程      | 留作待进一步核验的社区线索；既不判定支持，也不据失败报告判定不支持，不将 12.2 自动转换为正式固件键 |
| [jordyidk/slopkit](https://github.com/jordyidk/slopkit)                              | issue 链出的项目页面给出泛化固件范围；本次读取页面没有建立此型号与明确版本的复现链条，亦不能消除 issue 中版本表述的歧义 | 不从版本范围或评论推导此型号状态；不打开其执行入口                                                 |
| [owendswang/ps5-syslang](https://github.com/owendswang/ps5-syslang)                  | 项目描述的是系统语言工具；不能据此证明某型号的前置破解能力或语言限制已解除                                              | 不收录为本阶段兼容性结论，不集成工具                                                               |

本次是有限范围的来源筛选，不是穷尽所有公开研究。正式目录当前没有兼容性记录，**不等于“暂无公开方案”**。对未收录的任意型号/固件组合均回退 unknown；不把传闻改写成 researching。

## 数据边界和维护步骤

- 默认数据为 published.json，只有 1 个真实型号、2 条字段来源，固件、方案、兼容性证据与结论数组均为空。
- sample.json 经 @ps5/data/demo 子路径导出，只在独立 /demo/compatibility 路由按需载入；演示型号与 03.00、99.99 不进入正式目录。演示实体维持 isExample=true、unknown；演示来源不得已核验。
- 来源如新增或变化：实际查阅 → 记录支持字段及范围、限制和日期 → 更新 claims/数据 → schema 和测试 → UI 核对 → 更新本记录。
- 非 unknown 兼容性结论必须另行核验型号、固件、方案与状态，记录证据时间；partial 必须写明限制。单个产品型号有来源不替代兼容性审核。
- “已验证”“部分可用”等 UI 路径使用隔离测试夹具覆盖；测试不会将这些虚构结论写入正式或演示目录。

## B 路线研究与正式数据隔离（2026-11-02）

用户授权按网上资料推进，原始来源、项目版本、日期与缺口见 [route-research.md](./route-research.md)。相关内容只进入独立知识文章；项目声明、社区 issue 和其他固件测试没有升级为 CFI-2200B01＋12.40 的非 unknown 结论。published.json、modelSources、evidence 与 compatibility 均未修改；实际固件及游戏运行仍未知。
