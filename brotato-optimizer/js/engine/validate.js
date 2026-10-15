// Build rules: item stack limits, copy limit, slots, budget, duplicate weapons.
export const ITEM_COPY_LIMITS = Object.freeze({ 1: 8, 2: 5, 3: 3, 4: 1 });

const maxCopiesFor = (it, cfg) => Math.min(
  it.maxStack ?? Infinity,
  ITEM_COPY_LIMITS[it.rarity] ?? Infinity,
  cfg.maxCopies,
);

export const canAddItem = (st, it, cfg) => st.nItems < cfg.maxItems &&
  (st.items[it.id] ?? 0) < maxCopiesFor(it, cfg) && st.price + it.price <= cfg.maxPrice;
export const canAddWeapon = (st, w, tier, cfg) => (cfg.allowDup || !st.weapons.some((x) => x.id === w.id)) &&
  st.price + w.price[tier - 1] <= cfg.maxPrice;
