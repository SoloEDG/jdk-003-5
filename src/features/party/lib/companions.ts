import type {
  CompanionSpec,
  GrowthKind,
  GrowthOffer,
  SupplyKind,
} from "@/shared/domain";
import { uid } from "@/shared/random";
/**
 * 可在路线招募节点遇见的同伴名册。
 * 每名同伴带独立生命、专属起始牌，入队后其专属牌进入战斗抽牌池。
 */
export const companionSpecs: Record<string, CompanionSpec> = {
  lumen: {
    id: "lumen",
    name: "流明",
    sigil: "✧",
    maxHp: 42,
    title: "静电游学者",
    description:
      "带着火花装置的游学者。专属牌围绕中毒与护盾，适合消耗与续航。",
    recruitNodeId: "n2-0",
    starterCards: ["lumenJolt", "lumenJolt", "lumenWard"],
  },
  rana: {
    id: "rana",
    name: "拉娜",
    sigil: "🪓",
    maxHp: 56,
    title: "裂甲佣兵",
    description:
      "从熔炉边境退役的佣兵。专属牌偏重高伤与力量成长，是可靠的前排。",
    recruitNodeId: "n5-0",
    starterCards: ["ranaHack", "ranaHack", "ranaBellow"],
  },
};
export function specForNode(nodeId: string): CompanionSpec | null {
  return (
    Object.values(companionSpecs).find((s) => s.recruitNodeId === nodeId) ??
    null
  );
}
export const growthLabels: Record<GrowthKind, string> = {
  vitality: "生命训练 · 最大生命 +6 并回复 6",
  focus: "凝神演练 · 专属牌强化（本战之外永久生效）",
  drill: "携牌同行 · 获得一张该同伴的稀有专属牌",
};
export function makeGrowthOffer(
  companionId: string,
  kind: GrowthKind,
  sourceBattleId: string,
): GrowthOffer {
  return {
    id: uid("growth"),
    companionId,
    kind,
    label: growthLabels[kind],
    sourceBattleId,
  };
}
export interface SupplySpec {
  kind: SupplyKind;
  name: string;
  description: string;
  basePrice: number;
}
export const supplySpecs: Record<SupplyKind, SupplySpec> = {
  draught: {
    kind: "draught",
    name: "复苏药饮",
    description: "使用后该同伴回复 14 点生命（不会解除倒下，倒下需在篝火救治）。",
    basePrice: 30,
  },
  ration: {
    kind: "ration",
    name: "旅途口粮",
    description: "使用后该同伴回复 8 点生命。",
    basePrice: 18,
  },
  tonic: {
    kind: "tonic",
    name: "净化秘药",
    description: "使用后该同伴回复 5 点生命，并永久获得 2 点最大生命。",
    basePrice: 38,
  },
};
