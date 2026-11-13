import { reactive, readonly } from "vue";
import type { BattleResult, RewardOffer } from "@/shared/domain";
import { offerFrom, validChoice } from "../lib/settlement";
const state = reactive({
  offer: null as RewardOffer | null,
  history: [] as string[],
  selected: "",
});
export const rewardState = readonly(state);
export function openReward(result: BattleResult) {
  if (!result.won || state.history.includes(result.id)) return false;
  state.offer = offerFrom(result);
  state.selected = "";
  return true;
}
export function chooseReward(key: string) {
  if (state.offer?.cards.includes(key)) state.selected = key;
}
export function claimReward(skip = false) {
  if (!validChoice(state.offer, skip ? null : state.selected)) return null;
  const offer = state.offer!;
  offer.claimed = true;
  state.history.push(offer.source);
  return {
    card: skip ? null : state.selected,
    gold: offer.gold,
    heal: offer.heal,
  };
}
export function exportReward() {
  return JSON.parse(
    JSON.stringify({ offer: state.offer, history: state.history }),
  );
}
export function restoreReward(d: ReturnType<typeof exportReward>) {
  state.offer = d.offer;
  state.history = d.history;
  state.selected = "";
}
export function resetReward() {
  state.offer = null;
  state.history = [];
  state.selected = "";
}
