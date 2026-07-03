# V2R-0 Reality Ops Prototype

This static prototype turns the V2R-0 ground flow into a runnable front-end loop:

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

Open `index.html` directly in a browser, or publish the repository through GitHub Pages. The demo stores state in `localStorage`, and the JSON export button downloads the current Ticket object.

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

## v2r-0.1 Foundation

- User-controlled Ticket text is rendered through DOM nodes and `textContent` instead of HTML string interpolation.
- Quote prices come from a local quote engine using material, print time, labor, packaging, shipping, taxes, platform fees, and rework risk.
- `data/vendors.json`, `data/inventory.json`, and `data/price_rules.json` are the first operational data files.
- `templates/` contains the first parameterized object templates.
- `TEST_CASES.md` captures A/B/C/D Reality Gate checks and basic acceptance rules.
- Order advancement is guarded by simple state transition preconditions.

This is still a static front-end prototype. Payment, procurement, printing, logistics, QC evidence capture, and support actions are simulated until a backend is connected.
