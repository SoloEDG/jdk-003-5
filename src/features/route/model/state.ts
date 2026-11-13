import { reactive, readonly } from "vue";
import type { Influence, JourneyContext } from "@/shared/domain";
import { makeMap } from "../lib/map";
import { available, contextFor } from "../lib/rules";
const state = reactive({
  nodes: makeMap(),
  visited: [] as string[],
  resolved: true,
  influence: { heat: 0, favor: 0, scarcity: 0 } as Influence,
  preview: null as JourneyContext | null,
});
export const routeState = readonly(state);
export function choices() {
  return available(state.nodes, state.visited, state.resolved);
}
export function previewRoute(id: string) {
  const n = state.nodes.find((n) => n.id === id);
  state.preview = n ? contextFor(n, state.influence) : null;
}
export function enterRoute(id: string): JourneyContext | null {
  if (!choices().includes(id)) return null;
  const node = state.nodes.find((n) => n.id === id)!;
  const context = contextFor(node, state.influence);
  state.visited.push(id);
  state.influence = context.influence;
  state.resolved = false;
  state.preview = null;
  return context;
}
export function resolveRoute() {
  state.resolved = true;
}
export function exportRoute() {
  return JSON.parse(
    JSON.stringify({
      visited: state.visited,
      resolved: state.resolved,
      influence: state.influence,
    }),
  );
}
export function restoreRoute(data: ReturnType<typeof exportRoute>) {
  state.visited = data.visited;
  state.resolved = data.resolved;
  state.influence = data.influence;
  state.preview = null;
}
export function resetRoute() {
  state.visited = [];
  state.resolved = true;
  state.influence = { heat: 0, favor: 0, scarcity: 0 };
  state.preview = null;
}
