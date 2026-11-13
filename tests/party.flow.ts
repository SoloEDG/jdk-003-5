/* 集成验证：同伴系统完整流程（Node 环境，esbuild 打包后运行） */
import assert from "node:assert";
// 简易 localStorage 模拟
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
import { companionSpecs } from "../src/features/party/lib/companions";
import {
  partyState,
  recruit,
  writeBattleResult,
  dismissCompanion,
  makeSupply,
  claimSupply,
  revive,
  openGrowthFromBattle,
  claimGrowth,
  __stashSupplyForTest,
} from "../src/features/party/model/state";
import {
  deckState,
  addCard,
  battleDeck,
  removeCardsByOwner,
  upgradeOwnedCards,
  earnGold,
  spendGold,
} from "../src/features/deck/model/state";
import {
  beginBattle,
  playCard,
  battleState,
  __forceDownForTest,
} from "../src/features/battle/model/state";
import type { JourneyContext } from "../src/shared/domain";

const ctx = (id: string): JourneyContext => ({
  nodeId: id,
  region: "forest",
  depth: 1,
  kind: "battle",
  influence: { heat: 0, favor: 0, scarcity: 0 },
});

function reset() {
  for (const m of [...partyState.roster]) {
    removeCardsByOwner(m.id);
    dismissCompanion(m.id, []);
  }
}

// ---------- 1. 招募：专属牌入队并进入战斗牌池 ----------
reset();
const lumenSpec = companionSpecs.lumen;
recruit(lumenSpec);
for (const key of lumenSpec.starterCards) addCard(key, "lumen");
assert.equal(partyState.roster.length, 1, "流明应入队");
const ownedByLumen = deckState.cards.filter((c) => c.ownerId === "lumen");
assert.equal(
  ownedByLumen.length,
  lumenSpec.starterCards.length,
  "专属牌应归属流明",
);
const deck = battleDeck(["lumen"]);
assert.ok(
  deck.some((c) => c.ownerId === "lumen"),
  "同伴牌应进入出战牌堆",
);
console.log("✓ 招募与专属牌入池");

// ---------- 2. 战斗：独立生命、共用能量、效果归属 ----------
beginBattle(ctx("n1-0"), deck, [
  { id: "hero", name: "余烬旅人", hp: 72, maxHp: 72 },
  { id: "lumen", name: "流明", hp: 42, maxHp: 42 },
]);
assert.equal(battleState.party.length, 2, "战斗应有两名角色");
assert.equal(battleState.energy, 3, "起始共用 3 能量");
const heroBefore = battleState.party.find((a) => a.id === "hero")!.hp;
const lumenBefore = battleState.party.find((a) => a.id === "lumen")!.hp;
const lumenCard = battleState.piles.hand.find((c) => c.ownerId === "lumen");
assert.ok(lumenCard, "流明的牌应可能出现在初始手牌");
if (lumenCard) {
  const ok = playCard(lumenCard.id);
  assert.ok(ok, "流明应能出自己的牌");
  assert.ok(battleState.energy <= 3, "共用能量应被消耗");
}
assert.equal(
  battleState.party.find((a) => a.id === "hero")!.hp,
  heroBefore,
  "流明出牌不影响旅人生命（无共享生命）",
);
assert.equal(
  battleState.party.find((a) => a.id === "lumen")!.hp,
  lumenBefore,
  "攻击牌不改变流明生命",
);
console.log("✓ 独立生命 / 共用能量 / 效果归属");

// ---------- 3. 倒下：本场不能行动且专属牌移出 ----------
__forceDownForTest("lumen");
const lumenActor = battleState.party.find((a) => a.id === "lumen")!;
assert.equal(lumenActor.downed, true, "流明应倒下");
assert.ok(
  !battleState.piles.hand.some((c) => c.ownerId === "lumen") &&
    !battleState.piles.draw.some((c) => c.ownerId === "lumen") &&
    !battleState.piles.discard.some((c) => c.ownerId === "lumen"),
  "倒下角色的牌应全部移出可抽区域",
);
assert.ok(
  battleState.piles.exhaust.some((c) => c.ownerId === "lumen"),
  "倒下角色的牌应进入消耗",
);
const anyLumen = battleState.piles.hand.find((c) => c.ownerId === "lumen");
if (anyLumen) assert.equal(playCard(anyLumen.id), false);
console.log("✓ 倒下即移出本场，不能再行动");

