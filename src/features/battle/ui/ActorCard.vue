<script setup lang="ts">
import type { Actor } from "@/shared/domain";
defineProps<{
  actor: Actor;
  name: string;
  enemy?: boolean;
  intent?: number;
  targeted?: boolean;
}>();
</script>
<template>
  <div
    class="actor"
    :class="{ enemy, downed: actor.downed, targeted }"
    :data-actor="actor.id"
  >
    <div class="actor-sigil">{{ enemy ? "♜" : "✦" }}</div>
    <h3>{{ name }}<i v-if="actor.downed" class="down-tag">倒下</i></h3>
    <div class="health">
      <i :style="{ width: (actor.hp / actor.maxHp) * 100 + '%' }"></i>
    </div>
    <p>
      {{ actor.hp }} / {{ actor.maxHp }} HP
      <span v-if="actor.block"> · 护盾 {{ actor.block }}</span>
    </p>
    <div class="statuses">
      <span v-if="actor.strength">力量 {{ actor.strength }}</span
      ><span v-if="actor.poison">中毒 {{ actor.poison }}</span
      ><span v-if="actor.thorns">荆棘 {{ actor.thorns }}</span>
    </div>
    <strong v-if="targeted && !actor.downed" class="intent"
      >敌人正在瞄准</strong
    >
    <strong v-if="enemy" class="intent">下次攻击 {{ intent }}</strong>
  </div>
</template>
