export function upgradeCost(upgraded: boolean, scars: number) {
  return upgraded ? Infinity : 25 + scars * 5;
}
export function removalCost(count: number) {
  return 30 + count * 10;
}
export function campHealing(maxHp: number, heat: number) {
  return Math.max(5, Math.floor(maxHp * 0.3) - heat);
}
