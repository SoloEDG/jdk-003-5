import { reactive, readonly } from "vue";
import type { JourneyContext } from "@/shared/domain";
const state = reactive({
  tab: "route",
  context: null as JourneyContext | null,
  message: "在火熄灭之前，找到通向深渊的路。",
  ended: false,
});
export const session = readonly(state);
export function switchTab(tab: string) {
  state.tab = tab;
}
export function setContext(c: JourneyContext | null) {
  state.context = c;
}
export function notify(message: string) {
  state.message = message;
}
export function finishRun() {
  state.ended = true;
}
export function exportSession() {
  return JSON.parse(JSON.stringify(state));
}
export function restoreSession(d: ReturnType<typeof exportSession>) {
  Object.assign(state, d);
}
export function resetSession() {
  state.tab = "route";
  state.context = null;
  state.message = "新的火种已点燃。";
  state.ended = false;
}
