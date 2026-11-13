<script setup lang="ts">
import { shopState, itemPrice } from "../model/state";
import { quoteMessage } from "../lib/pricing";
import { cards } from "@/shared/cards";
import { supplySpecs, companionName } from "@/features/party";
defineProps<{ gold: number }>();
defineEmits<{ buy: [id: string]; leave: [] }>();
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">04 / THE TRADER</span><span>旅途补给</span>
    </div>
    <h2>路上的旧相识</h2>
    <template v-if="shopState.open"
      ><p class="muted">
        {{
          quoteMessage(
            shopState.context!.influence.favor,
            shopState.context!.influence.scarcity,
          )
        }}
        · 同伴补给购买后进入待领取行囊，离队按原价退款。
      </p>
      <div class="stock">
        <div v-for="item in shopState.stock" :key="item.id" :data-stock="item.id">
          <div>
            <template v-if="item.kind === 'card'">
              <b>{{ cards[item.card!]?.name }}</b>
              <small>{{ cards[item.card!]?.text }}</small>
              <em v-if="item.companionId" class="owner-badge"
                >专属 · {{ companionName(item.companionId) }}</em
              >
            </template>
            <template v-else>
              <b
                >{{ supplySpecs[item.supply!].name }}
                <em class="owner-badge"
                  >· {{ companionName(item.companionId!) }}</em
                ></b
              >
              <small>{{ supplySpecs[item.supply!].description }}</small>
            </template>
          </div>
          <button
            :disabled="item.sold || gold < itemPrice(item.id)"
            @click="$emit('buy', item.id)"
          >
            {{ item.sold ? "已售出" : itemPrice(item.id) + " 金 · 购买" }}
          </button>
        </div>
      </div>
      <button data-action="leave-shop" @click="$emit('leave')">
        收好行囊，继续前进 →
      </button></template
    >
    <div v-else class="empty-mini">
      寻找路线上的天平标记。安路的好感让金币走得更远。
    </div>
  </section>
</template>
