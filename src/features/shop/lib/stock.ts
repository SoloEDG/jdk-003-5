import type { JourneyContext } from "@/shared/domain";
import { shuffle, hash } from "@/shared/random";
export interface StockItem {
  id: string;
  card: string;
  basePrice: number;
  sold: boolean;
}
export function makeStock(c: JourneyContext): StockItem[] {
  return shuffle(
    ["venom", "focus", "fury", "burst", "shelter", "guard"],
    hash(c.nodeId),
  )
    .slice(0, 3)
    .map((card, i) => ({
      id: `${c.nodeId}-stock-${i}`,
      card,
      basePrice: ["fury", "burst", "focus"].includes(card) ? 48 : 32,
      sold: false,
    }));
}
