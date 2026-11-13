<script setup lang="ts">
import { rewardState, chooseReward } from "../model/state";
import { cards } from "@/shared/cards";
import { partyState, companionName } from "@/features/party";
defineEmits<{
  claim: [skip: boolean];
  growth: [offerId: string];
}>();
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">03 / THE SPOILS</span><span>三选一 + 同伴成长</span>
    </div>
    <h2>把胜利带进下一场</h2>
    <p class="muted">
      战斗结束后结算金币，并选择一张新牌；每名在队同伴还可领取一份成长。
      成长可稍后在牌组页领取，同伴离队时未领取的成长会被解除。
    </p>
    <div v-if="rewardState.offer && !rewardState.offer.claimed">
      <div class="notice">
        ✦ {{ rewardState.offer.gold }} 金币 · 回复
        {{ rewardState.offer.heal }} 生命
      </div>
      <div class="reward-options">
        <button
          v-for="key in rewardState.offer.cards"
          :key="key"
          :class="{ selected: rewardState.selected === key }"
          @click="chooseReward(key)"
        >
          <b>{{ cards[key]?.name }}</b
          ><small>{{ cards[key]?.text }}</small
          ><em>{{ cards[key]?.rarity }}</em>
        </button>
      </div>
      <div class="toolbar">
        <button
          :disabled="!rewardState.selected"
          data-action="claim"
          @click="$emit('claim', false)"
        >
          收下选中牌与战利品</button
        ><button data-action="skip-reward" @click="$emit('claim', true)">
          仅收取金币
        </button>
      </div>
    </div>
    <div v-else class="empty-mini">
      {{
        rewardState.offer?.claimed
          ? "战利品已收入行囊。下一段路线已开放。"
          : "战胜敌人，发现下一张关键卡牌。"
      }}
    </div>

    <div v-if="partyState.pendingGrowth.length" class="growth-block">
      <h3>同伴成长 · 可选奖励</h3>
      <div
        v-for="offer in partyState.pendingGrowth"
        :key="offer.id"
        class="growth-row"
        :data-growth="offer.id"
      >
        <div>
          <b>{{ companionName(offer.companionId) }}</b>
          <small>{{ offer.label }}</small>
        </div>
        <button @click="$emit('growth', offer.id)">立即领取</button>
      </div>
      <p class="muted">也可稍后在「牌组」页领取。</p>
    </div>
  </section>
</template>
