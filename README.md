# V2R-0 Reality Ops Prototype

This static prototype turns the V2R-0 ground flow into a runnable front-end loop.

The core product idea is simple:

> A user writes what they want, and the system turns that intent into a Reality Ticket with safety gating, specification, BOM, quote, fulfillment state, QC, delivery, and feedback learning.

Long-term direction:

> Codex turns language into code. V2R turns language into reality.

See `NORTH_STAR.md` for the final product goal and safety boundary.

## What It Includes

- Natural language intake
- Reality Gate risk classification
- Three-question clarification
- V2R Ticket and specification sheet
- Buy / print / hybrid decision
- BOM table
- Three quote options with trusted landed cost
- Order state machine
- QC checklist
- Delivery package and feedback learning
- OpenAI API proxy for AI-structured Ticket drafts

Open `index.html` directly in a browser, or publish the repository through GitHub Pages. The demo stores state in `localStorage`, and the JSON export button downloads the current Ticket object.

## OpenAI API Binding

Real API keys must stay on the server. This repo does not store a real key in front-end code, GitHub Pages, README, or committed files.

For local API-backed testing:

1. Copy `.env.example` to `.env.local`.
2. Put the real key in `OPENAI_API_KEY` inside `.env.local`.
3. Keep `OPENAI_MODEL=gpt-5.4-mini` or replace it with another available Responses API model.
4. Keep `OPENAI_BASE_URL=https://api.openai.com/v1` unless you deploy behind your own compatible API gateway.
5. Run `node server.mjs`.
6. Open `http://localhost:8766/`.

The front end calls `/api/structure-ticket`. `server.mjs` forwards that request to the OpenAI Responses API with `Authorization: Bearer $OPENAI_API_KEY`, asks for Structured Outputs using the V2R Ticket JSON Schema, then returns only the structured Ticket patch to the browser.

GitHub Pages remains a static public demo. The API-backed button only works when this project is served by `server.mjs` or a deployed backend with `OPENAI_API_KEY` and `OPENAI_MODEL` configured.

If the front end is on GitHub Pages and the API is deployed elsewhere, set the API base URL at runtime:

```js
localStorage.setItem("v2r_api_base", "https://your-v2r-api.vercel.app");
```

Reload the page after setting it.

## Deployable API

The deployable endpoint is:

```text
POST /api/structure-ticket
```

Request body:

```json
{
  "userIntent": "我想要一个夹在桌边的耳机架，还能绕数据线，黑色，不要打孔"
}
```

Response body is a strict V2R Ticket patch with:

- `risk_class`
- `category`
- `handling_strategy`
- `reason`
- `object_type`
- `questions`
- `spec`
- `realization_mode`
- `bom`
- `quotes_allowed`

`api/structure-ticket.js` is compatible with Vercel Functions. Local development uses the same core code through `server.mjs`.

## v2r-0.2 Foundation

- Added `/api/structure-ticket` as the real AI structuring proxy.
- Added `api/schema/v2rTicketSchema.js` for strict Structured Outputs.
- Added `api/policy/realityGate.js` to block/refuse/redirect unsupported or high-risk requests before calling OpenAI.
- Added front-end `applyAiPatch()` so the AI response updates Reality Gate, clarification questions, spec, BOM, and quote state.
- Added `UNSUPPORTED` for high-value or regulated procurement such as vehicle purchases.
- Added runnable v2r-0.2 tests with `npm test`.

## Demo Flow

1. Click `载入第一单`.
2. Review the Reality Gate result.
3. Use the seeded clarification answers or edit the three key parameters.
4. Generate the specification, BOM, and quote.
5. Select the recommended hybrid plan.
6. Use `模拟推进` to move through guarded order states.
7. Mark QC as passed.
8. Save user feedback.
9. Export the Ticket JSON.

## Quote Explanation

The quote engine is modeling the lowest trusted landed cost, not the lowest sticker price.

Current quotes are calculated from:

- Material cost
- Print time
- Machine time
- Labor
- Standard parts
- Packaging
- Shipping
- Taxes
- Platform fee
- Rework risk reserve

This is still a local formula, not a live marketplace quote. It is meant to make the pricing path explainable before real supplier, printer, and logistics integrations are connected.

## v2r-0.1 Foundation

- User-controlled Ticket text is rendered through DOM nodes and `textContent` instead of HTML string interpolation.
- Quote prices come from a local quote engine using material, print time, labor, packaging, shipping, taxes, platform fees, and rework risk.
- `data/vendors.json`, `data/inventory.json`, and `data/price_rules.json` are the first operational data files.
- `templates/` contains the first parameterized object templates.
- `TEST_CASES.md` captures A/B/C/D Reality Gate checks and basic acceptance rules.
- Order advancement is guarded by simple state transition preconditions.

## Operational Data

- `data/vendors.json`: approved vendors, trust scores, capability tags, turnaround, and failure rates.
- `data/inventory.json`: starter standard-parts inventory for the first low-risk orders.
- `data/price_rules.json`: quote formula assumptions and default cost rules.
- `templates/*.json`: object templates for safe low-risk categories.
- `TEST_CASES.md`: expected Reality Gate and quote behavior for review.
- `REAL_ORDER_EXPERIMENTS.md`: the next three real/half-real order experiments to run.

This is still a static front-end prototype. Payment, procurement, printing, logistics, QC evidence capture, and support actions are simulated until a backend is connected.
