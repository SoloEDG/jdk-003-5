import type { RouteNode, Region, NodeKind } from "@/shared/domain";
export function makeMap(): RouteNode[] {
  const result: RouteNode[] = [];
  const regions: Region[] = ["forest", "forge", "abyss"];
  for (let depth = 0; depth < 9; depth++) {
    const region = regions[Math.floor(depth / 3)]!;
    for (let lane = 0; lane < 2; lane++) {
      const kind: NodeKind =
        depth === 8
          ? "boss"
          : depth % 3 === 1
            ? lane === 0
              ? "shop"
              : "camp"
            : lane === 0
              ? "battle"
              : "elite";
      result.push({
        id: `n${depth}-${lane}`,
        region,
        depth,
        lane,
        kind,
        title:
          kind === "boss"
            ? "裂隙守望者"
            : kind === "elite"
              ? "危险的捷径"
              : kind === "shop"
                ? "游商营地"
                : kind === "camp"
                  ? "熄风篝火"
                  : "失落哨站",
        influence:
          lane === 0
            ? { heat: 0, favor: 1, scarcity: 0 }
            : { heat: 1, favor: 0, scarcity: 1 },
        next: depth === 8 ? [] : [`n${depth + 1}-0`, `n${depth + 1}-1`],
      });
    }
  }
  return result;
}
