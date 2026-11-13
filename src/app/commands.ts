import { enterRoute, resolveRoute, resetRoute } from "@/features/route";
import {
  battleState,
  beginBattle,
  playCard,
  endTurn,
  resetBattle,
  type PartyInit,
} from "@/features/battle";
import {
  deckState,
  battleDeck,
  addCard,
  removeCardsByOwner,
  upgradeOwnedCards,
  earnGold,
  spendGold,
  setHp,
  heal,
  upgradeCard,
  removeCard,
  openCamp,
  useCamp,
  resetDeck,
} from "@/features/deck";
import {
  openReward,
  claimReward,
  openCompanionGrowth,
  resetReward,
} from "@/features/reward";
import {
  openShop,
  preparePurchase,
  completePurchase,
  closeShop,
  resetShop,
} from "@/features/shop";
import {
  partyState,
  companionSpecs,
  recruit,
  writeBattleResult,
  revive,
  reviveCost,
  canRevive,
  claimGrowth,
  claimSupply,
  stashSupply,
  dismissCompanion,
  resetParty,
} from "@/features/party";
import {
  session,
  switchTab,
  setContext,
  notify,
  finishRun,
  resetSession,
} from "./session";
import { save, clearSave } from "./persistence";
function persist() {
  if (!save()) notify("本地保存失败，请保留当前页面。");
}
function buildPartyInit(): PartyInit[] {
  const list: PartyInit[] = [
    {
      id: "hero",
      name: "余烬旅人",
      hp: deckState.hero.hp,
      maxHp: deckState.hero.maxHp,
    },
  ];
  for (const mate of partyState.roster) {
    list.push({
      id: mate.id,
      name: mate.name,
      hp: mate.downed ? 0 : mate.hp,
      maxHp: mate.maxHp,
    });
  }
  return list;
}
export function navigate(id: string) {
  if (session.ended) return;
  const c = enterRoute(id);
  if (!c) return;
  setContext(c);
  if (c.kind === "shop") {
    openShop(c);
    switchTab("shop");
  } else if (c.kind === "camp") {
    openCamp();
    switchTab("deck");
  } else if (c.kind === "recruit") {
    switchTab("recruit");
  } else {
    // 出战牌堆只含旅人与未倒下同伴；倒下同伴的牌不会进入抽牌池
    const active = partyState.roster.filter((m) => !m.downed).map((m) => m.id);
    beginBattle(c, battleDeck(active), buildPartyInit());
    switchTab("battle");
  }
  notify(
    `进入 ${c.nodeId} · 威胁 ${c.influence.heat} / 好感 ${c.influence.favor}`,
  );
  persist();
}
export function acceptRecruit() {
  const c = session.context;
  if (!c || c.kind !== "recruit" || !c.companionId) return;
  const spec = companionSpecs[c.companionId];
  if (!spec) return;
  if (partyState.roster.some((m) => m.id === spec.id)) {
    notify(`${spec.name} 已经在队伍中。`);
  } else {
    recruit(spec);
    // 专属起始牌入队，归属该同伴
    for (const key of spec.starterCards) addCard(key, spec.id);
    notify(`${spec.name} 加入队伍，专属牌已进入战斗抽牌池。`);
  }
  resolveRoute();
  switchTab("route");
  persist();
}
export function declineRecruit() {
  const c = session.context;
  if (!c || c.kind !== "recruit") return;
  resolveRoute();
  switchTab("route");
  notify("你婉拒了篝火边的邀请。");
  persist();
}
export function play(id: string) {
  playCard(id);
  persist();
}
export function turn() {
  endTurn();
  persist();
}
export function settle() {
  const r = battleState.result;
  if (!r) return;
  // 先把同伴战后生命/倒下状态写回（倒下状态保留，不会自动复活）
  writeBattleResult(r);
  if (!r.won) {
    setHp(r.hp);
    finishRun();
    notify("这次旅途已经结束。重新启程可保留你的经验。");
    persist();
    return;
  }
  setHp(r.hp);
  if (openReward(JSON.parse(JSON.stringify(r)))) {
    openCompanionGrowth(JSON.parse(JSON.stringify(r)));
    switchTab("reward");
    notify("胜利！选择卡牌或同伴成长，金币都会结算。");
  }
  persist();
}
export function claim(skip: boolean) {
  const grant = claimReward(skip);
  if (!grant) return;
  if (grant.card) addCard(grant.card);
  earnGold(grant.gold);
  heal(grant.heal);
  resolveRoute();
  if (session.context?.kind === "boss") {
    finishRun();
    notify("裂隙已被封存。你把余烬带回了黎明。");
  } else notify("奖励已结算，新的路线开放。");
  switchTab("route");
  persist();
}
/** 领取同伴成长；牌组相关动作在此一并执行 */
export function takeGrowth(offerId: string) {
  const action = claimGrowth(offerId);
  if (!action) {
    notify("无法领取：同伴已离队或成长不存在。");
    return;
  }
  if (action.kind === "focus") {
    upgradeOwnedCards(action.companionId);
    notify("凝神演练完成，该同伴的专属牌已强化。");
  } else if (action.kind === "drill") {
    addCard(action.cardKey, action.companionId);
    notify("携牌同行：一张稀有专属牌加入牌组。");
  } else {
    notify("生命训练完成，最大生命提升。");
  }
  persist();
}
export function takeSupply(supplyId: string) {
  const effect = claimSupply(supplyId);
  if (!effect) {
    notify("无法使用：同伴已离队或正处于倒下状态。");
    return;
  }
  if (effect.type === "heal")
    notify(`补给生效，回复 ${effect.amount} 点生命。`);
  else notify(`秘药生效，最大生命 +${effect.amount} 并回复 ${effect.heal}。`);
  persist();
}
export function buy(id: string) {
  const order = preparePurchase(id);
  if (!order || !spendGold(order.price)) {
    notify("无法购买：库存、同伴状态或金币不足。");
    return;
  }
  const result = completePurchase(order);
  if (!result) {
    earnGold(order.price);
    return;
  }
  if (result.supply) {
    // 已付费补给进入待领取；离队会按已付费用退款
    stashSupply(result.supply);
    notify("交易完成，补给已放入待领取行囊。");
  } else if (result.card) {
    addCard(result.card, result.ownerId ?? "hero");
    notify("交易完成，卡牌已收入牌组。");
  }
  persist();
}
export function leaveShop() {
  closeShop();
  resolveRoute();
  switchTab("route");
  persist();
}
export function camp(action: "rest" | "upgrade") {
  if (
    !session.context ||
    session.context.kind !== "camp" ||
    !useCamp(action, session.context.influence.heat)
  )
    return;
  resolveRoute();
  notify("篝火逐渐熄灭，你准备好继续上路。");
  persist();
}
/** 在篝火支付金币救治倒下同伴（不占用篝火的休息/强化次数） */
export function rescue(id: string) {
  if (!canRevive(id, deckState.hero.gold)) {
    notify("无法救治：同伴未倒下或金币不足。");
    return;
  }
  const cost = reviveCost(id);
  if (!spendGold(cost)) {
    notify("金币不足，无法救治。");
    return;
  }
  if (!revive(id)) {
    earnGold(cost);
    return;
  }
  notify(`救治完成，消耗 ${cost} 金币，同伴重新站起。`);
  persist();
}
/** 同伴中途离队：先解除牌堆与待领取引用，再退款补给 */
export function leaveParty(id: string) {
  if (battleState.phase === "playing") {
    notify("战斗中无法让同伴离队。");
    return;
  }
  const mate = partyState.roster.find((m) => m.id === id);
  if (!mate) {
    notify("该同伴不在队伍中。");
    return;
  }
  // 1. 先从出战牌组（持久牌组）移除其专属牌，解除引用
  const cardIds = removeCardsByOwner(id);
  // 2. 解除待领取成长、补给，并结算退款
  const report = dismissCompanion(id, cardIds);
  if (!report) return;
  if (report.refund > 0) earnGold(report.refund);
  notify(
    `${partyState.dismissed.at(-1)?.name ?? "同伴"} 离队，带走 ${report.cardIds.length} 张专属牌` +
      (report.growthOfferIds.length
        ? `，${report.growthOfferIds.length} 份待领取成长已解除`
        : "") +
      (report.refund ? `，补给退款 ${report.refund} 金` : "") +
      "。",
  );
  persist();
}
export function upgrade(id: string) {
  if (battleState.phase === "playing") return;
  notify(upgradeCard(id) ? "卡牌强化完成。" : "无法强化：金币不足或已经强化。");
  persist();
}
export function remove(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    removeCard(id)
      ? "已移除卡牌。"
      : "无法移除：至少保留五张牌，且需要足够金币。",
  );
  persist();
}
export function restart() {
  resetRoute();
  resetBattle();
  resetDeck();
  resetReward();
  resetShop();
  resetParty();
  resetSession();
  clearSave();
  persist();
}
