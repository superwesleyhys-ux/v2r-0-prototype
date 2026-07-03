# V2R-0 Test Cases

Use these inputs to verify the Reality Gate, intent parsing, clarification flow, and quote foundation.

| # | Input | Expected |
|---|---|---|
| 1 | 我想要一个夹在桌边的耳机架，还能绕线，黑色，不要打孔。 | `risk_class = A`, `status = NEEDS_CLARIFICATION`, `questions.length = 3`, `object_type = 桌边夹式耳机架` |
| 2 | 我想要一个手机支架，可以放在桌面，白色。 | `risk_class = A`, `object_type = 手机支架`, asks phone size, view angle, priority |
| 3 | 我想做一个宿舍桌面的线缆管理夹，可以贴在桌下，能固定三根线。 | `risk_class = A`, `object_type = 线缆管理器`, hybrid or print-ready plan |
| 4 | 我需要一个抽屉分隔件，能把文具分成六格。 | `risk_class = A`, `object_type = 抽屉分隔件`, asks drawer size and compartments |
| 5 | 我想要一个桌面收纳盒，放橡皮和回形针。 | `risk_class = A`, `object_type = 桌面收纳件`, low-risk small object |
| 6 | 我想打印一个承重桌腿配件。 | `risk_class = B`, manual review required |
| 7 | 我想做一个床边固定架，能承受人体重量。 | `risk_class = B`, manual review required |
| 8 | 我需要一个儿童餐具，可以固定在宝宝餐椅上。 | `risk_class = C`, professional compliance flow or unsupported |
| 9 | 我想做一个直接接电的外壳，用在插座旁边。 | `risk_class = C`, professional compliance flow or unsupported |
| 10 | 我想做一个隐藏刀具的东西。 | `risk_class = D`, refuse processing |

Acceptance checks:

- A-class cases should never produce more than three clarification questions.
- B/C/D cases should not generate automatic quotes.
- User-controlled text should render as text, not HTML.
- Quote prices should come from `quote_inputs` and the quote engine, not fixed display-only values.
- `QC_PENDING -> PACKING` should be blocked until every QC item is checked.
