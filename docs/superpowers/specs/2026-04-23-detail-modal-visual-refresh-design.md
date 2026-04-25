# Detail Modal Visual Refresh Design

Date: 2026-04-23
Scope: Card detail modal only
Status: Approved in conversation, pending written spec review

## Summary

Refresh the card detail modal so it feels like a lit ritual stage inside the same product world as the homepage and archive, not a separate light-colored info sheet. The modal should keep a clear left-right product layout, but emotionally behave like a reveal moment: the card is the focal object, the stage line is the first thing the user feels, and explanatory content follows in a calmer hierarchy.

This is a visual redesign only. It does not change card data, API behavior, or archive interactions outside the modal open/close flow.

## Goals

- Make the detail modal feel native to the dark archive system
- Turn the opened card into a focal “revealed object”
- Make `stageLine` the primary content emphasis on the right side
- Keep detailed description, upright/reversed meanings, and tags available but quieter
- Improve the modal’s breathing room, visual depth, and transition quality

## Non-Goals

- No change to draw flow or interpretation UI
- No change to admin behavior or content model
- No rewrite of card data structure
- No expansion into a full-screen dedicated detail page

## Design Decisions

- Color palette: deep obsidian base, warm parchment-gold lines, restrained cool-cyan highlights
- Typography: serif for card name and stage line, sans-serif for descriptive/supporting content
- Spacing system: larger outer padding and wider vertical rhythm than current modal
- Border-radius strategy: generous modal shell radius, medium internal panel radii, strongest rounding on the stage shell rather than on every content block
- Shadow hierarchy: strongest on the card stage, medium on the modal shell, lightest on internal content surfaces
- Motion style: modal rises in softly, card settles into place first, content follows with low-amplitude fade/translate

## Existing Problems

1. The modal uses a light parchment background that breaks from the homepage and archive’s dark-world language.
2. The current layout is functional but reads like a document panel rather than a reveal moment.
3. `stageLine` is present but not visually commanding enough to carry the card’s emotional core.
4. Secondary information blocks are visually too close to the primary content.
5. The left card area presents the card, but not as a staged centerpiece.

## Chosen Direction

The approved direction is:

- Overall mood: `lit ritual stage`
- Layout: `left isolated hero card`
- Content order: `emotion first, explanation second`

This means the modal stays structurally legible, but the experience should feel like opening a ceremonial display drawer rather than reading a spec sheet.

## Information Hierarchy

### Left Column

- Large staged card presentation
- Card sits within a dark pedestal-like stage surface
- Optional low-contrast radial lines / ring accents behind the card
- No noisy decorative framing that competes with the uploaded art

### Right Column

1. Small metadata row
   - category
   - order number
   - title
   - subtitle
2. Primary emotional line
   - `stageLine`
   - largest right-column emphasis
   - treated as a luminous ritual line, not a generic blockquote
3. Secondary explanation
   - `description`
   - calm, readable, supportive
4. Tertiary properties
   - upright meaning
   - reversed meaning
   - tags
5. Navigation controls
   - previous / next remain clear and product-like

## Visual Structure

### Modal Shell

- Move from the current pale gradient panel to a dark, layered shell
- Use a larger radius than the current modal, but keep it controlled and product-like
- Introduce subtle edge lighting and inner border treatment
- Increase the feeling of depth through layered shadows rather than heavier borders

### Card Stage

- The left column becomes a stage, not just a container
- Use a darker backing plane than the modal body
- Add subtle halo / arc / ring geometry behind the card at very low opacity
- Preserve the uploaded cover artwork as the true focal point

### Primary Quote Treatment

- Replace the current “paper quote block” feel with a more elevated ritual-line treatment
- Keep the quote large and emotionally immediate
- Avoid oversized quotation-mark decoration if it feels ornamental rather than precise
- Let scale, spacing, and contrast carry emphasis

### Secondary Content Panels

- Description and upright/reversed meanings should feel quieter and more modular
- Use restrained panels or separators instead of loud framed cards
- Tags should read as metadata, not highlights

## Interaction and Motion

- Backdrop remains blurred and dark, but slightly richer than flat dimming
- Modal entry: vertical rise + fade
- Card entry: slight independent settle animation
- Content entry: subtle staggered fade after card arrival
- Previous / next actions should feel responsive but not flashy
- Close button stays obvious, compact, and unobtrusive

## Responsive Behavior

### Desktop

- Two-column composition stays intact
- Left card stage should have enough width to feel ceremonial, not cramped
- Right copy column should keep comfortable line lengths

### Tablet / Narrow Desktop

- Columns may tighten but should preserve card-first emphasis
- Do not collapse hierarchy by compressing all content into equal blocks

### Mobile

- Stack vertically
- Card stage first
- Metadata and stage line immediately after
- Supporting content below with generous spacing

## Implementation Notes

- Reuse the existing `DetailModal` component and modal open/close behavior
- Keep `TechCard` as the card surface unless a detail-only variant is clearly needed
- Prefer CSS-driven layout and motion changes over structural rewrites
- If needed, add small semantic wrappers for clearer hierarchy in the right column

## Testing and Verification

- Verify the modal still opens from library cards without regression
- Verify close button, previous, and next actions still work
- Verify uploaded-cover cards remain visually dominant
- Verify `stageLine` is the strongest right-column element
- Verify mobile stacking preserves hierarchy and readability
- Verify no text collisions, clipped shadows, or scroll traps
- Verify the modal feels visually continuous with homepage and archive styling

## Risks and Mitigations

- Risk: too much ritual styling could tip into decorative fantasy
  - Mitigation: keep effects low-contrast and let layout carry the drama
- Risk: the quote treatment could overpower card metadata
  - Mitigation: preserve a small but clear metadata row above the emotional line
- Risk: dark-on-dark panels may reduce readability
  - Mitigation: use stronger spacing and contrast instead of heavier ornament

## Deliverable

One redesigned card detail modal that feels like a premium ritual reveal inside the archive product, with clearer emphasis on card emotion, stronger staging of the large card, and a darker visual language consistent with the rest of the site.
