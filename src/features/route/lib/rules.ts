import type { Influence, RouteNode, JourneyContext } from "@/shared/domain";
export function accumulate(a: Influence, b: Influence): Influence {
  return {
    heat: a.heat + b.heat,
    favor: a.favor + b.favor,
    scarcity: a.scarcity + b.scarcity,
  };
}
export function contextFor(
  node: RouteNode,
  influence: Influence,
): JourneyContext {
  return {
    nodeId: node.id,
    region: node.region,
    depth: node.depth,
    kind: node.kind,
    influence: accumulate(influence, node.influence),
  };
}
export function available(
  nodes: RouteNode[],
  visited: string[],
  resolved: boolean,
): string[] {
  if (!visited.length)
    return nodes.filter((n) => n.depth === 0).map((n) => n.id);
  if (!resolved) return [];
  return nodes.find((n) => n.id === visited.at(-1))?.next ?? [];
}
