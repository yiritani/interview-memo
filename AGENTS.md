## Project

This is a Next.js web application built with:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui where appropriate
- Aceternity UI / Motion / Three.js / React Three Fiber when useful

## Design Direction

The visual direction of this project is:

**3D-first, interactive, spatial web application.**

The application should NOT look like a generic AI-generated SaaS dashboard.

When implementing or modifying UI, prioritize:
- depth
- layering
- spatial composition
- perspective
- subtle 3D transformations
- interactive motion
- tactile hover / press feedback
- visual hierarchy created through space rather than excessive cards

3D effects should feel intentional and integrated into the interface.

Prefer:
- perspective transforms
- translateZ
- rotateX / rotateY
- parallax
- layered surfaces
- floating UI elements
- depth-based shadows
- interactive lighting where appropriate
- React Three Fiber / Three.js for actual 3D scenes
- Aceternity-style interactive components where appropriate

## Avoid Generic AI SaaS Design

Do NOT default to the stereotypical AI-generated SaaS aesthetic.

Avoid:
- excessive rounded cards
- `rounded-xl` / `rounded-2xl` everywhere
- every section being placed inside a card
- repetitive card grids
- excessive pill-shaped UI
- gratuitous gradients
- purple/blue AI gradients
- glowing purple borders
- excessive glassmorphism
- generic dashboard layouts
- huge marketing-style headings inside the application
- excessive empty space used only to make the UI look "premium"
- random decorative blobs
- unnecessary badges
- excessive drop shadows

Do not automatically turn content into:

[ icon ]
Title
Description

inside a rounded card.

Before introducing a card, ask whether hierarchy can instead be expressed
through typography, spacing, dividers, layering, depth, or interaction.

## 3D Rules

3D is a core visual language of this project, not a decorative afterthought.

Use 3D where it improves:
- navigation
- hierarchy
- interaction feedback
- data exploration
- transitions
- focus
- visual identity

Prefer subtle depth for frequently used interfaces.

Reserve heavy WebGL / Three.js effects for areas where they provide
meaningful visual impact.

Do not sacrifice usability for visual effects.

Always preserve:
- readable text
- obvious interaction targets
- keyboard navigation
- responsive behavior
- acceptable performance

Respect `prefers-reduced-motion`.

## UI Components

Tailwind CSS is the primary styling system.

shadcn/ui may be used for functional primitives such as:
- Dialog
- Dropdown
- Select
- Tooltip
- Popover
- Command
- Form controls

Do not let default shadcn styling determine the visual identity.

Restyle components when necessary.

Aceternity UI may be used as:
- inspiration
- source code
- starting point for interactive effects

Do not blindly copy its visual style.

Adapt components to the design language of this application.

## Layout

Avoid automatically creating a conventional SaaS layout with:

sidebar + top navbar + grid of cards

unless the information architecture genuinely requires it.

Explore layouts using:
- layered navigation
- floating controls
- spatial grouping
- asymmetric composition
- depth
- contextual panels
- progressive disclosure

Functional clarity still takes priority over novelty.

## Animation

Animations should communicate state and spatial relationships.

Good:
- element responds to pointer position
- object moves forward when focused
- panels transition between depth levels
- navigation communicates where content came from
- hover reveals physicality

Bad:
- animation solely because animation looks impressive
- everything floating continuously
- excessive spring animations
- long page transitions
- motion that slows down common actions

Keep frequently repeated interactions fast.

## Implementation Rules

Before creating a new UI component:

1. Check whether an existing component can be reused.
2. Consider whether 3D/depth adds useful interaction or hierarchy.
3. Avoid adding another generic Card component.
4. Keep the component editable through Tailwind classes.
5. Avoid unnecessary dependencies.

When generating a page, do not independently invent a generic SaaS design.

Follow the existing visual language in the codebase.

If existing pages establish a pattern, extend that pattern instead of
introducing a new design system.

## Reference Direction

Useful references include:

- Aceternity UI
- React Three Fiber
- Three.js
- Spline
- experimental interactive web design
- game UI
- spatial interfaces

Use these as inspiration rather than copying them wholesale.

The target should feel closer to an intentionally designed interactive
product than a generated SaaS template.

## Priority

When requirements conflict, use this priority:

1. Usability
2. Functional correctness
3. Existing project design language
4. 3D / spatial visual identity
5. Visual novelty