import { reactive, readonly } from "vue";
import type {
  AllySnapshot,
  Companion,
  CompanionSpec,
  GrowthKind,
  GrowthOffer,
  Supply,
  SupplyKind,
} from "@/shared/domain";
import { uid } from "@/shared/random";
import {
  companionSpecs,
  growthLabels,
  makeGrowthOffer,
  supplySpecs,
} from "../lib/companions";

interface PartyState {
  roster: Companion[];
  pendingGrowth: GrowthOffer[];
  pendingSupplies: Supply[];
  /** 已离队同伴的痕迹，仅用于结算提示，不再参与任何战斗或抽牌 */
  dismissed: { id: string; name: string; sigil: string }[];
}

const state = reactive<PartyState>({
  roster: [],
  pendingGrowth: [],
  pendingSupplies: [],
  dismissed: [],
});

export const partyState = readonly(state);

export function companionById(id: string): Companion | undefined {
  return state.roster.find((c) => c.id === id);
}

export function companionName(id: string): string {
  if (id === "hero") return "余烬旅人";
  return (
    companionById(id)?.name ??
    state.dismissed.find((d) => d.id === id)?.name ??
    id
  );
}

export function isActiveCompanion(id: string): boolean {
  return state.roster.some((c) => c.id === id);
}

/** 当前可出战（未倒下）的同伴 id；倒下同伴的牌不进入战斗抽牌池 */
export function activeCompanionIds(): string[] {
  return state.roster.filter((c) => !c.downed).map((c) => c.id);
}

export function recruit(spec: CompanionSpec): Companion {
  const mate: Companion = {
    id: spec.id,
    name: spec.name,
    sigil: spec.sigil,
    hp: spec.maxHp,
    maxHp: spec.maxHp,
    downed: false,
    growth: 0,
  };
  state.roster.push(mate);
  return { ...mate };
}

/** 战斗结束后，把每名同伴的生命与倒下状态写回队伍（倒下状态战后保留） */
export function writeBattleResult(result: {
  allies: ReadonlyArray<AllySnapshot>;
}) {
  for (const snap of result.allies) {
    const mate = companionById(snap.id);
    if (!mate) continue;
    mate.hp = Math.max(0, Math.min(mate.maxHp, snap.hp));
    mate.downed = snap.downed || snap.hp <= 0;
  }
}

export function healCompanion(id: string, amount: number) {
  const mate = companionById(id);
  if (!mate || mate.downed) return 0;
  const before = mate.hp;
  mate.hp = Math.min(mate.maxHp, mate.hp + Math.max(0, amount));
  return mate.hp - before;
}

export function bumpMaxHp(id: string, amount: number) {
  const mate = companionById(id);
  if (!mate) return;
  mate.maxHp += amount;
  if (!mate.downed) mate.hp = Math.min(mate.maxHp, mate.hp + amount);
}

/** 在篝火支付金币救治倒下同伴；未倒下或金币不足返回 false */
export function reviveCost(id: string): number {
  return 40;
}

export function canRevive(id: string, gold: number): boolean {
  const mate = companionById(id);
  return !!mate && mate.downed && gold >= reviveCost(id);
}

/**
 * 救治成功：解除倒下并回复部分生命。调用方负责先扣金币。
 */
export function revive(id: string): boolean {
  const mate = companionById(id);
  if (!mate || !mate.downed) return false;
  mate.downed = false;
  mate.hp = Math.max(1, Math.floor(mate.maxHp * 0.5));
  return true;
}

/** 战斗胜利后，为每名仍在队伍中的同伴生成一份待领取成长 */
export function openGrowthFromBattle(
  battleId: string,
  kinds: GrowthKind[],
): GrowthOffer[] {
  const offers: GrowthOffer[] = [];
  state.roster.forEach((mate, index) => {
    const kind = kinds[index % kinds.length] ?? "vitality";
    const offer = makeGrowthOffer(mate.id, kind, battleId);
    state.pendingGrowth.push(offer);
    offers.push(offer);
  });
  return offers;
}

export type GrowthAction =
  | { kind: "vitality"; companionId: string; amount: number }
  | { kind: "focus"; companionId: string }
  | { kind: "drill"; companionId: string; cardKey: string };

