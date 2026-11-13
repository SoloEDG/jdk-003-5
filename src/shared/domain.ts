export type Region = "forest" | "forge" | "abyss";
export type NodeKind =
  | "battle"
  | "elite"
  | "shop"
  | "camp"
  | "boss"
  | "recruit";
export interface Influence {
  heat: number;
  favor: number;
  scarcity: number;
}
export interface RouteNode {
  id: string;
  region: Region;
  depth: number;
  lane: number;
  kind: NodeKind;
  title: string;
  influence: Influence;
  next: string[];
  /** 招募节点上等待入队的同伴 */
  companionId?: string;
}
export const HERO_ID = "hero";
export interface CardInstance {
  id: string;
  key: string;
  upgraded: boolean;
  /** 卡牌归属：旅人固定为 hero，其余为同伴 id；离队时随所属者带走 */
  ownerId: string;
}
export interface CardSpec {
  key: string;
  name: string;
  cost: number;
  kind: "attack" | "skill" | "power";
  text: string;
  rarity: "common" | "rare";
  effects: Effect[];
  /** 同伴专属牌的所属同伴 id；旅人的通用牌不填 */
  companionId?: string;
}
export type Effect = {
  type: "damage" | "block" | "draw" | "poison" | "strength" | "heal" | "energy";
  amount: number;
  target: "hero" | "enemy";
};
export interface Actor {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  poison: number;
  thorns: number;
  downed: boolean;
}
export type CompanionStatus = "active" | "downed";
export interface CompanionSpec {
  id: string;
  name: string;
  sigil: string;
  maxHp: number;
  title: string;
  description: string;
  recruitNodeId: string;
  starterCards: string[];
}
export interface Companion {
  id: string;
  name: string;
  sigil: string;
  hp: number;
  maxHp: number;
  downed: boolean;
  growth: number;
}
export type GrowthKind = "vitality" | "focus" | "drill";
export interface GrowthOffer {
  id: string;
  companionId: string;
  kind: GrowthKind;
  label: string;
  sourceBattleId: string;
}
export type SupplyKind = "draught" | "ration" | "tonic";
export interface Supply {
  id: string;
  kind: SupplyKind;
  companionId: string;
  name: string;
  pricePaid: number;
}
export interface JourneyContext {
  nodeId: string;
  region: Region;
  depth: number;
  kind: NodeKind;
  influence: Influence;
  companionId?: string;
}
export interface AllySnapshot {
  id: string;
  hp: number;
  downed: boolean;
}
export interface BattleResult {
  id: string;
  nodeId: string;
  won: boolean;
  hp: number;
  gold: number;
  context: JourneyContext;
  /** 每名同伴战后的生命与倒下状态，由战斗写回队伍 */
  allies: AllySnapshot[];
}
export interface RewardOffer {
  id: string;
  source: string;
  cards: string[];
  gold: number;
  heal: number;
  claimed: boolean;
}
export interface Purchase {
  id: string;
  card: string;
  price: number;
}
export interface ExpeditionSummary {
  hp: number;
  maxHp: number;
  gold: number;
  scars: number;
}
export const regionNames: Record<Region, string> = {
  forest: "苔光林地",
  forge: "熔铁边境",
  abyss: "无声深渊",
};
