export type Region = "forest" | "forge" | "abyss";
export type NodeKind = "battle" | "elite" | "shop" | "camp" | "boss";
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
}
export interface CardInstance {
  id: string;
  key: string;
  upgraded: boolean;
}
export interface CardSpec {
  key: string;
  name: string;
  cost: number;
  kind: "attack" | "skill" | "power";
  text: string;
  rarity: "common" | "rare";
  effects: Effect[];
}
export type Effect = {
  type: "damage" | "block" | "draw" | "poison" | "strength" | "heal" | "energy";
  amount: number;
  target: "hero" | "enemy";
};
export interface Actor {
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  poison: number;
  thorns: number;
}
export interface JourneyContext {
  nodeId: string;
  region: Region;
  depth: number;
  kind: NodeKind;
  influence: Influence;
}
export interface BattleResult {
  id: string;
  nodeId: string;
  won: boolean;
  hp: number;
  gold: number;
  context: JourneyContext;
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
