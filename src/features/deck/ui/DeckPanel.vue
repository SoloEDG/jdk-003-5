<script setup lang="ts">
import { deckState, selectCard } from "../model/state";
import { cards } from "@/shared/cards";
import { upgradeCost, removalCost } from "../lib/costs";
defineProps<{ camp: boolean; locked: boolean }>();
const emit = defineEmits<{
  upgrade: [id: string];
  remove: [id: string];
  camp: [action: "rest" | "upgrade"];
}>();
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">05 / YOUR ARSENAL</span
      ><span>{{ deckState.cards.length }} 张</span>
    </div>
    <h2>行囊中的可能</h2>
    <p class="muted">
      相同卡牌拥有独立身份。强化只影响选中的这一张，战斗中的牌组锁定。
    </p>
    <div v-if="camp" class="camp">
      <h3>篝火 · {{ deckState.campUsed ? "已经休整" : "选择一次休整" }}</h3>
      <button :disabled="deckState.campUsed" @click="emit('camp', 'rest')">
        休息 · 回复生命</button
      ><button
        :disabled="deckState.campUsed || !deckState.selected"
        @click="emit('camp', 'upgrade')"
      >
        免费强化选中牌
      </button>
    </div>
    <div class="deck-list">
      <button
        v-for="c in deckState.cards"
        :key="c.id"
        :data-card-id="c.id"
        :class="{ selected: deckState.selected === c.id }"
        @click="selectCard(c.id)"
      >
        <span>{{ cards[c.key]?.name }}{{ c.upgraded ? " +" : "" }}</span
        ><small>{{ cards[c.key]?.text }}</small
        ><em>{{ c.id.slice(-6) }}</em>
      </button>
    </div>
    <div class="toolbar">
      <button
        :disabled="locked || !deckState.selected"
        @click="emit('upgrade', deckState.selected)"
      >
        强化 · {{ upgradeCost(false, deckState.hero.scars) }} 金</button
      ><button
        :disabled="locked || !deckState.selected || deckState.cards.length <= 5"
        @click="emit('remove', deckState.selected)"
      >
        移除 · {{ removalCost(deckState.removals) }} 金
      </button>
    </div>
  </section>
</template>
