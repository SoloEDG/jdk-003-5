import type { CardSpec } from "./domain";
export const cards: Record<string, CardSpec> = {
  strike: {
    key: "strike",
    name: "余烬斩",
    cost: 1,
    kind: "attack",
    text: "造成 7 伤害。力量加成。",
    rarity: "common",
    effects: [{ type: "damage", amount: 7, target: "enemy" }],
  },
  guard: {
    key: "guard",
    name: "铁叶护身",
    cost: 1,
    kind: "skill",
    text: "获得 7 格挡。",
    rarity: "common",
    effects: [{ type: "block", amount: 7, target: "hero" }],
  },
  venom: {
    key: "venom",
    name: "孢子飞刃",
    cost: 1,
    kind: "attack",
    text: "造成 4 伤害，施加 4 中毒。",
    rarity: "common",
    effects: [
      { type: "damage", amount: 4, target: "enemy" },
      { type: "poison", amount: 4, target: "enemy" },
    ],
  },
  focus: {
    key: "focus",
    name: "余火冥想",
    cost: 0,
    kind: "skill",
    text: "抽 2 张牌，获得 1 能量。",
    rarity: "rare",
    effects: [
      { type: "draw", amount: 2, target: "hero" },
      { type: "energy", amount: 1, target: "hero" },
    ],
  },
  fury: {
    key: "fury",
    name: "烈焰誓约",
    cost: 1,
    kind: "power",
    text: "本场力量 +3，回复 2 生命。",
    rarity: "rare",
    effects: [
      { type: "strength", amount: 3, target: "hero" },
      { type: "heal", amount: 2, target: "hero" },
    ],
  },
  burst: {
    key: "burst",
    name: "陨火",
    cost: 2,
    kind: "attack",
    text: "造成 17 伤害。",
    rarity: "rare",
    effects: [{ type: "damage", amount: 17, target: "enemy" }],
  },
  shelter: {
    key: "shelter",
    name: "林地庇护",
    cost: 1,
    kind: "skill",
    text: "获得 5 格挡，回复 3 生命。",
    rarity: "common",
    effects: [
      { type: "block", amount: 5, target: "hero" },
      { type: "heal", amount: 3, target: "hero" },
    ],
  },
};
export function cardLabel(key: string) {
  return cards[key]?.name ?? key;
}
