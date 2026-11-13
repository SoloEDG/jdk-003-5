import type { BattleResult, RewardOffer } from "@/shared/domain";
import { rewardPool } from "./pool";
import { partyState, openGrowthFromBattle } from "@/features/party";
import type { GrowthKind } from "@/shared/domain";
export function offerFrom(result: BattleResult): RewardOffer {
  return {
    id: `reward-${result.id}`,
    source: result.id,
    cards: rewardPool(result.context),
    gold: result.gold + result.context.influence.favor * 2,
    heal: result.context.region === "forest" ? 3 : 0,
    claimed: false,
  };
}
export function validChoice(offer: RewardOffer | null, key: string | null) {
  return (
    !!offer && !offer.claimed && (key === null || offer.cards.includes(key))
  );
}
/**
 * 战斗胜利后为每名在队同伴生成一份成长奖励。
 * 成长是可选奖励，先进入待领取队列，离队时会随同伴一起解除引用。
 */
export function openCompanionGrowth(result: BattleResult) {
  if (partyState.roster.length === 0) return [];
  const rotation: GrowthKind[] = ["vitality", "focus", "drill"];
  return openGrowthFromBattle(result.id, rotation);
}
