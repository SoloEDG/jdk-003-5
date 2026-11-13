import type { Actor, Effect } from "@/shared/domain";
export interface EffectEvent {
  effect: Effect;
  /** 出牌者 id：旅人为 hero，其余为同伴；效果归属于该角色 */
  ownerId: string;
  source: "hero" | "enemy";
  label: string;
}
export function damage(target: Actor, amount: number) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  target.hp = Math.max(0, target.hp - (amount - blocked));
  if (target.hp <= 0) target.downed = true;
  return amount - blocked;
}
export function resolveEffect(
  event: EffectEvent,
  party: Actor[],
  enemy: Actor,
): string {
  const { effect: e, ownerId, label } = event;
  const origin = party.find((a) => a.id === ownerId) ?? party[0]!;
  // target 为 hero 系的效果归属于出牌者本人（格挡/治疗/力量加在出牌角色身上）
  const target = e.target === "enemy" ? enemy : origin;
  if (e.type === "damage") {
    const amount = e.amount + origin.strength;
    const lost = damage(target, amount);
    if (target.thorns > 0 && origin.hp > 0) damage(origin, target.thorns);
    return `${label}（${origin.name}）→ ${lost} 生命伤害${target.thorns ? "，荆棘反伤 " + target.thorns : ""}`;
  }
  if (e.type === "block") target.block += e.amount;
  if (e.type === "poison") target.poison += e.amount;
  if (e.type === "strength") target.strength += e.amount;
  if (e.type === "heal" && !target.downed)
    target.hp = Math.min(target.maxHp, target.hp + e.amount);
  return `${label}（${origin.name}）→ ${e.type} ${e.amount}`;
}
export function poisonTick(actor: Actor) {
  if (actor.poison === 0 || actor.downed) return 0;
  const amount = actor.poison;
  actor.hp = Math.max(0, actor.hp - amount);
  actor.poison = Math.max(0, actor.poison - 1);
  if (actor.hp <= 0) actor.downed = true;
  return amount;
}
