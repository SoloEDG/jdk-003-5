<script setup lang="ts">
import { computed } from "vue";
import { session } from "@/app/session";
import { companionSpecs, partyState } from "../model/state";
import { cards } from "@/shared/cards";
const emit = defineEmits<{ accept: []; decline: [] }>();
const spec = computed(() => {
  const id = session.context?.companionId;
  return id ? companionSpecs[id] : null;
});
const alreadyIn = computed(() =>
  spec.value ? partyState.roster.some((m) => m.id === spec.value!.id) : false,
);
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">06 / THE COMPANION</span><span>篝火边的陌生人</span>
    </div>
    <h2>队伍需要新的火种</h2>
    <p class="muted">
      同伴拥有独立生命、状态与专属牌。入队后专属牌进入战斗抽牌池，全队共用能量，
      但出牌效果归属于该同伴；倒下后本场无法行动，需在篝火救治。
    </p>
    <div v-if="spec" class="recruit-card" :data-companion="spec.id">
      <div class="recruit-head">
        <b class="recruit-sigil">{{ spec.sigil }}</b>
        <div>
          <h3>{{ spec.name }} · {{ spec.title }}</h3>
          <small>最大生命 {{ spec.maxHp }}</small>
        </div>
      </div>
      <p class="muted">{{ spec.description }}</p>
      <h4>入队专属牌</h4>
      <div class="recruit-cards">
        <div v-for="(key, i) in spec.starterCards" :key="i" class="mini-card">
          <b>{{ cards[key]?.name }}</b
          ><small>{{ cards[key]?.text }}</small>
        </div>
      </div>
      <div class="toolbar">
        <button data-action="accept-recruit" :disabled="alreadyIn" @click="emit('accept')">
          {{ alreadyIn ? "已在队伍中" : "邀请入队 →" }}
        </button>
        <button data-action="decline-recruit" @click="emit('decline')">
          婉拒，独自上路
        </button>
      </div>
    </div>
    <div v-else class="empty-mini">路线上的招募节点会出现可同行的旅人。</div>
  </section>
</template>
