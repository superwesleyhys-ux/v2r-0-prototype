# V2R North Star

V2R is an AI-driven reality generation system.

The final goal is not a shopping assistant, a generic agent, or a normal 3D printing platform. The goal is an AI reality execution system where a user describes a target in natural language, pays inside the software, and the system coordinates the path from idea to physical result.

Short version:

> V2R = 用自然语言生成现实物品。

Or:

> Codex turns language into code. V2R turns language into reality.

## Final User Flow

1. User describes what they want.
2. AI understands the goal.
3. AI decomposes the goal into materials, parts, process, tools, quantities, and constraints.
4. AI checks feasibility, legality, and safety.
5. AI searches platforms for raw materials and parts.
6. AI compares price, trust, logistics, vendor quality, and return risk.
7. AI talks with sellers about quantity, specification, feasibility, customization, inventory, shipping, and discounts.
8. AI produces the lowest trusted plan.
9. User confirms and pays.
10. AI handles purchasing, vendor communication, shipment tracking, and support.
11. Raw materials arrive at the user or local fulfillment point.
12. User places the materials into a dedicated machine.
13. The machine identifies material specs and executes fabrication or assembly.
14. The final physical object is produced.

The user should be responsible for the goal and payment. The AI should be responsible for procurement, communication, coordination, logistics, and manufacturing preparation. The machine should be responsible for the final material-to-product transformation.

## What Makes It Different

Traditional commerce:

```text
User knows what to buy -> searches -> orders
```

V2R:

```text
User only knows the goal -> AI infers requirements -> AI procures -> AI coordinates -> machine manufactures
```

For example, if the user says:

```text
I want a metal desktop organizer.
```

The system should reason about:

- Material choice: steel sheet, aluminum sheet, or another material
- Thickness and area
- Screws, fasteners, pads, coatings, and finishes
- Cutting, bending, drilling, corrosion resistance, and assembly requirements
- Whether a home or local machine can process the material
- Whether sellers support small quantities or custom cuts
- Shipping limits and cost
- Total trusted landed cost
- Safer, cheaper, or more reliable alternatives

Then the AI should communicate with suppliers:

- Can this material be cut to the required size?
- What is the minimum order quantity?
- What is shipping cost and lead time?
- Is this thickness suitable for the structure?
- Can the vendor offer a better price or bundle?

## System Split

### 1. Software: AI Reality Procurement And Coordination

This is the brain of V2R.

It owns:

- Intent understanding
- Engineering decomposition
- Material calculation
- BOM generation
- Platform search
- Price comparison
- Vendor trust scoring
- Seller communication
- Negotiation and RFQ
- Inventory confirmation
- Logistics coordination
- Order tracking
- Payment integration
- Risk classification
- Support communication

### 2. Hardware: Home Or Local Reality Manufacturing Machine

This is the body of V2R.

It eventually owns:

- Material recognition
- Spec confirmation
- Cutting
- Bending
- Drilling
- Connecting
- Printing
- Assembly
- Inspection
- Final output

The current repo does not implement the hardware layer. V2R-0 focuses on the software-side Reality Ticket, quote, safety, BOM, QC, and learning loop so the system can start with low-risk manual or semi-manual fulfillment.

## Safety Boundary

V2R must always keep a Reality Gate.

```text
Safe and verifiable -> automatic flow
Uncertain -> human or professional review
High risk -> professional compliance flow
Illegal or dangerous -> refusal
```

The system must be especially careful with:

- Metal cutting and heat processing
- Electrical parts
- Load-bearing structures
- Children-related products
- Medical products
- Food-contact products
- Transportation parts
- Weapons, dangerous tools, or rule-evasion requests

The final system is not "make anything." It is:

> In a safe, legal, and verifiable scope, convert a user goal into a physical product.

## Current V2R-0 Interpretation

V2R-0 is the smallest software-side foundation for that final goal.

It proves:

- Natural language can become a Reality Ticket.
- Reality Gate can narrow unsafe requests.
- A low-risk object can become a spec, BOM, quote, QC checklist, package, and feedback record.
- The system can start with manual or semi-manual fulfillment before full hardware automation exists.

The next validation is not more UI. It is whether real or half-real low-risk orders can be sourced, printed, checked, delivered, and learned from.
