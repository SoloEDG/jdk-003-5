import type { JourneyContext } from "@/shared/domain";
import { shuffle, hash } from "@/shared/random";
import { companionSpecs, supplySpecs, partyState } from "@/features/party";
export interface StockItem {
  id: string;
  kind: "card" | "supply";
  card?: string;
  supply?: "draught" | "ration" | "tonic";
  companionId?: string;
  basePrice: number;
  sold: boolean;
}
export function makeStock(c: JourneyContext): StockItem[] {
  const items: StockItem[] = shuffle(
    ["venom", "focus", "fury", "burst", "shelter", "guard"],
    hash(c.nodeId),
  )
    .slice(0, 3)
    .map((card, i) => ({
      id: `${c.nodeId}-stock-${i}`,
      kind: "card" as const,
      card,
      basePrice: ["fury", "burst", "focus"].includes(card) ? 48 : 32,
      sold: false,
    }));
  // 同伴专属补给与稀有专属牌：只服务于当前在队同伴，离队后不再出现
  const roster = Object.values(companionSpecs).filter((spec) =>
    partyState.roster.some((m) => m.id === spec.id),
  );
  roster.forEach((spec, i) => {
    const seed = hash(`${c.nodeId}-${spec.id}`);
    const supplyKinds = ["draught", "ration", "tonic"] as const;
    const supplyKind = supplyKinds[seed % supplyKinds.length]!;
    items.push({
      id: `${c.nodeId}-supply-${i}`,
      kind: "supply",
      supply: supplyKind,
      companionId: spec.id,
      basePrice: supplySpecs[supplyKind].basePrice,
      sold: false,
    });
  });
  roster.forEach((spec, i) => {
    const card = spec.id === "lumen" ? "lumenSurge" : "ranaCleave";
    items.push({
      id: `${c.nodeId}-mate-card-${i}`,
      kind: "card",
      card,
      companionId: spec.id,
      basePrice: 55,
      sold: false,
    });
  });
  return items;
}
