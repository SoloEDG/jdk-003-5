<script setup lang="ts">
import {
  battleState,
  currentIntent,
  currentTarget,
  heroActor,
  allyActors,
} from "../model/state";
import { cards } from "@/shared/cards";
import { companionName } from "@/features/party";
import ActorCard from "./ActorCard.vue";
defineEmits<{ play: [id: string]; end: []; settle: [] }>();
function ownerLabel(ownerId: string) {
  return ownerId === "hero" ? "余烬旅人" : companionName(ownerId);
}
</script>
<template>
  <section class="panel battle-panel">
    <div class="section-top">
      <span class="eyebrow">02 / THE ENCOUNTER</span
      ><span>回合 {{ battleState.turn }}</span>
    </div>
    <h2>{{ battleState.enemy?.name ?? "等待下一场遭遇" }}</h2>
    <div v-if="battleState.enemy" class="arena">
      <div class="party-side">
        <ActorCard
          v-if="heroActor()"
          :actor="heroActor()!"
          name="余烬旅人"
          :targeted="currentTarget()?.id === 'hero'"
        />
        <ActorCard
          v-for="ally in allyActors()"
          :key="ally.id"
          :actor="ally"
          :name="ally.name"
          :targeted="currentTarget()?.id === ally.id"
        />
      </div>
      <div class="versus">
        VS<br /><small>{{ battleState.context?.region.toUpperCase() }}</small>
      </div>
      <ActorCard
        :actor="battleState.enemy"
        :name="battleState.enemy.name"
        enemy
        :intent="currentIntent()"
      />
    </div>
    <div v-else class="empty-art">
      ✧
      <p>在路线图中选择一个哨站<br /><small>全队共用能量，生命各自独立</small></p>
    </div>
    <div v-if="battleState.phase === 'playing'">
      <div class="energy-line">
        <b>◉ {{ battleState.energy }} / 3 能量（全队共用）</b
        ><span
          >目标 {{ currentTarget()?.name ?? "—" }} · 抽牌
          {{ battleState.piles.draw.length }} · 弃牌
          {{ battleState.piles.discard.length }} · 消耗
          {{ battleState.piles.exhaust.length }}</span
        ><button data-action="end-turn" @click="$emit('end')">
          结束回合 →
        </button>
      </div>
      <div class="hand">
        <button
          v-for="c in battleState.piles.hand"
          :key="c.id"
          class="playing-card"
          :data-hand-id="c.id"
          :data-owner="c.ownerId"
          :disabled="cards[c.key]!.cost > battleState.energy"
          @click="$emit('play', c.id)"
        >
          <i>{{ cards[c.key]!.cost }}</i
          ><span>{{
            cards[c.key]!.kind === "attack"
              ? "⚔"
              : cards[c.key]!.kind === "power"
                ? "✺"
                : "◇"
          }}</span>
          <h3>{{ cards[c.key]!.name }}{{ c.upgraded ? " +" : "" }}</h3>
          <p>{{ cards[c.key]!.text }}<b v-if="c.upgraded"> 效果 +2</b></p>
          <small class="hand-owner">{{ ownerLabel(c.ownerId) }}</small>
        </button>
      </div>
    </div>
    <div
      v-if="battleState.phase === 'won' || battleState.phase === 'lost'"
      class="notice"
    >
      <h3>
        {{
          battleState.phase === "won"
            ? "遭遇胜利 · 火种仍在（倒下同伴仍需篝火救治）"
            : "旅途结束 · 余烬熄灭"
        }}
      </h3>
      <button data-action="settle" @click="$emit('settle')">
        {{ battleState.phase === "won" ? "收取战利品 →" : "查看旅程结果" }}
      </button>
    </div>
    <details v-if="battleState.log.length" open>
      <summary>效果记录 · 最新在前</summary>
      <div class="battle-log">
        <p v-for="(line, i) in battleState.log" :key="i">{{ line }}</p>
      </div>
    </details>
  </section>
</template>
