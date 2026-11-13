import type { CardInstance } from "@/shared/domain";
import { shuffle, hash } from "@/shared/random";
export interface Piles {
  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  exhaust: CardInstance[];
}
export function makePiles(cards: CardInstance[], seed: string): Piles {
  return {
    draw: shuffle(cards, hash(seed)),
    hand: [],
    discard: [],
    exhaust: [],
  };
}
export function drawCards(p: Piles, n: number, seed: number) {
  for (let i = 0; i < n; i++) {
    if (!p.draw.length && p.discard.length) {
      p.draw = shuffle(p.discard, seed + i);
      p.discard = [];
    }
    const card = p.draw.pop();
    if (card) p.hand.push(card);
  }
}
export function discardHand(p: Piles) {
  p.discard.push(...p.hand);
  p.hand = [];
}
/**
 * 角色倒下时，把其仍在抽牌堆、手牌、弃牌堆中的专属牌全部移入消耗，
 * 保证倒下角色本场不能再行动、不会再被抽到。
 */
export function exhaustOwnedCards(p: Piles, ownerId: string): number {
  const take = (pile: CardInstance[]) => {
    const owned = pile.filter((c) => c.ownerId === ownerId);
    if (owned.length) {
      p.exhaust.push(...owned);
      const rest = pile.filter((c) => c.ownerId !== ownerId);
      pile.length = 0;
      pile.push(...rest);
    }
    return owned.length;
  };
  return take(p.draw) + take(p.hand) + take(p.discard);
}
