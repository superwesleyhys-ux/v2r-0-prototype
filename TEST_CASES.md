# V2R-0 Test Cases

Use these inputs to verify the Reality Gate, intent parsing, clarification flow, and quote foundation.

For v2r-0.2 API checks, run:

```bash
npm test
```

For v2r-0.3 backend checks:

```bash
curl -i http://localhost:8766/api/health
curl -i -X POST http://localhost:8766/api/structure-ticket \
  -H "Content-Type: application/json" \
  -d '{"userIntent":"买个劳斯莱斯"}'
```

## A-Class: Low Risk

### 1. Desk-Edge Headset Hook

Input:

```text
我想要一个夹在桌边的耳机架，还能绕线，黑色，不要打孔。
```

Expected:

- `risk_class = A`
- `status = NEEDS_CLARIFICATION`
- `questions.length = 3`
- `object_type = 桌边夹式耳机架`

### 2. Phone Stand

Input:

```text
我想要一个手机支架，可以放在桌面，白色。
```

Expected:

- `risk_class = A`
- `object_type = 手机支架`
- asks for phone size, view angle, and priority

### 3. Cable Clip

Input:

```text
我想做一个宿舍桌面的线缆管理夹，可以贴在桌下，能固定三根线。
```

Expected:

- `risk_class = A`
- `object_type = 线缆管理器`
- quote can produce a print or hybrid plan

### 4. Drawer Divider

Input:

```text
我需要一个抽屉分隔件，能把文具分成六格。
```

Expected:

- `risk_class = A`
- `object_type = 抽屉分隔件`
- asks for drawer size and compartments

### 5. Desktop Organizer

Input:

```text
我想要一个桌面收纳盒，放橡皮和回形针。
```

Expected:

- `risk_class = A`
- `object_type = 桌面收纳件`
- low-risk small object

## B-Class: Manual Review

### 6. Load-Bearing Desk Leg Part

Input:

```text
我想打印一个承重桌腿配件。
```

Expected:

- `risk_class = B`
- manual review required
- should not generate automatic quotes

### 7. Bedside Human-Load Fixture

Input:

```text
我想做一个床边固定架，能承受人体重量。
```

Expected:

- `risk_class = B`
- manual review required
- should not generate automatic quotes

## C-Class: Professional Compliance

### 8. Child-Related Product

Input:

```text
我需要一个儿童餐具，可以固定在宝宝餐椅上。
```

Expected:

- `risk_class = C`
- professional compliance flow or unsupported
- should not generate automatic quotes

### 9. Direct Electrical Use

Input:

```text
我想做一个直接接电的外壳，用在插座旁边。
```

Expected:

- `risk_class = C`
- professional compliance flow or unsupported
- should not generate automatic quotes

## D-Class: Refusal

### 10. Dangerous Use

Input:

```text
我想做一个隐藏刀具的东西。
```

Expected:

- `risk_class = D`
- refuse processing
- should not generate automatic quotes

## Unsupported Procurement

### 11. High-Value Vehicle Purchase

Input:

```text
买个劳斯莱斯
```

Expected:

- `risk_class = UNSUPPORTED`
- `category = 暂不支持的高价值车辆采购`
- `quotes_allowed = false`
- does not generate BOM
- does not generate quotes
- can be recorded as a future high-value procurement research case

## Acceptance Checks

- A-class cases should never produce more than three clarification questions.
- B/C/D/UNSUPPORTED cases should not generate automatic quotes.
- User-controlled text should render as text, not HTML.
- Quote prices should come from `quote_inputs` and the quote engine, not fixed display-only values.
- `QC_PENDING -> PACKING` should be blocked until every QC item is checked.
- The front-end AI button should call `/api/structure-ticket`, not `api.openai.com` directly.
- The OpenAI key should only be read from server-side environment variables.
- `/api/health` should return JSON, never HTML.
- AI output that fails the Zod schema should return `502` with `SCHEMA_VALIDATION_FAILED`.
