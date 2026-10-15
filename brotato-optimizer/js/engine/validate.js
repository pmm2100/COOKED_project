// Build rules: item stack limits, copy limit, slots, budget, duplicate weapons.
export const canAddItem = (st, it, cfg) => st.nItems < cfg.maxItems &&
  (st.items[it.id] ?? 0) < Math.min(it.maxStack ?? Infinity, cfg.maxCopies) && st.price + it.price <= cfg.maxPrice;
export const canAddWeapon = (st, w, tier, cfg) => (cfg.allowDup || !st.weapons.some((x) => x.id === w.id)) &&
  st.price + w.price[tier - 1] <= cfg.maxPrice;
