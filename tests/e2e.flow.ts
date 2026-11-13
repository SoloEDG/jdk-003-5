/* 端到端验证：命令层完整旅途（含招募、商店补给、救治、离队、存档往返） */
import assert from "node:assert";
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
import * as cmd from "../src/app/commands";
import { partyState } from "../src/features/party/model/state";
import { deckState } from "../src/features/deck/model/state";
import { battleState } from "../src/features/battle/model/state";
import { shopState } from "../src/features/shop/model/state";
import { load } from "../src/app/persistence";
import { routeState, choices } from "../src/features/route/model/state";

// 干净开局
cmd.restart();
assert.equal(partyState.roster.length, 0, "开局无同伴");

// 第一层 n0-0 是普通战斗，打赢它
cmd.navigate("n0-0");
assert.equal(battleState.phase, "playing", "应进入战斗");
// 不断结束回合并出牌直到分胜负（敌人血量有限）
let guard = 0;
while (battleState.phase === "playing" && guard++ < 200) {
  const playable = battleState.piles.hand.find(
    (c) => (c.key ? true : false),
  );
  if (playable) cmd.play(playable.id);
  if (battleState.phase === "playing") cmd.turn();
}
assert.equal(battleState.phase, "won", "首场战斗应胜利");
cmd.settle();
assert.ok(battleState.result?.won, "应已结算胜利");
cmd.claim(true); // 跳过卡牌，只拿金币
assert.equal(routeState.resolved, true, "路线节点应已解决");
console.log("✓ 首场战斗与结算");

// 第二层 n1-0 是商店：购买同伴补给前还没有同伴，库存里不应有同伴项
cmd.navigate("n1-0");
const partyItemsBefore = shopState.stock.filter((s) => s.companionId);
assert.equal(partyItemsBefore.length, 0, "无同伴时商店不出售同伴补给/专属牌");
cmd.leaveShop();
console.log("✓ 无同伴时商店不出现同伴商品");

// 第三层 n2-0 是流明招募节点
cmd.navigate("n2-0");
assert.equal(
  partyState.roster.some((m) => m.id === "lumen"),
  false,
  "招募前流明不在队",
);
cmd.acceptRecruit();
assert.equal(
  partyState.roster.some((m) => m.id === "lumen"),
  true,
  "流明应已入队",
);
assert.ok(
  deckState.cards.some((c) => c.ownerId === "lumen"),
  "入队后牌组应含流明专属牌",
);
console.log("✓ 招募节点入队");

// 再打一场战斗，验证流明出现在战场且生命独立
cmd.navigate("n3-0");
assert.equal(battleState.party.length, 2, "战场上应有旅人与流明");
const ids = battleState.party.map((a) => a.id).sort();
assert.deepEqual(ids, ["hero", "lumen"], "两名角色独立存在");
const hero = battleState.party.find((a) => a.id === "hero")!;
const lumen = battleState.party.find((a) => a.id === "lumen")!;
assert.notEqual(hero.maxHp, lumen.maxHp, "生命上限应各自独立");
console.log("✓ 战斗中双角色独立生命");

// 商店补给购买 → 待领取 → 离队退款，先结束当前战斗
guard = 0;
while (battleState.phase === "playing" && guard++ < 200) {
  const hand = battleState.piles.hand;
  if (hand.length) cmd.play(hand[0]!.id);
  if (battleState.phase === "playing") cmd.turn();
}
if (battleState.phase === "won") {
  cmd.settle();
  cmd.claim(true);
}

// 下一个商店 n4-0
cmd.navigate("n4-0");
const supplyItem = shopState.stock.find((s) => s.kind === "supply");
assert.ok(supplyItem, "有同伴后商店应出售同伴补给");
const goldBefore = deckState.hero.gold;
cmd.buy(supplyItem!.id);
assert.equal(
  partyState.pendingSupplies.length,
  1,
  "已购补给应进入待领取",
);
const pricePaid = partyState.pendingSupplies[0]!.pricePaid;
assert.equal(
  deckState.hero.gold,
  goldBefore - pricePaid,
  "金币应已扣除",
);
cmd.leaveShop();
console.log("✓ 商店购买同伴补给进入待领取");

// 离队：应带走专属牌、解除成长、补给退款
const goldAfterShop = deckState.hero.gold;
cmd.leaveParty("lumen");
assert.equal(
  partyState.roster.some((m) => m.id === "lumen"),
  false,
  "流明应已离队",
);
assert.ok(
  !deckState.cards.some((c) => c.ownerId === "lumen"),
  "离队后牌组不得残留其专属牌",
);
assert.equal(
  partyState.pendingSupplies.length,
  0,
  "离队后待领取补给应清空",
);
assert.equal(
  deckState.hero.gold,
  goldAfterShop + pricePaid,
  "已付费未领取补给应原价退还",
);
console.log("✓ 离队清理与退款");

// 再进战斗：离队同伴不得出现，也不得共享生命。
// 沿路线找到下一个战斗/精英节点（路线只能走当前节点的后继）
function nextBattleNode(): string {
  const nodes = routeState.nodes;
  let frontier = choices();
  let guard = 0;
  while (frontier.length && guard++ < 12) {
    const battleNode = frontier.find((id: string) => {
      const n = nodes.find((x) => x.id === id)!;
      return n.kind === "battle" || n.kind === "elite";
    });
    if (battleNode) return battleNode;
    // 非战斗节点直接进入并解决，继续推进
    const id = frontier[0]!;
    cmd.navigate(id);
    const kind = nodes.find((x) => x.id === id)!.kind;
    if (kind === "shop") cmd.leaveShop();
    else if (kind === "camp") {
      // 篝火节点直接 resolve（无倒下同伴，无需救治）
      cmd.camp("rest");
    } else if (kind === "recruit") cmd.declineRecruit();
    frontier = choices();
  }
  throw new Error("找不到后续战斗节点");
}
const battleNodeId = nextBattleNode();
cmd.navigate(battleNodeId);
assert.equal(battleState.party.length, 1, "战场只剩旅人");
assert.equal(battleState.party[0]!.id, "hero");
assert.ok(
  !battleState.piles.draw.some((c) => c.ownerId === "lumen") &&
    !battleState.piles.hand.some((c) => c.ownerId === "lumen"),
  "战斗牌堆不得出现离队同伴的牌",
);
console.log("✓ 离队后不再出牌");

// 存档往返：重新加载后状态一致
const rosterCount = partyState.roster.length;
const cardCount = deckState.cards.length;
const ok = load();
assert.ok(ok, "存档应可加载");
assert.equal(partyState.roster.length, rosterCount, "同伴数存档一致");
assert.equal(deckState.cards.length, cardCount, "牌组数存档一致");
assert.ok(
  !deckState.cards.some((c) => c.ownerId === "lumen"),
  "重载后仍无离队同伴的牌",
);
console.log("✓ 存档往返一致");

console.log("\n端到端命令流断言通过 ✅");
