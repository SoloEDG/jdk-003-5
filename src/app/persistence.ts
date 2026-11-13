import { exportRoute, restoreRoute } from "@/features/route";
import { exportBattle, restoreBattle } from "@/features/battle";
import { exportDeck, restoreDeck } from "@/features/deck";
import { exportReward, restoreReward } from "@/features/reward";
import { exportShop, restoreShop } from "@/features/shop";
import { exportParty, restoreParty } from "@/features/party";
import { exportSession, restoreSession } from "./session";
const KEY = "ember-path-v2";
function snapshot() {
  return {
    version: 2,
    route: exportRoute(),
    battle: exportBattle(),
    deck: exportDeck(),
    reward: exportReward(),
    shop: exportShop(),
    party: exportParty(),
    session: exportSession(),
  };
}
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
    return true;
  } catch {
    return false;
  }
}
export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    if (
      d.version !== 2 ||
      !Array.isArray(d.deck?.cards) ||
      !Array.isArray(d.route?.visited) ||
      !d.battle?.piles ||
      !Array.isArray(d.reward?.history) ||
      !Array.isArray(d.shop?.stock) ||
      !d.session
    )
      return false;
    const old = snapshot();
    try {
      restoreRoute(d.route);
      restoreBattle(d.battle);
      restoreDeck(d.deck);
      restoreReward(d.reward);
      restoreShop(d.shop);
      restoreParty(d.party ?? { roster: [], pendingGrowth: [], pendingSupplies: [], dismissed: [] });
      restoreSession(d.session);
    } catch {
      restoreRoute(old.route);
      restoreBattle(old.battle);
      restoreDeck(old.deck);
      restoreReward(old.reward);
      restoreShop(old.shop);
      restoreParty(old.party);
      restoreSession(old.session);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
export function clearSave() {
  localStorage.removeItem(KEY);
}
