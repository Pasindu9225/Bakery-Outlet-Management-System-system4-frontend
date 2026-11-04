// Rotating colours for POS product tiles, so neighbouring items are easy to tell apart at a glance.
// Theme tokens only (they follow light/dark); red is left out because it means out of stock.
const TILE_COLORS = [
    { tint: "bg-brand/10", stripe: "bg-brand-fg", edge: "border-l-brand-fg" },
    { tint: "bg-plum/10", stripe: "bg-plum-solid", edge: "border-l-plum-solid" },
    { tint: "bg-success/10", stripe: "bg-success-solid", edge: "border-l-success-solid" },
    { tint: "bg-warning/10", stripe: "bg-warning-solid", edge: "border-l-warning-solid" },
    { tint: "bg-info/10", stripe: "bg-info-solid", edge: "border-l-info-solid" },
    { tint: "bg-subtle", stripe: "bg-neutral-solid", edge: "border-l-neutral-solid" },
];

export const tileColor = (index) => TILE_COLORS[((index % TILE_COLORS.length) + TILE_COLORS.length) % TILE_COLORS.length];
