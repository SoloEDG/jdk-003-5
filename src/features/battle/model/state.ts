import { reactive, readonly } from "vue";
import type {
  Actor,
  BattleResult,
  CardInstance,
  JourneyContext,
} from "@/shared/domain";
import { cards } from "@/shared/cards";
import { uid } from "@/shared/random";
import { spawnEnemy, enemyIntent, type Enemy } from "../lib/enemies";
import { makePiles, drawCards, discardHand, type Piles } from "../lib/piles";
import {
  resolveEffect,
  poisonTick,
  damage,
  type EffectEvent,
} from "../lib/effects";
interface BattleState {
  id: string;
  context: JourneyContext | null;
  hero: Actor;
  enemy: Enemy | null;
  piles: Piles;
  energy: number;
  turn: number;
  phase: "idle" | "playing" | "won" | "lost";
  queue: EffectEvent[];
  log: string[];
  result: BattleResult | null;
}
const emptyHero = (): Actor => ({
  hp: 72,
  maxHp: 72,
  block: 0,
  strength: 0,
  poison: 0,
  thorns: 0,
});
const state = reactive<BattleState>({
  id: "",
  context: null,
  hero: emptyHero(),
  enemy: null,
  piles: makePiles([], ""),
  energy: 3,
  turn: 1,
  phase: "idle",
  queue: [],
  log: [],
  result: null,
});
export const battleState = readonly(state);
export function beginBattle(
  context: JourneyContext,
  deck: CardInstance[],
  hp: number,
  maxHp: number,
) {
  state.id = uid("battle");
  state.context = context;
  state.hero = { ...emptyHero(), hp, maxHp };
  state.enemy = spawnEnemy(context);
  state.piles = makePiles(deck, context.nodeId);
  state.energy = 3;
  state.turn = 1;
  state.phase = "playing";
  state.queue = [];
  state.result = null;
  state.log = ["战斗开始。状态和牌堆仅属于本场遭遇。"];
  drawCards(state.piles, 5, 1);
}
function finish() {
  if (!state.enemy || !state.context) return;
  if (state.hero.hp <= 0 || state.enemy.hp <= 0) {
    state.phase = state.hero.hp <= 0 ? "lost" : "won";
    state.result = {
      id: state.id,
      nodeId: state.context.nodeId,
      won: state.phase === "won",
      hp: state.hero.hp,
      gold: state.enemy.reward,
      context: JSON.parse(JSON.stringify(state.context)),
    };
    state.queue = [];
  }
}
function drain() {
  while (state.queue.length && state.phase === "playing") {
    const event = state.queue.shift()!;
    if (event.effect.type === "draw") {
      drawCards(state.piles, event.effect.amount, state.turn);
      state.log.unshift(`抽取 ${event.effect.amount} 张牌`);
    } else if (event.effect.type === "energy") {
      state.energy += event.effect.amount;
    } else if (state.enemy)
      state.log.unshift(resolveEffect(event, state.hero, state.enemy));
    finish();
  }
  state.log = state.log.slice(0, 18);
}
export function playCard(id: string) {
  if (state.phase !== "playing") return false;
  const card = state.piles.hand.find((c) => c.id === id);
  if (!card) return false;
  const spec = cards[card.key]!;
  if (state.energy < spec.cost) return false;
  state.energy -= spec.cost;
  state.piles.hand = state.piles.hand.filter((c) => c.id !== id);
  (spec.kind === "power" ? state.piles.exhaust : state.piles.discard).push(
    card,
  );
  state.queue.push(
    ...spec.effects.map((e) => ({
      effect: {
        ...e,
        amount: e.amount + (card.upgraded && e.type !== "energy" ? 2 : 0),
      },
      source: "hero" as const,
      label: spec.name,
    })),
  );
  drain();
  return true;
}
export function endTurn() {
  if (state.phase !== "playing" || !state.enemy) return;
  const poison = poisonTick(state.enemy);
  if (poison) state.log.unshift(`敌人中毒失去 ${poison} 生命`);
  finish();
  if (state.phase !== "playing") return;
  const amount = enemyIntent(state.enemy, state.turn);
  damage(state.hero, amount);
  state.log.unshift(`敌人攻击 ${amount}`);
  poisonTick(state.hero);
  finish();
  if (state.phase !== "playing") return;
  discardHand(state.piles);
  state.turn++;
  state.energy = 3;
  state.hero.block = 0;
  state.enemy.block = state.turn % 3 === 0 ? 5 : 0;
  drawCards(state.piles, 5, state.turn);
}
export function currentIntent() {
  return state.enemy ? enemyIntent(state.enemy, state.turn) : 0;
}
export function exportBattle() {
  return JSON.parse(JSON.stringify(state)) as BattleState;
}
export function restoreBattle(d: BattleState) {
  Object.assign(state, d);
}
export function resetBattle() {
  state.phase = "idle";
  state.context = null;
  state.enemy = null;
  state.result = null;
  state.piles = makePiles([], "");
  state.log = [];
}
