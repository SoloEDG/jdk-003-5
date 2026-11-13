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
