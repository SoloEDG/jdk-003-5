import type { Actor, Effect } from "@/shared/domain";
export interface EffectEvent {
  effect: Effect;
  source: "hero" | "enemy";
  label: string;
}
export function damage(target: Actor, amount: number) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  target.hp = Math.max(0, target.hp - (amount - blocked));
  return amount - blocked;
}
export function resolveEffect(
  event: EffectEvent,
  hero: Actor,
  enemy: Actor,
): string {
  const { effect: e, source, label } = event;
  const target = e.target === "hero" ? hero : enemy;
  const origin = source === "hero" ? hero : enemy;
  if (e.type === "damage") {
    const amount = e.amount + origin.strength;
    const lost = damage(target, amount);
    if (target.thorns > 0 && origin.hp > 0) damage(origin, target.thorns);
    return `${label} → ${lost} 生命伤害${target.thorns ? "，荆棘反伤 " + target.thorns : ""}`;
  }
  if (e.type === "block") target.block += e.amount;
  if (e.type === "poison") target.poison += e.amount;
  if (e.type === "strength") target.strength += e.amount;
  if (e.type === "heal")
    target.hp = Math.min(target.maxHp, target.hp + e.amount);
  return `${label} → ${e.type} ${e.amount}`;
}
export function poisonTick(actor: Actor) {
  if (actor.poison === 0) return 0;
  const amount = actor.poison;
  actor.hp = Math.max(0, actor.hp - amount);
  actor.poison = Math.max(0, actor.poison - 1);
  return amount;
}
