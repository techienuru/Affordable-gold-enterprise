# Affordable Gold Enterprise Design System

This file is the visual source of truth for the shop. It is inspired by warm food-retail systems, then adapted to Affordable Gold Enterprise's yellow-and-green identity and Nigerian customers shopping mainly on mobile data.

## 1. Brand feeling

The shop should feel warm, honest and useful: food from a trusted local seller, presented clearly enough that a customer can decide quickly on a phone.

Use the visual language of a welcoming market counter:

- Gold signals the brand, honey and value.
- Green signals freshness, availability and delivery confidence.
- Warm paper backgrounds keep the shop human and calm.
- Product photography carries the selling work whenever it is available.
- Copy stays plain, specific and short.

Avoid a dark technology look, glass effects, loud gradients and generic dashboard cards.

## 2. Colour roles

| Token | Value | Purpose |
| --- | --- | --- |
| `gold` | `#c89b3c` | Primary brand colour, main buttons and key highlights |
| `gold-deep` | `#8a641c` | Strong gold text and active accents |
| `gold-soft` | `#f6e8bd` | Highlight panels and product artwork backgrounds |
| `green` | `#276749` | Secondary brand colour, trust and availability |
| `green-deep` | `#17462f` | Strong green surfaces and footer |
| `green-soft` | `#e4f0e8` | Delivery and availability backgrounds |
| `ink` | `#1c1a17` | Primary text and text on gold |
| `ink-soft` | `#625c53` | Secondary text |
| `paper` | `#fffdf8` | Page background |
| `surface` | `#ffffff` | Cards and raised content |
| `line` | `#e8e0d0` | Borders and separators |
| `danger` | `#a53a2a` | Errors and unavailable states |

Never place white text on the gold. Use ink text on gold for readable contrast. White text is reserved for deep green surfaces.

## 3. Typography

- Display and product headings: Rubik, 600–700 weight.
- Body, buttons and labels: Nunito Sans, 400–700 weight.
- Prices use Rubik with tabular numbers where supported.
- Body text starts at 16px with at least 1.5 line height.
- Small utility labels never go below 12px.
- Headlines use sentence case, not all caps.

## 4. Shape, spacing and depth

- Use a 4px/8px spacing rhythm.
- Page gutters: 20px on phones, 32px on tablets, 48px on desktop.
- Maximum content width: 1180px.
- Product cards: 20px radius.
- Buttons and filters: full pill radius.
- Inputs and ordinary panels: 12–16px radius.
- Prefer a visible border and a small warm shadow over floating glass effects.
- Main buttons are at least 48px high.

## 5. Layout

The catalogue is mobile-first:

```text
[ brand                 delivery note ]
[ warm gold shop introduction          ]
[ category filters                      ]
[ product card                          ]
[ product card                          ]
[ trust and delivery strip              ]
```

At wider sizes, products become a two- and then three-column grid. Product detail pages become a balanced image-and-information split.

## 6. Signature element

Use a simple “market stamp” motif: a green outlined circle crossing the edge of a gold panel, paired with a small leaf mark. It should appear in the catalogue hero and nowhere else. This connects honey, farm produce and the brand colours without decorative clutter.

## 7. Components

### Header

- Compact and calm.
- Brand mark at the left, current destination at the right.
- Use text with a small vector mark; do not invent a complex logo.

### Primary button

- Gold background, ink text, 48px minimum height.
- Darker gold on hover.
- Strong green focus ring.
- Disabled buttons remain readable and clearly inactive.

### Secondary button

- Transparent or white background, green border and green text.
- Same height and radius as the primary button.

### Product card

- White surface with a warm border.
- Image area keeps a fixed aspect ratio to prevent page movement.
- Category label, product name, unit and price have a clear reading order.
- The whole card does not pretend to be clickable; use a clear “View product” link.
- Out-of-stock products state this in words, not colour alone.

### Category filter

- Wrap on small screens instead of forcing page-level horizontal scrolling.
- Selected state uses deep green with white text.
- Expose selection with `aria-pressed`.

### Status panel

- Explain loading, empty and error states in customer language.
- Error panels include a clear retry action where possible.

### Cart

- Keep cart rows simple: photo, name, unit, quantity and line total.
- Quantity controls use labelled 48px buttons and always show the current number.
- The subtotal sits in a bordered white summary panel; delivery is clearly excluded until checkout.
- Cart contents may be remembered in the browser, but all prices and stock must be checked again by the server during checkout.
- Empty carts direct customers back to the shop.

## 8. Product imagery

- Use real product photos when an `image_url` exists.
- Lazy-load catalogue images.
- Supply useful alt text.
- When no photo exists, use the branded product illustration placeholder; never show a broken image.
- Prefer compressed WebP or AVIF photos when uploading products later.

## 9. Motion

- Keep motion subtle: 160–220ms for hover and pressed feedback.
- Do not animate layout dimensions.
- Avoid automatic carousels and parallax.
- Respect `prefers-reduced-motion`.

## 10. Responsive and accessibility rules

- Test at 375px, 768px, 1024px and 1440px.
- No page-level horizontal scrolling.
- All controls must be usable by keyboard.
- Focus rings must remain visible.
- Meaningful text must meet 4.5:1 contrast.
- Touch targets are at least 44px, preferably 48px.
- Colour never carries status by itself.
- Images have alt text; decorative SVG shapes are hidden from assistive technology.

## 11. Voice

Write like a helpful local shopkeeper:

- “See product” rather than “Explore now”.
- “Available” rather than “In stock inventory”.
- “We deliver across Nigeria” rather than broad marketing claims.
- Errors say what happened and what the customer can do next.

## 12. Guardrails

Do:

- Let products and prices stay prominent.
- Use gold for decisive actions and green for reassurance.
- Keep mobile pages fast and uncluttered.
- Reuse these tokens in every future screen.

Do not:

- Use emoji as interface icons.
- Add fake reviews, fake discounts or urgency messages.
- Use white text on the brand gold.
- Add hover-only information.
- Mix unrelated border radii, shadows or icon styles.
