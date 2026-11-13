import type { CardInstance } from "@/shared/domain";
import { HERO_ID } from "@/shared/domain";
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
  ].map((key) => ({ id: uid("card"), key, upgraded: false, ownerId: HERO_ID }));
}
export function createCard(key: string, ownerId: string = HERO_ID): CardInstance {
  return { id: uid("card"), key, upgraded: false, ownerId };
}
export function canRemove(size: number) {
  return size > 5;
}
