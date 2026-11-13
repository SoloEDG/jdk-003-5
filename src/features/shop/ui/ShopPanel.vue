<script setup lang="ts">
import { shopState, itemPrice } from "../model/state";
import { quoteMessage } from "../lib/pricing";
import { cards } from "@/shared/cards";
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
      </p>
      <div class="stock">
        <div v-for="item in shopState.stock" :key="item.id">
          <div>
            <b>{{ cards[item.card]?.name }}</b
            ><small>{{ cards[item.card]?.text }}</small>
          </div>
          <button
            :disabled="item.sold || gold < itemPrice(item.id)"
            :data-stock="item.id"
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
