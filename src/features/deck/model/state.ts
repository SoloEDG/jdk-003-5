import { reactive, readonly } from "vue";
import { starter, createCard, canRemove } from "../lib/collection";
import { upgradeCost, removalCost, campHealing } from "../lib/costs";
import type { CardInstance, ExpeditionSummary } from "@/shared/domain";
import { HERO_ID } from "@/shared/domain";
const state = reactive({
  cards: starter(),
  hero: { hp: 72, maxHp: 72, gold: 80, scars: 0 } as ExpeditionSummary,
  removals: 0,
  campUsed: false,
  selected: "",
});
export const deckState = readonly(state);
export function deckCards(): CardInstance[] {
  return state.cards.map((c) => ({ ...c }));
}
/** 出战牌堆：只保留旅人与仍在队且未倒下同伴的牌 */
export function battleDeck(activeCompanionIds: string[]): CardInstance[] {
  const allowed = new Set([HERO_ID, ...activeCompanionIds]);
  return state.cards
    .filter((c) => allowed.has(c.ownerId))
    .map((c) => ({ ...c }));
}
export function addCard(key: string, ownerId: string = HERO_ID) {
  state.cards.push(createCard(key, ownerId));
}
/** 同伴离队时带走其全部专属牌，返回被带走的卡牌 id（先解除战斗牌堆引用的前提） */
export function removeCardsByOwner(ownerId: string): string[] {
  const removed = state.cards.filter((c) => c.ownerId === ownerId);
  state.cards = state.cards.filter((c) => c.ownerId !== ownerId);
  if (state.selected && removed.some((c) => c.id === state.selected))
    state.selected = "";
  return removed.map((c) => c.id);
}
/** 强化某同伴（或旅人）的全部未强化专属牌，用于「凝神演练」成长 */
export function upgradeOwnedCards(ownerId: string): number {
  let count = 0;
  for (const c of state.cards) {
    if (c.ownerId === ownerId && !c.upgraded) {
      c.upgraded = true;
      count++;
    }
  }
  return count;
}
export function spendGold(amount: number) {
  if (!Number.isFinite(amount) || amount < 0 || amount > state.hero.gold)
    return false;
  state.hero.gold -= amount;
  return true;
}
export function earnGold(amount: number) {
  state.hero.gold += Math.max(0, amount);
}
export function setHp(hp: number) {
  state.hero.hp = Math.min(state.hero.maxHp, Math.max(0, hp));
}
export function heal(amount: number) {
  setHp(state.hero.hp + amount);
}
export function selectCard(id: string) {
  state.selected = id;
}
export function upgradeCard(id: string, free = false) {
  const c = state.cards.find((c) => c.id === id);
  if (!c || c.upgraded) return false;
  if (!free && !spendGold(upgradeCost(c.upgraded, state.hero.scars)))
    return false;
  c.upgraded = true;
  return true;
}
export function removeCard(id: string) {
  if (
    !canRemove(state.cards.length) ||
    !state.cards.some((c) => c.id === id) ||
    !spendGold(removalCost(state.removals))
  )
    return false;
  state.cards = state.cards.filter((c) => c.id !== id);
  state.removals++;
  state.selected = "";
  return true;
}
export function openCamp() {
  state.campUsed = false;
}
export function useCamp(action: "rest" | "upgrade", heat: number) {
  if (state.campUsed) return false;
  if (action === "rest") heal(campHealing(state.hero.maxHp, heat));
  else if (!upgradeCard(state.selected, true)) return false;
  state.campUsed = true;
  return true;
}
export function exportDeck() {
  return JSON.parse(
    JSON.stringify({
      cards: state.cards,
      hero: state.hero,
      removals: state.removals,
      campUsed: state.campUsed,
    }),
  );
}
export function restoreDeck(d: ReturnType<typeof exportDeck>) {
  state.cards = d.cards.map((c: CardInstance) => ({
    ...c,
    // 兼容旧存档：无归属信息的牌默认属于旅人
    ownerId: c.ownerId ?? HERO_ID,
  }));
  state.hero = d.hero;
  state.removals = d.removals;
  state.campUsed = d.campUsed;
  state.selected = "";
}
export function resetDeck() {
  state.cards = starter();
  state.hero = { hp: 72, maxHp: 72, gold: 80, scars: 0 };
  state.removals = 0;
  state.campUsed = false;
  state.selected = "";
}
