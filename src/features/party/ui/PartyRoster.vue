<script setup lang="ts">
import { partyState, companionById, companionName, reviveCost } from "../model/state";
defineProps<{ camp: boolean; locked: boolean }>();
const emit = defineEmits<{
  rescue: [id: string];
  dismiss: [id: string];
  growth: [offerId: string];
  supply: [supplyId: string];
}>();
function isDowned(id: string) {
  return companionById(id)?.downed ?? true;
}
</script>
<template>
  <div class="party-roster">
    <div class="section-top">
      <span class="eyebrow">THE COMPANY</span
      ><span>{{ partyState.roster.length }} 名同伴</span>
    </div>
    <h3>同行者</h3>
    <div v-if="!partyState.roster.length" class="empty-mini compact">
      目前只有余烬旅人一人。在路线的招募节点可以邀请同伴入队。
    </div>
    <div
      v-for="mate in partyState.roster"
      :key="mate.id"
      class="mate"
      :class="{ downed: mate.downed }"
      :data-companion="mate.id"
    >
      <div class="mate-head">
        <b class="recruit-sigil">{{ mate.sigil }}</b>
        <div>
          <strong>{{ mate.name }}</strong>
          <small
            >{{ mate.downed ? "倒下 · 篝火救治前无法出战" : "在队" }} ·
            成长 {{ mate.growth }}</small
          >
        </div>
      </div>
      <div class="health">
        <i :style="{ width: (mate.hp / mate.maxHp) * 100 + '%' }"></i>
      </div>
      <p class="mate-hp">{{ mate.hp }} / {{ mate.maxHp }} HP</p>
      <div class="mate-actions">
        <button
          v-if="camp && mate.downed"
          data-action="rescue"
          @click="emit('rescue', mate.id)"
        >
          篝火救治 · {{ reviveCost(mate.id) }} 金
        </button>
        <span v-else-if="mate.downed" class="warn">需在篝火节点救治</span>
        <button
          class="ghost"
          :disabled="locked"
          data-action="dismiss"
          @click="emit('dismiss', mate.id)"
        >
          离队
        </button>
      </div>
    </div>

    <div v-if="partyState.pendingGrowth.length" class="pending">
      <h4>待领取成长 · 离队即解除</h4>
      <div
        v-for="offer in partyState.pendingGrowth"
        :key="offer.id"
        class="pending-row"
        :data-growth="offer.id"
      >
        <span
          ><b>{{ companionName(offer.companionId) }}</b> ·
          {{ offer.label }}</span
        >
        <button :disabled="locked" @click="emit('growth', offer.id)">
          领取
        </button>
      </div>
    </div>

    <div v-if="partyState.pendingSupplies.length" class="pending">
      <h4>已购补给 · 待领取（离队按原价退款）</h4>
      <div
        v-for="supply in partyState.pendingSupplies"
        :key="supply.id"
        class="pending-row"
        :data-supply="supply.id"
      >
        <span
          ><b>{{ companionName(supply.companionId) }}</b> ·
          {{ supply.name }}
          <small>已付 {{ supply.pricePaid }} 金</small></span
        >
        <button
          :disabled="locked || isDowned(supply.companionId)"
          @click="emit('supply', supply.id)"
        >
          使用
        </button>
      </div>
    </div>

    <div v-if="partyState.dismissed.length" class="dismissed">
      <h4>曾同行</h4>
      <p v-for="d in partyState.dismissed" :key="d.id">
        {{ d.sigil }} {{ d.name }} · 已离队，不再出战或共享生命
      </p>
    </div>
  </div>
</template>
