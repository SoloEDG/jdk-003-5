import type { RouteNode, Region, NodeKind } from "@/shared/domain";
export function makeMap(): RouteNode[] {
  const result: RouteNode[] = [];
  const regions: Region[] = ["forest", "forge", "abyss"];
  /** 招募节点：在指定位置等待加入的同伴 */
  const recruitAt: Record<string, string> = {
    "n2-0": "lumen",
    "n5-0": "rana",
  };
  const titles: Record<NodeKind, string> = {
    boss: "裂隙守望者",
    elite: "危险的捷径",
    shop: "游商营地",
    camp: "熄风篝火",
    battle: "失落哨站",
    recruit: "篝火边的陌生人",
  };
  for (let depth = 0; depth < 9; depth++) {
    const region = regions[Math.floor(depth / 3)]!;
    for (let lane = 0; lane < 2; lane++) {
      const id = `n${depth}-${lane}`;
      let kind: NodeKind;
      if (depth === 8) kind = "boss";
      else if (recruitAt[id]) kind = "recruit";
      else if (depth % 3 === 1) kind = lane === 0 ? "shop" : "camp";
      else kind = lane === 0 ? "battle" : "elite";
      result.push({
        id,
        region,
        depth,
        lane,
        kind,
        title: titles[kind],
        influence:
          lane === 0
            ? { heat: 0, favor: 1, scarcity: 0 }
            : { heat: 1, favor: 0, scarcity: 1 },
        companionId: recruitAt[id],
        next: depth === 8 ? [] : [`n${depth + 1}-0`, `n${depth + 1}-1`],
      });
    }
  }
  return result;
}
