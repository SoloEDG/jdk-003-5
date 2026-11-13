import type { CardInstance } from "@/shared/domain";
import { uid } from "@/shared/random";
export function starter(): CardInstance[] {
  return [
    "strike",
    "strike",
    "strike",
    "guard",
    "guard",
    "venom",
    "focus",
    "shelter",
  ].map((key) => ({ id: uid("card"), key, upgraded: false }));
}
export function createCard(key: string): CardInstance {
  return { id: uid("card"), key, upgraded: false };
}
export function canRemove(size: number) {
  return size > 5;
}
