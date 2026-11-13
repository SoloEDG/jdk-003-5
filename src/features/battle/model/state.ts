import { reactive, readonly } from "vue";
import type {
  Actor,
  AllySnapshot,
  BattleResult,
  CardInstance,
  JourneyContext,
} from "@/shared/domain";
import { HERO_ID } from "@/shared/domain";
import { cards } from "@/shared/cards";
import { uid, hash } from "@/shared/random";
import { spawnEnemy, enemyIntent, type Enemy } from "../lib/enemies";
import {
  makePiles,
  drawCards,
  discardHand,
  exhaustOwnedCards,
  type Piles,
} from "../lib/piles";
import {
  resolveEffect,
  poisonTick,
  damage,
  type EffectEvent,
} from "../lib/effects";

export interface PartyInit {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}
interface BattleState {
  id: string;
  context: JourneyContext | null;
  party: Actor[];
  enemy: Enemy | null;
  /** 敌人当前攻击目标；每名角色独立生命，不会共享 */
  targetId: string;
  piles: Piles;
  energy: number;
  turn: number;
  phase: "idle" | "playing" | "won" | "lost";
  queue: EffectEvent[];
  log: string[];
  result: BattleResult | null;
}
const makeActor = (init: PartyInit): Actor => ({
  id: init.id,
  name: init.name,
  hp: init.hp,
  maxHp: init.maxHp,
  block: 0,
  strength: 0,
  poison: 0,
  thorns: 0,
  downed: init.hp <= 0,
});
const state = reactive<BattleState>({
  id: "",
  context: null,
  party: [],
  enemy: null,
  targetId: HERO_ID,
  piles: makePiles([], ""),
  energy: 3,
  turn: 1,
  phase: "idle",
  queue: [],
  log: [],
  result: null,
});
export const battleState = readonly(state);

export function heroActor(): Actor | undefined {
  return state.party.find((a) => a.id === HERO_ID);
}
export function allyActors(): Actor[] {
  return state.party.filter((a) => a.id !== HERO_ID);
}
export function currentTarget(): Actor | undefined {
  return state.party.find((a) => a.id === state.targetId && !a.downed);
}
function pickTarget(turn: number): string {
  const alive = state.party.filter((a) => !a.downed);
  if (!alive.length) return HERO_ID;
  const seed = hash(`${state.context?.nodeId ?? ""}-target-${turn}`);
  return alive[seed % alive.length]!.id;
}
/** 处理队伍中新倒下的角色：移出其本场所有牌，保证不再出牌 */
function handleDowns() {
  for (const actor of state.party) {
    if (actor.downed) {
      const moved = exhaustOwnedCards(state.piles, actor.id);
      if (moved)
        state.log.unshift(`${actor.name} 倒下，${moved} 张专属牌移出本场`);
    }
  }
}
export function beginBattle(
  context: JourneyContext,
  deck: CardInstance[],
  party: PartyInit[],
) {
  state.id = uid("battle");
  state.context = context;
  // 旅人始终在首位；同伴的当前生命由队伍状态传入，各自独立
  state.party = party.map(makeActor);
  state.enemy = spawnEnemy(context);
  state.piles = makePiles(deck, context.nodeId);
  state.targetId = pickTarget(1);
  state.energy = 3;
  state.turn = 1;
  state.phase = "playing";
  state.queue = [];
  state.result = null;
  state.log = ["战斗开始。队伍共用能量，生命与状态各自独立。"];
  const downed = state.party.filter((a) => a.downed).map((a) => a.name);
  if (downed.length)
    state.log.unshift(`${downed.join("、")} 处于倒下状态，本场无法行动`);
  drawCards(state.piles, 5, 1);
}
function buildResult(won: boolean): BattleResult {
  const allies: AllySnapshot[] = state.party
    .filter((a) => a.id !== HERO_ID)
    .map((a) => ({ id: a.id, hp: a.hp, downed: a.downed }));
  return {
    id: state.id,
    nodeId: state.context!.nodeId,
    won,
    hp: heroActor()?.hp ?? 0,
    gold: state.enemy!.reward,
    context: JSON.parse(JSON.stringify(state.context)),
    allies,
  };
}
function finish() {
  if (!state.enemy || !state.context || state.phase !== "playing") return;
  const hero = heroActor();
  const enemyDead = state.enemy.hp <= 0;
  const heroDowned = !hero || hero.downed || hero.hp <= 0;
  if (enemyDead || heroDowned) {
    state.phase = heroDowned ? "lost" : "won";
    state.result = buildResult(state.phase === "won");
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
    } else if (state.enemy) {
      state.log.unshift(resolveEffect(event, state.party, state.enemy));
    }
    handleDowns();
    finish();
  }
  state.log = state.log.slice(0, 18);
}
export function playCard(id: string) {
  if (state.phase !== "playing") return false;
  const card = state.piles.hand.find((c) => c.id === id);
  if (!card) return false;
  const owner = state.party.find((a) => a.id === card.ownerId);
  // 防御性检查：倒下角色的牌不应出现在手中
  if (!owner || owner.downed) return false;
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
      // 效果归属于出牌的角色，能量则由全队共用
      ownerId: card.ownerId,
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
  const target = currentTarget() ?? state.party.find((a) => !a.downed);
  if (target) {
    const amount = enemyIntent(state.enemy, state.turn);
    damage(target, amount);
    state.log.unshift(`敌人攻击 ${target.name}，造成 ${amount}`);
    handleDowns();
    finish();
  }
  if (state.phase !== "playing") return;
  for (const actor of state.party) {
    const lost = poisonTick(actor);
    if (lost) state.log.unshift(`${actor.name} 中毒失去 ${lost} 生命`);
  }
  handleDowns();
  finish();
  if (state.phase !== "playing") return;
  discardHand(state.piles);
  state.turn++;
  state.energy = 3;
  for (const actor of state.party) actor.block = 0;
  state.enemy.block = state.turn % 3 === 0 ? 5 : 0;
  state.targetId = pickTarget(state.turn);
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
  state.party = [];
  state.enemy = null;
  state.targetId = HERO_ID;
  state.result = null;
  state.piles = makePiles([], "");
  state.log = [];
}
/** 测试专用：直接让某角色倒下，用于验证倒下后的出牌与牌堆处理 */
export function __forceDownForTest(actorId: string) {
  const actor = state.party.find((a) => a.id === actorId);
  if (actor) {
    actor.hp = 0;
    actor.downed = true;
  }
  handleDowns();
}
