<script setup lang="ts">
import { computed } from "vue";
import { routeState, choices, previewRoute } from "../model/state";
import { regionNames } from "@/shared/domain";
const emit = defineEmits<{ enter: [id: string] }>();
const allowed = computed(() => choices());
const layers = computed(() =>
  Array.from({ length: 9 }, (_, d) =>
    routeState.nodes.filter((n) => n.depth === d),
  ),
);
const symbols = { battle: "⚔", elite: "♜", shop: "⚖", camp: "♨", boss: "◈" };
</script>
<template>
  <section class="panel route-panel">
    <div class="section-top">
      <span class="eyebrow">01 / THE PATH</span
      ><span>已走 {{ routeState.visited.length }} / 9</span>
    </div>
    <h2>每一步，留下回响</h2>
    <p class="muted">
      林地 → 熔铁边境 → 无声深渊。险路增加敌人力量与稀有奖励，安路积累商人好感。
    </p>
    <div class="route-scroll">
      <div v-for="(layer, d) in layers" :key="d" class="route-row">
        <span class="depth">{{ d + 1 }}</span
        ><button
          v-for="node in layer"
          :key="node.id"
          :data-node="node.id"
          class="route-node"
          :class="{
            available: allowed.includes(node.id),
            visited: routeState.visited.includes(node.id),
          }"
          :disabled="!allowed.includes(node.id)"
          @mouseenter="previewRoute(node.id)"
          @mouseleave="previewRoute('')"
          @click="emit('enter', node.id)"
        >
          <b>{{ symbols[node.kind] }}</b
          ><span
            >{{ node.title
            }}<small
              >{{ regionNames[node.region] }} ·
              {{ node.lane ? "威胁 +1 / 稀缺 +1" : "好感 +1" }}</small
            ></span
          ><i>{{ routeState.visited.includes(node.id) ? "✓" : "↗" }}</i>
        </button>
      </div>
    </div>
    <div v-if="routeState.preview" class="notice">
      路途预览 · 威胁 {{ routeState.preview.influence.heat }} / 好感
      {{ routeState.preview.influence.favor }} / 稀缺
      {{ routeState.preview.influence.scarcity }}
    </div>
  </section>
</template>