/** 领取成长：更新同伴自身数据，并返回需要由牌组模块执行的动作 */
export function claimGrowth(offerId: string): GrowthAction | null {
  const idx = state.pendingGrowth.findIndex((o) => o.id === offerId);
  if (idx < 0) return null;
  const offer = state.pendingGrowth[idx]!;
  const mate = companionById(offer.companionId);
  if (!mate) {
    // 同伴已离队：其待领取成长必须先被解除，这里兜底清除
    state.pendingGrowth.splice(idx, 1);
    return null;
  }
  state.pendingGrowth.splice(idx, 1);
  mate.growth += 1;
  if (offer.kind === "vitality") {
    mate.maxHp += 6;
    mate.hp = Math.min(mate.maxHp, mate.hp + (mate.downed ? 0 : 6));
    return { kind: "vitality", companionId: mate.id, amount: 6 };
  }
  if (offer.kind === "focus") {
    return { kind: "focus", companionId: mate.id };
  }
  const cardKey = mate.id === "lumen" ? "lumenSurge" : "ranaCleave";
  return { kind: "drill", companionId: mate.id, cardKey };
}

export function makeSupply(kind: SupplyKind, companionId: string, price: number): Supply {
  return {
    id: uid("supply"),
    kind,
    companionId,
    name: supplySpecs[kind].name,
    pricePaid: price,
  };
}
/** 商店购买完成后，把已付费补给存入待领取行囊 */
export function stashSupply(supply: Supply) {
  state.pendingSupplies.push(supply);
}

export type SupplyEffect =
  | { type: "heal"; companionId: string; amount: number }
  | { type: "maxhp"; companionId: string; amount: number; heal: number };

/** 领取已购买的补给；倒下同伴无法使用，已离队同伴的补给应在离队时退款移除 */
export function claimSupply(supplyId: string): SupplyEffect | null {
  const idx = state.pendingSupplies.findIndex((s) => s.id === supplyId);
  if (idx < 0) return null;
  const supply = state.pendingSupplies[idx]!;
  const mate = companionById(supply.companionId);
  if (!mate || mate.downed) return null;
  state.pendingSupplies.splice(idx, 1);
  if (supply.kind === "draught")
    return { type: "heal", companionId: mate.id, amount: 14 };
  if (supply.kind === "ration")
    return { type: "heal", companionId: mate.id, amount: 8 };
  bumpMaxHp(mate.id, 2);
  return { type: "maxhp", companionId: mate.id, amount: 2, heal: 5 };
}

export interface DismissReport {
  companionId: string;
  cardIds: string[];
  growthOfferIds: string[];
  refund: number;
}

/**
 * 同伴离队：
 * 1. 由牌组模块先移除其全部专属牌（调用方负责，cardIds 在此汇总提示）；
 * 2. 解除待领取成长引用；
 * 3. 已付费未领取的补给按原价退款并移除。
 * 刷新恢复后该同伴不会再出现在战斗牌堆或共享生命中。
 */
export function dismissCompanion(
  id: string,
  cardIds: string[],
): DismissReport | null {
  const mate = companionById(id);
  if (!mate) return null;
  const growthOfferIds = state.pendingGrowth
    .filter((o) => o.companionId === id)
    .map((o) => o.id);
  state.pendingGrowth = state.pendingGrowth.filter(
    (o) => o.companionId !== id,
  );
  const refund = state.pendingSupplies
    .filter((s) => s.companionId === id)
    .reduce((sum, s) => sum + s.pricePaid, 0);
  state.pendingSupplies = state.pendingSupplies.filter(
    (s) => s.companionId !== id,
  );
  state.roster = state.roster.filter((c) => c.id !== id);
  state.dismissed.push({ id: mate.id, name: mate.name, sigil: mate.sigil });
  return { companionId: id, cardIds, growthOfferIds, refund };
}

export function exportParty() {
  return JSON.parse(JSON.stringify(state)) as PartyState;
}

export function restoreParty(d: PartyState) {
  state.roster = d.roster ?? [];
  state.pendingGrowth = d.pendingGrowth ?? [];
  state.pendingSupplies = d.pendingSupplies ?? [];
  state.dismissed = d.dismissed ?? [];
}

export function resetParty() {
  state.roster = [];
  state.pendingGrowth = [];
  state.pendingSupplies = [];
  state.dismissed = [];
}
/** 测试专用：模拟商店已付费补给进入待领取 */
export function __stashSupplyForTest(supply: Supply) {
  state.pendingSupplies.push(supply);
}

export { companionSpecs, growthLabels };
