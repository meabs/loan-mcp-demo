# Game Design

## Promise

Run a tiny village bookshop, talk to an unusual customer, and see whether your recommendation is better than ChatGPT's.

## Vertical Slice

The first encounter features Edith Vale, a retired teacher with dry humour. She wants something adventurous, but nothing involving boats.

The player can:

- start an anonymous game
- name the shop
- choose cottage, woodland, or seaside style
- ask Edith one question
- choose from three fictional books
- explain the recommendation
- let Avery Quill make a rival recommendation
- resolve the encounter deterministically
- see coins, reputation, and relationship changes

## Books

- `The Clockmaker's Map`: intended best fit.
- `Eleven Miles Underground`: plausible but darker and more intense.
- `Voyage of the Silver Heron`: explicit boat conflict.

## Visuals

The current build uses bundled pixel-art bookshop environment sprites from the Cozy Bookshop asset pack plus CSS-rendered portraits and book covers. Stable asset IDs are used so later sprite replacement does not require content rewrites.
