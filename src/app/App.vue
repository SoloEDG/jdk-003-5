<script setup lang="ts">
import { computed } from "vue";
import { RouteMap, routeState } from "@/features/route";
import { BattlePanel, battleState } from "@/features/battle";
import { RewardPanel } from "@/features/reward";
import { ShopPanel } from "@/features/shop";
import { DeckPanel, deckState } from "@/features/deck";
import { regionNames } from "@/shared/domain";
import { session, switchTab } from "./session";
import { load } from "./persistence";
import * as commands from "./commands";
load();
const tabs = [
  ["route", "路线", "01"],
  ["battle", "战斗", "02"],
  ["reward", "奖励", "03"],
  ["shop", "商店", "04"],
  ["deck", "牌组", "05"],
];
const progress = computed(() => (routeState.visited.length / 9) * 100);
</script>
<template>
  <div class="workspace">
    <aside class="sidebar">
      <a class="brand" href="#"
        ><b>✺</b><span>EMBER<br /><strong>PATH</strong></span></a
      >
      <div class="edition">DECKBUILDING ODYSSEY<br />VOL. 01 / 余烬行旅</div>
      <nav>
        <button
          v-for="t in tabs"
          :key="t[0]"
          :class="{ active: session.tab === t[0] }"
          :data-tab="t[0]"
          @click="switchTab(t[0]!)"
        >
          <span>{{ t[2] }}</span
          >{{ t[1] }}<i>↗</i>
        </button>
      </nav>
      <div class="journey-status">
        <span class="eyebrow">EXPEDITION</span>
        <p>
          {{
            session.context ? regionNames[session.context.region] : "苔光林地"
          }}
        </p>
        <div class="progress"><i :style="{ width: progress + '%' }"></i></div>
        <small>{{ routeState.visited.length }} / 9 段旅程</small>
      </div>
      <button class="restart" data-action="restart" @click="commands.restart">
        ↻ 重新启程
      </button>
      <p class="save-label">◉ 本地自动保存</p>
    </aside>
    <main>
      <header>
        <div>
          <span class="eyebrow">A JOURNEY THROUGH THE ASHES</span>
          <h1>
            余烬行旅<span>
              / {{ tabs.find((t) => t[0] === session.tab)?.[1] }}</span
            >
          </h1>
        </div>
        <div class="resources">
          <div>
            <small>生命</small
            ><b
              >{{ deckState.hero.hp }}<em>/ {{ deckState.hero.maxHp }}</em></b
            >
          </div>
          <div>
            <small>金币</small><b class="gold">{{ deckState.hero.gold }}</b>
          </div>
          <div>
            <small>牌组</small><b>{{ deckState.cards.length }}</b>
          </div>
        </div>
      </header>
      <div class="message" role="status">
        <span>✦</span>{{ session.message
        }}<small>{{
          session.ended ? "旅途已结束" : "YOUR CHOICES ECHO FORWARD"
        }}</small>
      </div>
      <div class="content-grid">
        <div class="main-panel">
          <RouteMap
            v-if="session.tab === 'route'"
            @enter="commands.navigate"
          /><BattlePanel
            v-else-if="session.tab === 'battle'"
            @play="commands.play"
            @end="commands.turn"
            @settle="commands.settle"
          /><RewardPanel
            v-else-if="session.tab === 'reward'"
            @claim="commands.claim"
          /><ShopPanel
            v-else-if="session.tab === 'shop'"
            :gold="deckState.hero.gold"
            @buy="commands.buy"
            @leave="commands.leaveShop"
          /><DeckPanel
            v-else
            :camp="session.context?.kind === 'camp' && !routeState.resolved"
            :locked="battleState.phase === 'playing'"
            @upgrade="commands.upgrade"
            @remove="commands.remove"
            @camp="commands.camp"
          />
        </div>
        <aside class="right-rail">
          <div class="rail-art">
            <span>IX</span
            ><svg viewBox="0 0 240 220" aria-hidden="true">
              <circle cx="120" cy="95" r="64" />
              <path
                d="M120 20 165 95 120 175 75 95Z M120 50 142 95 120 138 98 95Z M15 190 225 190 M40 202 200 202 M120 175 120 215"
              />
              <path d="M60 160 45 120 70 70 M180 160 195 120 170 70" /></svg
            ><b>火种，不会自行熄灭。</b><small>THE EMBER REMEMBERS</small>
          </div>
          <div class="rail-card">
            <span class="eyebrow">PATH INFLUENCE</span>
            <div>
              <b>{{ routeState.influence.heat }}</b
              ><span>威胁<small>敌人强度 / 稀有奖励</small></span>
            </div>
            <div>
              <b>{{ routeState.influence.favor }}</b
              ><span>好感<small>商店折扣 / 额外金币</small></span>
            </div>
            <div>
              <b>{{ routeState.influence.scarcity }}</b
              ><span>稀缺<small>后续商店涨价</small></span>
            </div>
          </div>
          <p class="rail-note">“一副牌，一条路。<br />你带走的不止是胜利。”</p>
        </aside>
      </div>
      <footer>
        EMBER PATH <span>策略牌组 · 分支旅途 · 状态连锁</span> BUILD 1.0
      </footer>
    </main>
  </div>
</template>
