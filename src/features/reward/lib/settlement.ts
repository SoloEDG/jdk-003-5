import type { BattleResult, RewardOffer } from "@/shared/domain";
import { rewardPool } from "./pool";
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