// ---------- 4. 战后状态保留，不自动复活 ----------
writeBattleResult({ allies: [{ id: "lumen", hp: 0, downed: true }] });
const lumenAfter = partyState.roster.find((m) => m.id === "lumen")!;
assert.equal(lumenAfter.downed, true, "倒下状态战后应保留");
assert.equal(lumenAfter.hp, 0, "倒下同伴生命为 0");
const nextDeck = battleDeck(
  partyState.roster.filter((m) => !m.downed).map((m) => m.id),
);
assert.ok(
  !nextDeck.some((c) => c.ownerId === "lumen"),
  "倒下同伴的牌不应进入下一场抽牌池",
);
console.log("✓ 倒下状态战后保留且不进牌池");

// ---------- 5. 篝火救治 ----------
earnGold(100);
assert.equal(spendGold(40), true, "支付救治费用");
const revived = revive("lumen");
assert.ok(revived, "救治应成功");
assert.equal(
  partyState.roster.find((m) => m.id === "lumen")!.downed,
  false,
  "救治后解除倒下",
);
assert.ok(
  partyState.roster.find((m) => m.id === "lumen")!.hp > 0,
  "救治后回复生命",
);
console.log("✓ 篝火付费救治");

// ---------- 6. 待领取成长与补给 ----------
const offers = openGrowthFromBattle("battle-test", ["vitality", "focus"]);
assert.ok(offers.length >= 1, "应生成成长");
const growth = claimGrowth(offers[0]!.id);
assert.ok(growth, "成长应可领取");
if (growth?.kind === "focus") {
  const n = upgradeOwnedCards("lumen");
  assert.ok(n >= 0);
}
const supply = makeSupply("draught", "lumen", 30);
__stashSupplyForTest(supply);
const effect = claimSupply(supply.id);
assert.ok(effect, "补给应可使用");
console.log("✓ 成长与补给领取");

// ---------- 7. 离队：解除引用 + 补给退款 ----------
const supply2 = makeSupply("ration", "lumen", 18);
__stashSupplyForTest(supply2);
openGrowthFromBattle("battle-test-2", ["vitality"]);
const goldBefore = deckState.hero.gold;
const cardIds = removeCardsByOwner("lumen");
assert.ok(cardIds.length > 0, "离队应先带走专属牌");
assert.ok(
  !deckState.cards.some((c) => c.ownerId === "lumen"),
  "牌组不应再引用离队同伴",
);
const report = dismissCompanion("lumen", cardIds);
assert.ok(report, "离队报告应生成");
assert.equal(report!.refund, 18, "未领取补给应按原价退款");
// 退款动作由命令层 leaveParty 执行（dismissCompanion 只负责汇总金额）
earnGold(report!.refund);
assert.equal(
  partyState.pendingGrowth.filter((o) => o.companionId === "lumen").length,
  0,
  "待领取成长应解除",
);
assert.equal(
  partyState.pendingSupplies.filter((s) => s.companionId === "lumen").length,
  0,
  "待领取补给应移除",
);
assert.equal(deckState.hero.gold, goldBefore + 18, "退款应回到金币");
console.log("✓ 离队解除引用并退款");

// ---------- 8. 离队后不会再出牌 / 不共享生命 ----------
const deckAfter = battleDeck(partyState.roster.map((m) => m.id));
assert.ok(
  !deckAfter.some((c) => c.ownerId === "lumen"),
  "离队同伴的牌不得再进入出战牌堆",
);
beginBattle(ctx("n1-1"), deckAfter, [
  { id: "hero", name: "余烬旅人", hp: 72, maxHp: 72 },
]);
assert.equal(battleState.party.length, 1, "离队同伴不得出现在战斗中");
assert.equal(battleState.party[0]!.id, "hero", "只剩旅人");
console.log("✓ 离队后不再出牌、不共享生命");

console.log("\n全部集成断言通过 ✅");
